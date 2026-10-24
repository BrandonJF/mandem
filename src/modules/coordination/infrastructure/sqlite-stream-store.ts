/** @fileoverview Versioned SQLite stops and atomic, parsed mailbox routing. */
import type { Database } from "bun:sqlite";
import type { StreamStore } from "../application/ports/stream-store";
import type { NewStopRecord, ObservableState, StopRecord, StreamDelivery } from "../domain/streams";
import type { PlaneMessage } from "../domain/types";
import { parseClaim, parseMessage, parseNewStop, parseObservation, parseStoredDelivery, parseStoredStop, record } from "../domain/stream-values";

function json(value: unknown): unknown { if (typeof value !== "string") throw new Error("Expected persisted JSON text"); return JSON.parse(value); }

export function createSqliteStreamStore(db: Database): StreamStore {
  db.exec(`CREATE TABLE IF NOT EXISTS stream_stops (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS stream_observations (session TEXT PRIMARY KEY, assignment TEXT NOT NULL, idle_since TEXT, state TEXT, generation INTEGER NOT NULL, stop_boundary INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS stream_claims (stream TEXT PRIMARY KEY, session TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS stream_routes (route_key TEXT PRIMARY KEY, version INTEGER NOT NULL, owner TEXT NOT NULL, message_id INTEGER NOT NULL REFERENCES messages(id));`);
  function delivery(key: string): StreamDelivery | undefined {
    const value = db.query<unknown, [string]>(`SELECT r.version, r.owner, m.id, m.payload, m.acked_by FROM stream_routes r JOIN messages m ON m.id=r.message_id WHERE r.route_key=?`).get(key);
    if (!value) return undefined;
    const row = record(value); const payload = record(json(row.payload));
    return parseStoredDelivery({ version: row.version, owner: row.owner, message: { ...payload, id: String(row.id), ackedBy: json(row.acked_by) } });
  }
  function observation(session: string) {
    const value = db.query<unknown, [string]>("SELECT assignment,idle_since,state,generation,stop_boundary FROM stream_observations WHERE session=?").get(session);
    return value ? parseObservation(value) : undefined;
  }
  const content = (stop: NewStopRecord) => JSON.stringify([stop.id, stop.session, stop.stream, stop.ownerRole, stop.assignment, stop.kind, stop.waiting_on, stop.need]);
  const save = db.transaction((value: NewStopRecord) => {
    const input = parseNewStop(value);
    const existing = db.query<unknown, [string]>("SELECT payload FROM stream_stops WHERE id=?").get(input.id);
    if (existing) {
      const prior = parseStoredStop(json(record(existing).payload));
      if (content(prior) !== content(input)) throw new Error("Stop ID already records different content or assignment");
      return prior;
    }
    const saved = observation(input.session); const current = saved?.assignment === input.assignment ? saved : undefined;
    const stop: StopRecord = { ...input, version: 1, generation: current?.generation ?? 0 };
    db.query("INSERT INTO stream_stops(id,payload) VALUES (?,?)").run(stop.id, JSON.stringify(stop));
    db.query("INSERT INTO stream_observations(session,assignment,idle_since,state,generation,stop_boundary) VALUES (?,?,?,?,?,1) ON CONFLICT(session) DO UPDATE SET assignment=excluded.assignment,idle_since=excluded.idle_since,state=excluded.state,generation=excluded.generation,stop_boundary=1")
      .run(input.session, input.assignment, current?.idleSince ?? null, current?.state ?? null, stop.generation);
    return stop;
  });
  const observe = db.transaction((session: string, assignment: string, state: ObservableState, now: string) => {
    const saved = observation(session); const prior = saved?.assignment === assignment ? saved : undefined;
    const resumed = state === "working" && prior && (prior.stopBoundary || (prior.state !== null && prior.state !== "working"));
    const generation = (prior?.generation ?? 0) + (resumed ? 1 : 0);
    const idle = state === "working" ? null : prior?.idleSince ?? now;
    db.query("INSERT INTO stream_observations(session,assignment,idle_since,state,generation,stop_boundary) VALUES (?,?,?,?,?,?) ON CONFLICT(session) DO UPDATE SET assignment=excluded.assignment,idle_since=excluded.idle_since,state=excluded.state,generation=excluded.generation,stop_boundary=excluded.stop_boundary")
      .run(session, assignment, idle, state, generation, state === "working" ? 0 : prior?.stopBoundary ? 1 : 0);
    return parseObservation({ assignment, idle_since: idle, state, generation, stop_boundary: state === "working" ? 0 : prior?.stopBoundary ? 1 : 0 });
  });
  const route = db.transaction((key: string, owner: string, input: Omit<PlaneMessage, "id" | "ackedBy">): StreamDelivery & { created: boolean } => {
    const existing = delivery(key); if (existing) return { ...existing, created: false };
    const value = db.query<unknown, [string, string]>("INSERT INTO messages(topic,payload) VALUES (?,?) RETURNING id").get(input.topic, JSON.stringify(input));
    if (!value) throw new Error("SQLite did not return a routed message ID");
    const message = parseMessage({ ...input, id: String(record(value).id), ackedBy: [] });
    db.query("INSERT INTO stream_routes(route_key,version,owner,message_id) VALUES (?,1,?,?)").run(key, owner, message.id);
    return { version: 1, owner, message, created: true };
  });
  return {
    async saveStop(stop) { return save.immediate(stop); },
    async listStops() { return db.query<unknown, []>("SELECT payload FROM stream_stops ORDER BY id").all().map(row => parseStoredStop(json(record(row).payload))); },
    async observe(session, assignment, state, now) { return observe.immediate(session, assignment, state, now); },
    async claim(stream, session) {
      if (session === null) db.query("DELETE FROM stream_claims WHERE stream=?").run(stream);
      else db.query("INSERT INTO stream_claims(stream,session) VALUES (?,?) ON CONFLICT(stream) DO UPDATE SET session=excluded.session").run(stream, session);
    },
    async claims() { return db.query<unknown, []>("SELECT stream,session FROM stream_claims ORDER BY stream").all().map(parseClaim); },
    async delivery(key) { return delivery(key); },
    async routeOnce(key, owner, message) { return route.immediate(key, owner, message); },
  };
}
