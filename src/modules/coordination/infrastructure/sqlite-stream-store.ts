/** @fileoverview Atomic SQLite stop storage, idle observation and deduplicated mailbox routing. */
import type { Database } from "bun:sqlite";
import type { StreamStore } from "../application/ports/stream-store";
import type { StopRecord, StreamDelivery } from "../domain/streams";
import type { PlaneMessage } from "../domain/types";

export function createSqliteStreamStore(db: Database): StreamStore {
  db.exec(`CREATE TABLE IF NOT EXISTS stream_stops (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS stream_observations (session TEXT PRIMARY KEY, assignment TEXT NOT NULL, idle_since TEXT, state TEXT NOT NULL, generation INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS stream_claims (stream TEXT PRIMARY KEY, session TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS stream_routes (route_key TEXT PRIMARY KEY, owner TEXT NOT NULL, message_id INTEGER NOT NULL REFERENCES messages(id));`);
  function delivery(key: string): StreamDelivery | undefined {
    const row = db.query<{ owner: string; id: number; payload: string; acked_by: string }, [string]>(
      `SELECT r.owner, m.id, m.payload, m.acked_by FROM stream_routes r JOIN messages m ON m.id=r.message_id WHERE r.route_key=?`,
    ).get(key);
    return row ? { owner: row.owner, message: { ...JSON.parse(row.payload), id: String(row.id), ackedBy: JSON.parse(row.acked_by) } as PlaneMessage } : undefined;
  }
  const observation = (session: string) => db.query<{ assignment: string; idle_since: string | null; state: string; generation: number }, [string]>("SELECT assignment,idle_since,state,generation FROM stream_observations WHERE session=?").get(session);
  const save = db.transaction((input: StopRecord) => {
    const current = observation(input.session);
    const stop = { ...input, generation: current?.assignment === input.assignment ? current.generation : 0 };
    const existing = db.query<{ payload: string }, [string]>("SELECT payload FROM stream_stops WHERE id=?").get(stop.id);
    if (existing) {
      const prior = JSON.parse(existing.payload) as StopRecord;
      if (JSON.stringify({ ...prior, ts: "" }) !== JSON.stringify({ ...stop, ts: "" })) throw new Error("Stop ID already records different content or assignment");
      return prior;
    }
    db.query("INSERT INTO stream_stops(id,payload) VALUES (?,?)").run(stop.id, JSON.stringify(stop));
    return stop;
  });
  const observe = db.transaction((session: string, assignment: string, state: string, now: string) => {
    const saved = observation(session);
    const prior = saved?.assignment === assignment ? saved : undefined;
    const generation = (prior?.generation ?? 0) + (state === "working" && prior && prior.state !== "working" ? 1 : 0);
    const idle = state === "working" ? null : prior?.idle_since ?? now;
    db.query("INSERT INTO stream_observations(session,assignment,idle_since,state,generation) VALUES (?,?,?,?,?) ON CONFLICT(session) DO UPDATE SET assignment=excluded.assignment,idle_since=excluded.idle_since,state=excluded.state,generation=excluded.generation").run(session, assignment, idle, state, generation);
    return { ...(idle ? { idleSince: idle } : {}), generation };
  });
  const route = db.transaction((key: string, owner: string, message: Omit<PlaneMessage, "id" | "ackedBy">) => {
    const existing = delivery(key);
    if (existing) return { ...existing, created: false };
    const row = db.query<{ id: number }, [string, string]>("INSERT INTO messages(topic,payload) VALUES (?,?) RETURNING id").get(message.topic, JSON.stringify(message));
    if (!row) throw new Error("SQLite did not return a routed message ID");
    db.query("INSERT INTO stream_routes(route_key,owner,message_id) VALUES (?,?,?)").run(key, owner, row.id);
    return { owner, message: { ...message, id: String(row.id), ackedBy: [] }, created: true };
  });
  return {
    async saveStop(stop) { return save.immediate(stop); },
    async listStops() { return db.query<{ payload: string }, []>("SELECT payload FROM stream_stops ORDER BY id").all().map(row => JSON.parse(row.payload) as StopRecord); },
    async observe(session, assignment, state, now) { return observe.immediate(session, assignment, state, now); },
    async claim(stream, session) {
      if (session === null) db.query("DELETE FROM stream_claims WHERE stream=?").run(stream);
      else db.query("INSERT INTO stream_claims(stream,session) VALUES (?,?) ON CONFLICT(stream) DO UPDATE SET session=excluded.session").run(stream, session);
    },
    async claims() { return db.query<{ stream: string; session: string }, []>("SELECT stream,session FROM stream_claims ORDER BY stream").all(); },
    async delivery(key) { return delivery(key); },
    async routeOnce(key, owner, message) { return route.immediate(key, owner, message); },
  };
}
