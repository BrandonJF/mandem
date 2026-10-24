/** @fileoverview Typed persistence, registry and live activity boundaries for stream monitoring. */
import type { LiveAgent, NewStopRecord, ObservableState, StaffingClaim, StopRecord, StreamDelivery, StreamObservation, StreamSession } from "../../domain/streams";
import type { PlaneMessage } from "../../domain/types";
export interface StreamStore {
  saveStop(stop: NewStopRecord): Promise<StopRecord>;
  listStops(): Promise<StopRecord[]>;
  observe(session: string, assignment: string, state: ObservableState, now: string): Promise<StreamObservation>;
  claim(stream: string, session: string | null): Promise<void>;
  claims(): Promise<StaffingClaim[]>;
  delivery(key: string): Promise<StreamDelivery | undefined>;
  routeOnce(key: string, owner: string, message: Omit<PlaneMessage, "id" | "ackedBy">): Promise<StreamDelivery & { created: boolean }>;
}
export interface StreamActivity { read(): Promise<LiveAgent[]>; }
export interface StreamDirectory { list(): Promise<StreamSession[]>; get(session: string): Promise<StreamSession | undefined>; }
