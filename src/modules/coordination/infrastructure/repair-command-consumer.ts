/** @fileoverview Trusted fixed command configuration for repair facts and guarded designation writes. */
import { readFileSync } from "node:fs";
import type { RepairConsumer } from "../application/ports/repair-store";
import { slotObject, slotRepository, slotText } from "../domain/slot-values";
import { createConsumerCommand } from "./consumer-command";
export function loadRepairConfiguration(path: string) {
  const row = slotObject(JSON.parse(readFileSync(path, "utf8")));
  if (row.version !== 1 || !Array.isArray(row.command)) throw new Error("Invalid repair consumer configuration");
  const repository = slotRepository(row.repository); const invoke = createConsumerCommand(row.command.map(slotText));
  const consumer: RepairConsumer = {
    async observe() { return invoke({ kind: "observe", repository }); },
    async apply(effect) { if (slotObject(await invoke({ kind: "apply", effect })).ok !== true) throw new Error("Consumer did not confirm repair write; inspect before recovery"); },
  };
  return { repository, consumer };
}
