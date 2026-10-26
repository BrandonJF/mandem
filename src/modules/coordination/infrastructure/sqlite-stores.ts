/** @fileoverview Durable coordination stores using Bun SQLite and atomic writes. */
import { Database } from "bun:sqlite";
import { createSqliteSlotStore } from "./sqlite-slot-store";
import { createSqliteReviewStore } from "./sqlite-review-store";
import { createSqliteStreamStore } from "./sqlite-stream-store";
import type { MessageStore, PlaneMessage } from "../application/ports/message-store";
import type { SessionRecord, SessionStore } from "../application/ports/session-store";
import type { MergeLockRecord, MergeLockStore, MergeLockView } from "../application/ports/merge-lock-store";

function view(row: MergeLockRecord, now: Date): MergeLockView {
  const expires = Date.parse(row.acquiredAt) + row.ttlSeconds * 1000;
  return { ...row, expiresAt: new Date(expires).toISOString(), expired: expires < now.getTime() };
}

export function openCoordinationStores(path: string) {
  const db = new Database(path, { create: true, strict: true });
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, topic TEXT NOT NULL,
      payload TEXT NOT NULL, acked_by TEXT NOT NULL DEFAULT '[]');
    CREATE INDEX IF NOT EXISTS messages_topic_id ON messages(topic, id);
    CREATE TABLE IF NOT EXISTS sessions (session TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS merge_locks (
      name TEXT PRIMARY KEY, holder TEXT NOT NULL, acquiredAt TEXT NOT NULL,
      ttlSeconds INTEGER NOT NULL, acquired_ms INTEGER NOT NULL);`);

  const messageStore: MessageStore = {
    async append(input) {
      const payload = { topic: input.topic, type: input.type, subject: input.subject,
        sender: input.sender, ts: input.ts ?? new Date().toISOString(),
        ...(input.data !== undefined ? { data: input.data } : {}) };
      const row = db.query<{ id: number }, [string | null, string, string, string]>(
        "INSERT INTO messages(id, topic, payload, acked_by) VALUES (?, ?, ?, ?) RETURNING id",
      ).get(input.id ?? null, input.topic, JSON.stringify(payload), JSON.stringify(input.ackedBy ?? []));
      if (!row) throw new Error("SQLite did not return a message ID");
      return { ...payload, id: String(row.id), ackedBy: input.ackedBy ?? [] };
    },
    async read(topic, sinceId) {
      const rows = db.query<{ id: number; payload: string; acked_by: string }, [string, string]>(
        "SELECT id, payload, acked_by FROM messages WHERE topic = ? AND id > CAST(? AS INTEGER) ORDER BY id",
      ).all(topic, sinceId ?? "0");
      return rows.map(row => ({ ...JSON.parse(row.payload), id: String(row.id), ackedBy: JSON.parse(row.acked_by) }) as PlaneMessage);
    },
    async ack(id, session) {
      db.query(`UPDATE messages SET acked_by = json_insert(acked_by, '$[#]', ?)
        WHERE id = ? AND NOT EXISTS (SELECT 1 FROM json_each(acked_by) WHERE value = ?)`
      ).run(session, id, session);
    },
    async listTopics() {
      return db.query<{ topic: string }, []>("SELECT DISTINCT topic FROM messages ORDER BY topic").all().map(row => row.topic);
    },
  };
  const sessionStore: SessionStore = {
    async register(input) {
      const record = { ...input, ts: input.ts ?? new Date().toISOString() };
      db.query("INSERT INTO sessions(session, payload) VALUES (?, ?) ON CONFLICT(session) DO UPDATE SET payload=excluded.payload")
        .run(record.session, JSON.stringify(record));
      return record;
    },
    async list() {
      return db.query<{ payload: string }, []>("SELECT payload FROM sessions ORDER BY session").all().map(row => JSON.parse(row.payload) as SessionRecord);
    },
    async get(session) {
      const row = db.query<{ payload: string }, [string]>("SELECT payload FROM sessions WHERE session=?").get(session);
      return row ? JSON.parse(row.payload) as SessionRecord : undefined;
    },
  };
  const readLock = (name: string) => db.query<MergeLockRecord, [string]>(
    "SELECT name, holder, acquiredAt, ttlSeconds FROM merge_locks WHERE name=?",
  ).get(name);
  const acquire = db.transaction((name: string, holder: string, ttlSeconds: number, now: Date) => {
    const acquired = db.query<MergeLockRecord, [string, string, string, number, number, number]>(`
      INSERT INTO merge_locks(name, holder, acquiredAt, ttlSeconds, acquired_ms) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET holder=excluded.holder, acquiredAt=excluded.acquiredAt,
        ttlSeconds=excluded.ttlSeconds, acquired_ms=excluded.acquired_ms
      WHERE merge_locks.holder=excluded.holder OR merge_locks.acquired_ms + merge_locks.ttlSeconds*1000 < ?
      RETURNING name, holder, acquiredAt, ttlSeconds`
    ).get(name, holder, now.toISOString(), ttlSeconds, now.getTime(), now.getTime());
    const row = acquired ?? readLock(name);
    if (!row) throw new Error("SQLite lock disappeared during acquisition");
    return { acquired: acquired !== null, view: view(row, now) };
  });
  const mergeLockStore: MergeLockStore = {
    async acquire(name, holder, ttlSeconds, now = new Date()) {
      if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) throw new Error("ttlSeconds must be a positive integer");
      return acquire.immediate(name, holder, ttlSeconds, now);
    },
    async release(name, holder) {
      return { released: db.query("DELETE FROM merge_locks WHERE name=? AND holder=?").run(name, holder).changes > 0 };
    },
    async status(name, now = new Date()) {
      const row = readLock(name);
      if (!row) return { held: false };
      const current = view(row, now);
      return { held: !current.expired, view: current };
    },
  };
  return { messageStore, sessionStore, mergeLockStore, slotStore: createSqliteSlotStore(db), reviewStore: createSqliteReviewStore(db), streamStore: createSqliteStreamStore(db), close: () => db.close() };
}
