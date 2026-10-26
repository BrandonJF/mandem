/** @fileoverview Dispatch fresh repair facts through serialized durable consumer effects. */
import type { RepairConsumer, RepairStore } from "./ports/repair-store";
import type { RepairState } from "../domain/repairs";
import { parseRepairSnapshot } from "../domain/repair-values";
import { slotRepository } from "../domain/slot-values";
export function createRepairDispatcher(options: { repository: string; store: RepairStore; consumer: RepairConsumer; now?: () => Date }) {
  const repository = slotRepository(options.repository); const pending = new Set<Promise<RepairState>>();
  async function perform(): Promise<RepairState> {
    const snapshot = parseRepairSnapshot(await options.consumer.observe(repository));
    const age = (options.now ?? (() => new Date()))().getTime() - Date.parse(snapshot.observedAt);
    if (snapshot.repository !== repository || age < 0 || age > 300_000) throw new Error("Repair snapshot is stale, future or belongs to another repository");
    const result = await options.store.transition(repository, { kind: "observe", snapshot }); const queue = [...result.actions];
    while (queue.length) {
      const effect = queue.shift(); if (!effect) break;
      try {
        await options.consumer.apply(effect);
        queue.push(...(await options.store.transition(repository, { kind: "complete", id: effect.id })).actions);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        await options.store.transition(repository, { kind: "uncertain", id: effect.id, reason });
      }
    }
    const state = await options.store.get(repository); if (!state) throw new Error("Repair state disappeared after dispatch"); return state;
  }
  return { async check() { const operation = perform(); pending.add(operation); try { return await operation; } finally { pending.delete(operation); } },
    async drain() { await Promise.allSettled([...pending]); } };
}
export type RepairDispatcher = ReturnType<typeof createRepairDispatcher>;
