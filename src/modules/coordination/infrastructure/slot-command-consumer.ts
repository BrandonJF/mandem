/** @fileoverview Trusted startup configuration for repository-neutral slot observations and effects. */
import { readFileSync } from "node:fs";
import type { SlotConsumer } from "../application/ports/slot-store";
import { parseSlotSession, parseSlotTemplate, slotObject, slotRepository, slotText } from "../domain/slot-values";
import { createConsumerCommand } from "./consumer-command";
export function loadSlotConfiguration(path: string) {
  const row = slotObject(JSON.parse(readFileSync(path, "utf8")));
  if (row.version !== 1 || !Array.isArray(row.command)) throw new Error("Invalid slot consumer configuration");
  const command = row.command.map(slotText); const invoke = createConsumerCommand(command);
  const repository = slotRepository(row.repository); const template = parseSlotTemplate(row.template);
  const consumer: SlotConsumer = {
    async observe() { return invoke({ kind: "observe", repository }); },
    async launch(task) { return parseSlotSession(await invoke({ kind: "launch", task })); },
    async report(notice) { if (slotObject(await invoke({ kind: "report", notice })).ok !== true) throw new Error("Consumer did not confirm slot report; inspect before recovery"); },
  };
  return { repository, template, consumer };
}
