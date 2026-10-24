/** @fileoverview Stream store contracts on real SQLite, including corrupt persistence. */
import { afterEach, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { NewStopRecord } from "../domain/streams";
import { openCoordinationStores } from "../infrastructure/sqlite-stores";

const cleanups: (() => void)[] = [];
afterEach(() => { for (const close of cleanups.splice(0)) close(); });
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "stream-contract-"));
  const path = join(directory, "coord.sqlite");
  const stores = openCoordinationStores(path); const raw = new Database(path);
  cleanups.push(() => { raw.close(); stores.close(); rmSync(directory, { recursive: true, force: true }); });
  return { ...stores, raw, path };
}
const done: NewStopRecord = { id: "stop-1", session: "engineer", stream: "issue:55", ownerRole: { kind: "role", name: "orchestrator" }, assignment: "run-1", kind: "done", ts: "2026-10-23T00:00:00Z" };

test("a stop is an episode boundary even before the first activity observation", async () => {
  const { streamStore } = fixture(); const stop = await streamStore.saveStop(done);
  const working = await streamStore.observe(done.session, done.assignment, "working", done.ts);
  expect(working.generation).toBeGreaterThan(stop.generation);
  const idle = await streamStore.observe(done.session, done.assignment, "idle", done.ts);
  expect(idle.generation).toBe(working.generation); expect(idle.idleSince).toBe(done.ts);
});

test("identical retry preserves the original record after activity resumes", async () => {
  const { streamStore } = fixture(); const original = await streamStore.saveStop(done);
  await streamStore.observe(done.session, done.assignment, "working", done.ts);
  expect(await streamStore.saveStop({ ...done, ts: "2026-10-23T00:01:00Z" })).toEqual(original);
});

test("unrecognized persisted stop versions fail at the read boundary", async () => {
  const { streamStore, raw } = fixture(); const stop = await streamStore.saveStop(done);
  raw.query("UPDATE stream_stops SET payload=? WHERE id=?").run(JSON.stringify({ ...stop, version: 99 }), stop.id);
  await expect(streamStore.listStops()).rejects.toThrow("version");
});

test("malformed persisted delivery messages fail at the read boundary", async () => {
  const { streamStore, raw } = fixture();
  await streamStore.routeOnce("route-1", "owner", { topic: "session:owner", sender: "mandem-streams", type: "stream.need", subject: "issue:55", ts: done.ts });
  raw.query("UPDATE messages SET payload=?").run(JSON.stringify({ topic: "session:owner" }));
  await expect(streamStore.delivery("route-1")).rejects.toThrow();
});

test("stored records require generation and delivery version", async () => {
  const { streamStore, raw } = fixture(); const stop = await streamStore.saveStop(done);
  raw.query("UPDATE stream_stops SET payload=?").run(JSON.stringify({ ...stop, generation: undefined }));
  await expect(streamStore.listStops()).rejects.toThrow("generation");
  await streamStore.routeOnce("route-1", "owner", { topic: "session:owner", sender: "mandem-streams", type: "stream.need", subject: "issue:55", ts: done.ts });
  raw.query("UPDATE stream_routes SET version=2").run();
  await expect(streamStore.delivery("route-1")).rejects.toThrow("version");
});

test("long valid needs round trip without treating JSON payloads as bounded lines", async () => {
  const { streamStore } = fixture();
  const input: NewStopRecord = { ...done, id: "long-need", kind: "blocked", need: "x".repeat(512), waiting_on: { kind: "user" } };
  const stored = await streamStore.saveStop(input); expect(await streamStore.listStops()).toEqual([stored]);
});

test("routing is atomic across connections and invalid payloads roll back", async () => {
  const f = fixture(); const second = openCoordinationStores(f.path);
  const message = { topic: "session:owner", sender: "mandem-streams", type: "stream.need", subject: "issue:55", ts: done.ts };
  try {
    const routed = await Promise.all([f.streamStore.routeOnce("same", "owner", message), second.streamStore.routeOnce("same", "owner", message)]);
    expect(routed.map(row => row.created)).toEqual([true, false]);
    expect(await f.messageStore.read("session:owner")).toHaveLength(1);
    await expect(f.streamStore.routeOnce("invalid", "owner", { ...message, subject: "" })).rejects.toThrow();
    expect(await f.streamStore.delivery("invalid")).toBeUndefined();
    expect(await f.messageStore.read("session:owner")).toHaveLength(1);
  } finally { second.close(); }
});
