/** @fileoverview Apply fresh issue observations and reserved slot effects without a scheduler. */
import { parseSlotSession, parseSlotSnapshot, slotRepository } from "../domain/slot-values";
import type { SlotEvent, SlotState, SlotTemplate } from "../domain/slots";
import type { SlotConsumer, SlotStore } from "./ports/slot-store";
export function createSlotDispatcher(options: { repository: string; template: SlotTemplate; store: SlotStore; consumer: SlotConsumer; now?: () => Date }) {
  const repository = slotRepository(options.repository);
  const pending = new Set<Promise<SlotState>>();
  async function perform(): Promise<SlotState> {
    const snapshot = parseSlotSnapshot(await options.consumer.observe(repository));
    const age = (options.now ?? (() => new Date()))().getTime() - Date.parse(snapshot.observedAt);
    if (snapshot.repository !== repository || age < 0 || age > 300_000) throw new Error("Slot snapshot is stale, future or belongs to another repository");
    const transition = await options.store.transition(repository, { kind: "observe", snapshot }, options.template);
    const queue = [...transition.actions];
    while (queue.length) {
      const action = queue.shift(); if (!action) break;
      let event: SlotEvent;
      try {
        if (action.kind === "launch") event = { kind: "launched", id: action.task.id, session: parseSlotSession(await options.consumer.launch(action.task)) };
        else { await options.consumer.report(action.notice); event = { kind: "report-complete", id: action.notice.id }; }
        const result = await options.store.transition(repository, event, options.template);
        queue.push(...result.actions);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        event = action.kind === "launch" ? { kind: "launch-uncertain", id: action.task.id, reason } : { kind: "report-uncertain", id: action.notice.id, reason };
        const result = await options.store.transition(repository, event, options.template);
        queue.push(...result.actions);
      }
    }
    const state = await options.store.get(repository);
    if (!state) throw new Error("Slot state disappeared after dispatch");
    return state;
  }
  return {
    async check() {
      const operation = perform(); pending.add(operation);
      try { return await operation; } finally { pending.delete(operation); }
    },
    async drain() { await Promise.allSettled([...pending]); },
  };
}
export type SlotDispatcher = ReturnType<typeof createSlotDispatcher>;
