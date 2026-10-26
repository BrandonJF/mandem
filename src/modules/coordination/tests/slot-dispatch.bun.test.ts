/** @fileoverview SQLite and dispatcher regressions for stop-bound release and concurrent refill. */
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openCoordinationStores } from "../infrastructure/sqlite-stores";
import { createSlotDispatcher } from "../application/slot-dispatch";
import type { SlotConsumer } from "../application/ports/slot-store";
import type { SlotIssue, SlotSnapshot, SlotTask } from "../domain/slots";
const repository = "team/project"; const template = { name: "engineer", revision: "1" };
const now = () => new Date("2026-10-25T20:00:00.000Z");
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function database() { const root = mkdtempSync(join(tmpdir(), "slots-")); roots.push(root); return join(root, "coord.sqlite"); }
function issue(number: number, kind: "product" | "platform" = "product"): SlotIssue { return { ref: { repository, number }, revision: "1", state: "open", kind, priority: 1, estimate: 1, outcome: "Save work", scope: "One change", acceptance: "Test passes", blocked: false, userDecision: false, openPull: false, openDependencies: [] }; }
function snapshot(): SlotSnapshot {
  return { repository, observedAt: now().toISOString(), issues: [issue(1), issue(2, "platform")], main: { state: "green", head: "a".repeat(40) }, diagnostics: [],
    owners: [100,101,102,103].map(number => ({ session: `owner-${number}`, assignment: `assignment-${number}`, ref: { repository, number }, kind: number < 102 ? "product" : "platform", priority: 1, state: "working", released: false })) };
}
async function register(stores: ReturnType<typeof openCoordinationStores>, observed: SlotSnapshot) {
  for (const owner of observed.owners) await stores.sessionStore.register({ session: owner.session, role: "engineer", data: { stream: `issue:${owner.ref.number}`, streamAssignment: owner.assignment, ownerRole: "orchestrator" } });
}
async function stop(stores: ReturnType<typeof openCoordinationStores>) {
  await stores.streamStore.saveStop({ id: "done-100", session: "owner-100", stream: "issue:100", assignment: "assignment-100", ownerRole: { kind: "role", name: "orchestrator" }, kind: "done", ts: now().toISOString() });
}
function consumer(observed: SlotSnapshot, launched: SlotTask[]): SlotConsumer {
  return { async observe() { return observed; }, async launch(task) { launched.push(task); return { session: `engineer-${task.issue.ref.number}`, paneId: "fake:p1" }; }, async report() {} };
}
test("a current typed stop refills product once, atomically records its owner and survives restart", async () => {
  const path = database(); let stores = openCoordinationStores(path); const observed = snapshot(); const launches: SlotTask[] = [];
  await register(stores, observed); await stop(stores);
  const options = { repository, template, consumer: consumer(observed, launches), now };
  try {
    await createSlotDispatcher({ ...options, store: stores.slotStore }).check();
    expect(launches.map(task => task.issue.ref.number)).toEqual([1]);
    const owner = await stores.sessionStore.get("engineer-1");
    expect(owner?.role).toBe("engineer"); expect(owner?.data?.streamAssignment).toBe(launches[0]?.id);
    stores.close(); stores = openCoordinationStores(path);
    await createSlotDispatcher({ ...options, store: stores.slotStore }).check();
    expect(launches).toHaveLength(1);
  } finally { stores.close(); }
});
test("concurrent connections reserve the same free slot only once", async () => {
  const path = database(); const first = openCoordinationStores(path); const second = openCoordinationStores(path); const observed = snapshot(); const launches: SlotTask[] = [];
  await register(first, observed); await stop(first);
  const options = { repository, template, consumer: consumer(observed, launches), now };
  try {
    await Promise.all([createSlotDispatcher({ ...options, store: first.slotStore }).check(), createSlotDispatcher({ ...options, store: second.slotStore }).check()]);
    expect(launches).toHaveLength(1);
  } finally { first.close(); second.close(); }
});
test("consumer release claims and stale stop generations cannot manufacture a free slot", async () => {
  const stores = openCoordinationStores(database()); const observed = snapshot(); const launches: SlotTask[] = [];
  await register(stores, observed);
  observed.owners.forEach(owner => { owner.released = true; });
  const dispatch = createSlotDispatcher({ repository, template, consumer: consumer(observed, launches), store: stores.slotStore, now });
  try {
    await dispatch.check(); expect(launches).toHaveLength(0);
    await stop(stores);
    await stores.streamStore.observe("owner-100", "assignment-100", "working", now().toISOString());
    await dispatch.check(); expect(launches).toHaveLength(0);
  } finally { stores.close(); }
});
test("uncertain launches retain the reservation and never replay across restart", async () => {
  const path = database(); let stores = openCoordinationStores(path); const observed = snapshot(); const launches: SlotTask[] = [];
  await register(stores, observed); await stop(stores);
  const effects = consumer(observed, launches);
  effects.launch = async task => { launches.push(task); throw new Error("uncertain launch response"); };
  try {
    expect((await createSlotDispatcher({ repository, template, consumer: effects, store: stores.slotStore, now }).check()).status.kind).toBe("diagnostic");
    stores.close(); stores = openCoordinationStores(path);
    await createSlotDispatcher({ repository, template, consumer: effects, store: stores.slotStore, now }).check();
    expect(launches).toHaveLength(1);
  } finally { stores.close(); }
});
test("missing owner identity or stale snapshots stop before launch", async () => {
  const stores = openCoordinationStores(database()); const observed = snapshot(); const launches: SlotTask[] = [];
  const dispatch = createSlotDispatcher({ repository, template, consumer: consumer(observed, launches), store: stores.slotStore, now });
  try {
    await expect(dispatch.check()).rejects.toThrow("owner");
    await register(stores, observed);
    observed.observedAt = "2026-10-24T20:00:00.000Z";
    await expect(dispatch.check()).rejects.toThrow("stale");
    expect(launches).toHaveLength(0);
  } finally { stores.close(); }
});
test("a blocked stop frees the exact assignment without consuming its open need", async () => {
  const stores = openCoordinationStores(database()); const observed = snapshot(); const launches: SlotTask[] = [];
  await register(stores, observed);
  await stores.streamStore.saveStop({ id: "blocked-100", session: "owner-100", stream: "issue:100", assignment: "assignment-100", ownerRole: { kind: "role", name: "orchestrator" }, kind: "blocked", waiting_on: { kind: "user" }, need: "Choose the remaining scope", ts: now().toISOString() });
  try {
    await createSlotDispatcher({ repository, template, consumer: consumer(observed, launches), store: stores.slotStore, now }).check();
    expect(launches.map(task => task.issue.ref.number)).toEqual([1]);
    expect((await stores.streamStore.listStops())[0]?.kind).toBe("blocked");
  } finally { stores.close(); }
});
test("an uncertain empty-queue report never republishes across restart", async () => {
  const path = database(); let stores = openCoordinationStores(path); const observed = snapshot(); observed.owners = []; observed.issues = [];
  const launches: SlotTask[] = []; let reports = 0; const effects = consumer(observed, launches);
  effects.report = async () => { reports++; throw new Error("lost notice response"); };
  try {
    await createSlotDispatcher({ repository, template, consumer: effects, store: stores.slotStore, now }).check();
    stores.close(); stores = openCoordinationStores(path);
    await createSlotDispatcher({ repository, template, consumer: effects, store: stores.slotStore, now }).check();
    expect(reports).toBe(1); expect(launches).toHaveLength(0);
  } finally { stores.close(); }
});
test("dependency-resolution facts permit a new revision, not a duplicate unchanged revision", async () => {
  const stores = openCoordinationStores(database()); const observed = snapshot(); const launches: SlotTask[] = [];
  observed.issues = [issue(1)]; await register(stores, observed); await stop(stores);
  const effects = consumer(observed, launches);
  effects.launch = async task => { launches.push(task); return { session: `revision-${task.issue.revision}` }; };
  const dispatch = createSlotDispatcher({ repository, template, consumer: effects, store: stores.slotStore, now });
  try {
    await dispatch.check();
    const first = launches[0]; if (!first) throw new Error("Missing first launch");
    await stores.streamStore.saveStop({ id: "blocked-new-engineer", session: "revision-1", stream: `https://github.com/${repository}/issues/1`, assignment: first.id, ownerRole: { kind: "role", name: "orchestrator" }, kind: "blocked", waiting_on: { kind: "external" }, need: "Dependency remains open", ts: now().toISOString() });
    const queued = observed.issues[0]; if (!queued) throw new Error("Missing queued issue");
    queued.openDependencies = [{ repository, number: 9 }];
    await dispatch.check(); expect(launches).toHaveLength(1);
    queued.openDependencies = []; queued.revision = "2";
    await dispatch.check(); expect(launches.map(task => task.issue.revision)).toEqual(["1", "2"]);
  } finally { stores.close(); }
});

test("an older snapshot cannot replace current owner staffing facts", async () => {
  const stores = openCoordinationStores(database()); const observed = snapshot(); observed.issues = [];
  await register(stores, observed);
  try {
    await stores.slotStore.transition(repository, { kind: "observe", snapshot: observed }, template);
    const older = structuredClone(observed); older.observedAt = "2026-10-25T19:59:00.000Z";
    for (const owner of older.owners) owner.state = "idle";
    const result = await stores.slotStore.transition(repository, { kind: "observe", snapshot: older }, template);
    expect(result.state.owners.every(owner => owner.state === "working")).toBe(true);
  } finally { stores.close(); }
});
