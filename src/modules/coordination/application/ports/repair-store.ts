/** @fileoverview Durable repair transitions and consumer-owned fresh facts and policy writes. */
import type { RepairEffect, RepairEvent, RepairState, RepairTransition } from "../../domain/repairs";
export interface RepairStore {
  get(repository: string): Promise<RepairState | undefined>;
  list(): Promise<RepairState[]>;
  transition(repository: string, event: RepairEvent): Promise<RepairTransition>;
}
export interface RepairConsumer {
  observe(repository: string): Promise<unknown>;
  /** Revalidate exact source facts and preserve unrelated policy before an atomic write/receipt. */
  apply(effect: RepairEffect): Promise<void>;
}
