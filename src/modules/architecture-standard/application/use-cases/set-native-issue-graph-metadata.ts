/** @fileoverview Plans deterministic, approval-gated native graph metadata writes. */
export interface NativeGraphHead { readonly issueId: string; readonly head: string; }
export interface NativeGraphWrite { readonly issueId: string; readonly baseline: string; readonly result: string; }
export interface NativeRefRecoveryState { readonly baseline: string; readonly result: string; readonly local: string; readonly remote: string; }
export type NativeRefRecoveryAction = "create-result" | "push-result" | "adopt-result" | "complete";

/** Fails closed unless both local and remote are an approved baseline/result state. */
export function classifyNativeRef(state: NativeRefRecoveryState): NativeRefRecoveryAction {
  const allowed = new Set([state.baseline, state.result]);
  if (!allowed.has(state.local) || !allowed.has(state.remote)) throw new Error("native ref is in an unauthorized third state");
  if (state.remote === state.result) {
    return state.local === state.result ? "complete" : "adopt-result";
  }
  return state.local === state.result ? "push-result" : "create-result";
}
export function planNativeIssueGraphMetadata(baselines: readonly NativeGraphHead[], results: readonly NativeGraphHead[]): readonly NativeGraphWrite[] {
  const resultByIssue = new Map(results.map((entry) => [entry.issueId, entry.head]));
  return baselines.flatMap((baseline) => { const result = resultByIssue.get(baseline.issueId); return result === undefined || result === baseline.head ? [] : [{ issueId: baseline.issueId, baseline: baseline.head, result }]; }).sort((left, right) => left.issueId.localeCompare(right.issueId));
}
