/** @fileoverview SQLite durability and shared-file atomicity tests under Bun. */
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openCoordinationStores } from "../infrastructure/sqlite-stores";

const directories: string[] = [];
afterEach(() => { for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
function databasePath() {
  const dir = mkdtempSync(join(tmpdir(), "mandem-coord-"));
  directories.push(dir);
  return join(dir, "coord.sqlite");
}

test("messages, idempotent receipts and one session row survive reopening", async () => {
  const path = databasePath();
  let stores = openCoordinationStores(path);
  const input = { topic: "session:engineer", type: "handoff", subject: "#51", sender: "orchestrator", ts: "2026-10-23T00:00:00.000Z", data: { body: "Implement" } };
  for (let i = 0; i < 12; i++) await stores.messageStore.append(input);
  await stores.messageStore.ack("10", "engineer");
  await stores.messageStore.ack("10", "engineer");
  for (let i = 0; i < 100; i++) await stores.sessionStore.register({ session: "engineer", role: "engineer", data: { heartbeat: i } });
  stores.close();
  stores = openCoordinationStores(path);
  try {
    const messages = await stores.messageStore.read(input.topic, "9");
    expect(messages.map(m => m.id)).toEqual(["10", "11", "12"]);
    expect(messages[0]).toEqual({ ...input, id: "10", ackedBy: ["engineer"] });
    expect(await stores.messageStore.listTopics()).toEqual([input.topic]);
    expect(await stores.sessionStore.list()).toHaveLength(1);
    expect((await stores.sessionStore.get("engineer"))?.data).toEqual({ heartbeat: 99 });
    expect(await stores.sessionStore.get("missing")).toBeUndefined();
  } finally { stores.close(); }
});

test("separate connections cannot steal a live lock, can refresh and recover after TTL", async () => {
  const path = databasePath();
  const a = openCoordinationStores(path);
  const b = openCoordinationStores(path);
  const now = new Date("2026-10-23T00:00:00.000Z");
  try {
    expect((await a.mergeLockStore.acquire("merge", "a", 10, now)).acquired).toBe(true);
    expect((await b.mergeLockStore.acquire("merge", "b", 10, now)).acquired).toBe(false);
    expect(await b.mergeLockStore.release("merge", "b")).toEqual({ released: false });
    expect((await a.mergeLockStore.acquire("merge", "a", 20, now)).acquired).toBe(true);
    expect((await b.mergeLockStore.acquire("merge", "b", 10, new Date(now.getTime() + 20_000))).acquired).toBe(false);
    expect((await b.mergeLockStore.acquire("merge", "b", 10, new Date(now.getTime() + 20_001))).acquired).toBe(true);
  } finally { a.close(); b.close(); }
  const reopened = openCoordinationStores(path);
  try {
    expect((await reopened.mergeLockStore.status("merge", new Date(now.getTime() + 21_000))).view?.holder).toBe("b");
    expect(await reopened.mergeLockStore.release("merge", "a")).toEqual({ released: false });
    expect(await reopened.mergeLockStore.release("merge", "b")).toEqual({ released: true });
    expect(await reopened.mergeLockStore.status("merge", now)).toEqual({ held: false });
  } finally { reopened.close(); }
});
