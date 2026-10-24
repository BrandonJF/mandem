/** @fileoverview Public coordination module API. */
export { openCoordinationStores } from "./api/composition";
export type { MessageStore, PlaneMessage, Subscriptions } from "./application/ports/message-store";
export type { SessionStore, SessionRecord } from "./application/ports/session-store";
export type { MergeLockStore, MergeLockView, MergeLockStatus } from "./application/ports/merge-lock-store";
export { startCoordinationServer, defaultDatabasePath, postMessage, readMessages, ackMessage, registerSession, listSessions, listTopics, subscribeMessages, acquireMergeLock, releaseMergeLock, fetchMergeLock, isCoordServiceHealthy, streamCommand } from "./api/composition";
export { coordinationHelp, parseFlags, runCoordinationCommand } from "./api/cli";
export type { StopInput, StopRecord, WaitingOn, StreamReport, StreamFinding, StreamBinding, RoleReference } from "./domain/streams";
