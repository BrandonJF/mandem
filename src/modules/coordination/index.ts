/** @fileoverview Public coordination module API. */
export { openCoordinationStores } from "./api/composition";
export type { MessageStore, PlaneMessage, Subscriptions } from "./application/ports/message-store";
export type { SessionStore, SessionRecord } from "./application/ports/session-store";
export type { MergeLockStore, MergeLockView, MergeLockStatus } from "./application/ports/merge-lock-store";
