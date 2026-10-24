/** @fileoverview Persistence and live activity boundaries for stream monitoring. */
import type { LiveAgent, StopRecord, StreamDelivery } from "../../domain/streams";
import type { PlaneMessage } from "../../domain/types";
export interface StreamStore {
  saveStop(stop: StopRecord): Promise<StopRecord>;
  listStops(): Promise<StopRecord[]>;
  observe(session: string, assignment: string, state: string, now: string): Promise<{ idleSince?: string; generation: number }>;
  claim(stream: string, session: string | null): Promise<void>;
  claims(): Promise<{ stream: string; session: string }[]>;
  delivery(key: string): Promise<StreamDelivery | undefined>;
  routeOnce(key: string, owner: string, message: Omit<PlaneMessage, "id" | "ackedBy">): Promise<StreamDelivery & { created: boolean }>;
}
export interface StreamActivity { read(): Promise<LiveAgent[]>; }
