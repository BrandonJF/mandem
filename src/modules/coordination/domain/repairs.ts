/** @fileoverview Exact failing-main repair facts and durable nullable designation effects. */
import type { IssueRef } from "./slots";
export interface RepairPull {
  ref: IssueRef; head: string; createdAt: string; open: boolean; draft: boolean;
  ready: boolean; base: string; linkedIssues: IssueRef[];
}
export interface RepairSnapshot {
  repository: string; observedAt: string;
  main: { state: "red" | "green"; head: string } | { state: "unknown" };
  issue: { ref: IssueRef; state: "open" | "closed"; priority: number } | null;
  pulls: RepairPull[];
}
export interface RepairTarget { repository: string; main: string; issue: IssueRef; number: number; head: string; }
export interface RepairEffect {
  id: string; snapshot: RepairSnapshot; target: RepairTarget | null;
  phase: { kind: "reserved" | "complete" } | { kind: "uncertain"; reason: string };
}
export interface RepairState {
  version: 1; repository: string; snapshot: RepairSnapshot | null; effects: RepairEffect[];
  status: { kind: "idle" | "pending" | "complete" | "diagnostic"; reason: string };
}
export type RepairEvent = { kind: "observe"; snapshot: RepairSnapshot }
  | { kind: "complete"; id: string } | { kind: "uncertain"; id: string; reason: string };
export interface RepairTransition { state: RepairState; actions: RepairEffect[]; }
