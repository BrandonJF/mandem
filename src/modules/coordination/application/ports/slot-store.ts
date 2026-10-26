/** @fileoverview Durable slot transitions and repository-provided observation/effect boundaries. */
import type { SlotEvent, SlotNotice, SlotSession, SlotState, SlotTask, SlotTemplate, SlotTransition } from "../../domain/slots";
export interface SlotStore {
  get(repository: string): Promise<SlotState | undefined>;
  list(): Promise<SlotState[]>;
  transition(repository: string, event: SlotEvent, template: SlotTemplate): Promise<SlotTransition>;
}
/** Consumers authenticate fresh issue/owner facts and revalidate immediately before launch. */
export interface SlotConsumer {
  observe(repository: string): Promise<unknown>;
  launch(task: SlotTask): Promise<SlotSession>;
  report(notice: SlotNotice): Promise<void>;
}
