/** @fileoverview Public coordination module API. */
export { openCoordinationStores } from "./api/composition";
export type { MessageStore, PlaneMessage, Subscriptions } from "./application/ports/message-store";
export type { SessionStore, SessionRecord } from "./application/ports/session-store";
export type { MergeLockStore, MergeLockView, MergeLockStatus } from "./application/ports/merge-lock-store";
export { startCoordinationServer, defaultDatabasePath, postMessage, readMessages, ackMessage, registerSession, listSessions, listTopics, subscribeMessages, acquireMergeLock, releaseMergeLock, fetchMergeLock, isCoordServiceHealthy, streamCommand } from "./api/composition";
export { coordinationHelp, parseFlags, runCoordinationCommand } from "./api/cli";
export type { StopInput, StopRecord, WaitingOn, StreamReport, StreamFinding, StreamBinding, RoleReference } from "./domain/streams";

export { createReviewDispatcher } from "./application/review-dispatch";
export { parseReviewCommand, parseReviewState, parseReviewObservation, parseReviewResult } from "./domain/review-values";
export type { ReviewCommand } from "./domain/review-values";
export type { ReviewRef, ReviewState, ReviewObservation, ReviewResult, ReviewPolicy, ReviewTask, ReviewAction, ReviewerSession } from "./domain/reviews";
export type { ReviewEffects } from "./application/ports/review-effects";
export type { ReviewStore } from "./application/ports/review-store";
export { reviewCommand, readReviews } from "./api/composition";

export { createSlotDispatcher } from "./application/slot-dispatch";
export type { SlotConsumer, SlotStore } from "./application/ports/slot-store";
export type { SlotIssue, SlotOwner, SlotSnapshot, SlotTemplate, SlotTask, SlotSession, SlotState, SlotNotice } from "./domain/slots";
export { parseSlotSnapshot, parseSlotState } from "./domain/slot-values";
export { checkSlots, readSlots } from "./api/composition";

export { createRepairDispatcher } from "./application/repair-dispatch";
export type { RepairConsumer, RepairStore } from "./application/ports/repair-store";
export type { RepairSnapshot, RepairTarget, RepairEffect, RepairState } from "./domain/repairs";
export { parseRepairSnapshot, parseRepairState } from "./domain/repair-values";
export { checkRepairs, readRepairs } from "./api/composition";
