/** @fileoverview Durable serialized repair effects across concurrent checks, restart and stale facts. */
import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { openCoordinationStores } from "../infrastructure/sqlite-stores";
import { createRepairDispatcher } from "../application/repair-dispatch";
import type { RepairConsumer } from "../application/ports/repair-store";
import type { RepairEffect, RepairSnapshot } from "../domain/repairs";
const repository = "team/project"; const now = () => new Date("2026-10-25T20:00:00.000Z");
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function database() { const parent = join(homedir(), ".local/state/mandem/test-fixtures"); mkdirSync(parent, { recursive: true, mode: 0o700 }); const root = mkdtempSync(join(parent, "repairs-")); roots.push(root); return join(root, "coord.sqlite"); }
function snapshot(): RepairSnapshot { return { repository, observedAt: now().toISOString(), main: { state: "red", head: "a".repeat(40) }, issue: { ref: { repository, number: 9 }, state: "open", priority: 0 }, pulls: [{ ref: { repository, number: 1 }, head: "b".repeat(40), createdAt: "2026-10-24T20:00:00.000Z", open: true, draft: false, ready: true, base: "main", linkedIssues: [{ repository, number: 9 }] }] }; }
function consumer(value: RepairSnapshot, applied: RepairEffect[]): RepairConsumer { return { async observe() { return value; }, async apply(effect) { applied.push(effect); } }; }
test("concurrent SQLite connections apply the same exact target once and retain completion after restart", async () => {
  const path = database(); let first = openCoordinationStores(path); const second = openCoordinationStores(path); const applied: RepairEffect[] = [];
  const options = { repository, consumer: consumer(snapshot(), applied), now };
  try {
    await Promise.all([createRepairDispatcher({ ...options, store: first.repairStore }).check(), createRepairDispatcher({ ...options, store: second.repairStore }).check()]);
    expect(applied).toHaveLength(1); expect(applied[0]?.target).toEqual({ repository, main: "a".repeat(40), issue: { repository, number: 9 }, number: 1, head: "b".repeat(40) });
    first.close(); first = openCoordinationStores(path);
    await createRepairDispatcher({ ...options, store: first.repairStore }).check(); expect(applied).toHaveLength(1);
  } finally { first.close(); second.close(); }
});
test("an uncertain designation never replays or clears behind an unknown outcome", async () => {
  const path = database(); let stores = openCoordinationStores(path); const value = snapshot(); const applied: RepairEffect[] = [];
  const effects = consumer(value, applied); effects.apply = async effect => { applied.push(effect); throw new Error("lost write receipt"); };
  try {
    expect((await createRepairDispatcher({ repository, consumer: effects, store: stores.repairStore, now }).check()).status.kind).toBe("diagnostic");
    stores.close(); stores = openCoordinationStores(path); value.main = { state: "green", head: "c".repeat(40) };
    await createRepairDispatcher({ repository, consumer: effects, store: stores.repairStore, now }).check(); expect(applied).toHaveLength(1);
  } finally { stores.close(); }
});
test("changed PR heads and main health replace then clear the designation once", async () => {
  const stores = openCoordinationStores(database()); const value = snapshot(); const applied: RepairEffect[] = [];
  const dispatch = createRepairDispatcher({ repository, consumer: consumer(value, applied), store: stores.repairStore, now });
  try {
    await dispatch.check(); const pull = value.pulls[0]; if (!pull) throw new Error("Missing fixture");
    pull.head = "d".repeat(40); await dispatch.check();
    value.main = { state: "green", head: "c".repeat(40) }; await dispatch.check(); await dispatch.check();
    expect(applied.map(effect => effect.target?.head ?? null)).toEqual(["b".repeat(40), "d".repeat(40), null]);
  } finally { stores.close(); }
});
test("stale, future and wrong-repository sources fail before policy writes", async () => {
  const stores = openCoordinationStores(database()); const value = snapshot(); const applied: RepairEffect[] = [];
  const dispatch = createRepairDispatcher({ repository, consumer: consumer(value, applied), store: stores.repairStore, now });
  try {
    value.observedAt = "2026-10-25T19:54:00.000Z"; await expect(dispatch.check()).rejects.toThrow("stale");
    value.observedAt = "2026-10-25T20:01:00.000Z"; await expect(dispatch.check()).rejects.toThrow("future");
    value.observedAt = now().toISOString(); value.repository = "other/project"; await expect(dispatch.check()).rejects.toThrow();
    expect(applied).toHaveLength(0);
  } finally { stores.close(); }
});
test("a later observation waits for the in-flight write then applies only its current correction", async () => {
  const stores = openCoordinationStores(database()); const value = snapshot(); const applied: RepairEffect[] = [];
  let entered!: () => void; const started = new Promise<void>(resolve => { entered = resolve; });
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  const effects = consumer(value, applied); effects.apply = async effect => { applied.push(effect); if (applied.length === 1) { entered(); await gate; } };
  const dispatch = createRepairDispatcher({ repository, consumer: effects, store: stores.repairStore, now });
  const first = dispatch.check();
  try {
    await started; value.main = { state: "green", head: "c".repeat(40) }; await dispatch.check();
    expect(applied).toHaveLength(1); release(); await first;
    expect(applied.map(effect => effect.target === null)).toEqual([false, true]);
  } finally { release(); await dispatch.drain(); stores.close(); }
});
