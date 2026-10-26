/** @fileoverview Recorded issue facts, exact owner bindings and durable slot effects. */
export interface IssueRef { repository: string; number: number; }
export interface SlotIssue {
  ref: IssueRef; revision: string; state: "open" | "closed";
  kind: "product" | "platform"; priority: number; estimate: number;
  outcome: string; scope: string; acceptance: string;
  blocked: boolean; userDecision: boolean; openPull: boolean; openDependencies: IssueRef[];
}
/** Only the SQLite adapter derives released from the registry and current typed stop. */
export interface SlotOwner {
  session: string; assignment: string; ref: IssueRef;
  kind: SlotIssue["kind"]; priority: number; state: "working" | "idle" | "blocked" | "done" | "unknown"; released: boolean;
}
export type SlotMain = { state: "green"; head: string }
  | { state: "red"; head: string; repairIssue: IssueRef }
  | { state: "unknown" };
export interface SlotSnapshot {
  repository: string; observedAt: string; issues: SlotIssue[];
  owners: SlotOwner[]; main: SlotMain; diagnostics: string[];
}
export interface SlotTemplate { name: string; revision: string; }
export interface SlotTask { id: string; repository: string; issue: SlotIssue; template: SlotTemplate; observedAt: string; }
export interface SlotSession { session: string; paneId?: string; }
export interface SlotRun {
  task: SlotTask;
  phase: { kind: "reserved" } | { kind: "running"; session: SlotSession }
    | { kind: "uncertain"; reason: string };
}
export interface SlotNotice {
  id: string; repository: string; reason: string; diagnostics: string[]; decisions: IssueRef[];
  phase: { kind: "reserved" | "complete" } | { kind: "uncertain"; reason: string };
}
export interface SlotState {
  version: 1; repository: string; snapshot: SlotSnapshot | null;
  owners: SlotOwner[]; launches: SlotRun[]; notices: SlotNotice[];
  status: { kind: "idle" | "launching" | "full" | "waiting-queue" | "held" | "diagnostic"; reason: string };
}
export type SlotEvent = { kind: "observe"; snapshot: SlotSnapshot }
  | { kind: "launched"; id: string; session: SlotSession }
  | { kind: "launch-uncertain"; id: string; reason: string }
  | { kind: "report-complete"; id: string }
  | { kind: "report-uncertain"; id: string; reason: string };
export type SlotAction = { kind: "launch"; task: SlotTask } | { kind: "report"; notice: SlotNotice };
export interface SlotTransition { state: SlotState; actions: SlotAction[]; }
