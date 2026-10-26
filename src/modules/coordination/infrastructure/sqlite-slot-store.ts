/** @fileoverview Atomic slot reservations, authoritative stop release and engineer registration. */
import type { Database } from "bun:sqlite";
import type { SlotStore } from "../application/ports/slot-store";
import type { SlotEvent, SlotOwner, SlotState, SlotTemplate, SlotTransition } from "../domain/slots";
import { emptySlotState, issueKey, transitionSlots } from "../domain/slot-policy";
import { parseIssueRef, parseSlotState, slotObject, slotRepository } from "../domain/slot-values";
import { parseObservation, parseStoredStop, parseStreamSession } from "../domain/stream-values";
export function createSqliteSlotStore(db: Database): SlotStore {
  db.exec("CREATE TABLE IF NOT EXISTS slot_states (repository TEXT PRIMARY KEY, payload TEXT NOT NULL)");
  function read(repository: string): SlotState | undefined {
    const row = db.query<{ payload: string }, [string]>("SELECT payload FROM slot_states WHERE repository=?").get(repository);
    if (!row) return undefined;
    const state = parseSlotState(JSON.parse(row.payload));
    if (state.repository !== repository) throw new Error("Slot row repository mismatch");
    return state;
  }
  function owner(value: SlotOwner): SlotOwner {
    const row = db.query<{ payload: string }, [string]>("SELECT payload FROM sessions WHERE session=?").get(value.session);
    if (!row) throw new Error("Missing registered slot owner");
    const payload: unknown = JSON.parse(row.payload); const registered = parseStreamSession(payload);
    if (registered.role.name !== "engineer" || registered.binding?.assignment !== value.assignment) throw new Error("Slot owner assignment changed");
    const metadata = slotObject(slotObject(payload).data);
    if (metadata.slotRefill !== undefined) {
      const binding = slotObject(metadata.slotRefill);
      if (binding.version !== 1 || issueKey(parseIssueRef(binding.ref)) !== issueKey(value.ref)) throw new Error("Slot owner issue changed");
    }
    const saved = db.query<unknown, [string]>("SELECT assignment,idle_since,state,generation,stop_boundary FROM stream_observations WHERE session=?").get(value.session);
    const observation = saved ? parseObservation(saved) : undefined;
    const released = Boolean(observation?.assignment === value.assignment && observation.stopBoundary && db.query<{ payload: string }, []>("SELECT payload FROM stream_stops").all().some(row => {
      const stop = parseStoredStop(JSON.parse(row.payload));
      return stop.session === value.session && stop.assignment === value.assignment && stop.generation === observation.generation && (stop.kind === "done" || stop.kind === "blocked");
    }));
    return { ...value, released };
  }
  const apply = db.transaction((repository: string, supplied: SlotEvent, template: SlotTemplate): SlotTransition => {
    const current = read(repository) ?? emptySlotState(repository); const event = structuredClone(supplied);
    if (event.kind === "observe" && current.snapshot && Date.parse(event.snapshot.observedAt) < Date.parse(current.snapshot.observedAt)) return { state: current, actions: [] };
    if (event.kind === "observe") {
      const owners = new Map(current.owners.map(value => [value.session, { ...value, state: "unknown" as SlotOwner["state"] }]));
      for (const run of current.launches) {
        if (run.phase.kind !== "running") continue;
        if (!owners.has(run.phase.session.session)) owners.set(run.phase.session.session, { session: run.phase.session.session, assignment: run.task.id, ref: run.task.issue.ref, kind: run.task.issue.kind, priority: run.task.issue.priority, state: "unknown", released: false });
      }
      for (const value of event.snapshot.owners) owners.set(value.session, value);
      event.snapshot.owners = [...owners.values()].map(owner);
      current.owners = event.snapshot.owners;
    }
    const result = transitionSlots(current, event, template);
    const state = parseSlotState(result.state);
    for (const run of state.launches) {
      if (event.kind !== "launched" || run.task.id !== event.id || run.phase.kind !== "running") continue;
      const session = run.phase.session;
      const prior = db.query<{ payload: string }, [string]>("SELECT payload FROM sessions WHERE session=?").get(session.session);
      if (prior) {
        const registered = slotObject(JSON.parse(prior.payload));
        const metadata = slotObject(registered.data);
        if (registered.role !== "engineer" || metadata.streamAssignment !== run.task.id || metadata.slotRefill === undefined || slotObject(metadata.slotRefill).version !== 1 || slotObject(metadata.slotRefill).taskId !== run.task.id) throw new Error("Engineer session already belongs to another task");
      } else {
        if (state.owners.some(value => value.session === session.session)) throw new Error("Engineer session must be independent of an existing owner");
        const registered = { session: session.session, role: "engineer", ts: new Date().toISOString(), data: {
          ...(session.paneId ? { herdrPaneId: session.paneId } : {}), stream: `https://github.com/${run.task.issue.ref.repository}/issues/${run.task.issue.ref.number}`,
          streamAssignment: run.task.id, ownerRole: "orchestrator", slotRefill: { version: 1, taskId: run.task.id, repository, ref: run.task.issue.ref, kind: run.task.issue.kind, priority: run.task.issue.priority },
        } };
        db.query("INSERT INTO sessions(session,payload) VALUES (?,?)").run(session.session, JSON.stringify(registered));
      }
    }
    if (state.repository !== repository || state.owners.some(value => value.ref.repository !== repository)) throw new Error("Slot transition changed repository");
    const active = state.owners.filter(value => !value.released);
    if (new Set(active.map(value => issueKey(value.ref))).size !== active.length) throw new Error("Multiple owners claim the same issue");
    db.query("INSERT INTO slot_states(repository,payload) VALUES (?,?) ON CONFLICT(repository) DO UPDATE SET payload=excluded.payload").run(repository, JSON.stringify(state));
    return { state, actions: result.actions };
  });
  return { async get(repository) { return read(slotRepository(repository)); }, async list() {
    return db.query<{ payload: string }, []>("SELECT payload FROM slot_states ORDER BY repository").all().map(row => parseSlotState(JSON.parse(row.payload)));
  }, async transition(repository, event, template) { return apply.immediate(slotRepository(repository), event, template); } };
}
