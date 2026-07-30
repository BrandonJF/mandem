/** @fileoverview Application use case for checking the local native issue graph. */
import { evaluateIssueGraph, parsePlanDeclaration, type IssueGraphFinding, type IssueGraphResult, type LocalIssueRecord, type PlanDeclaration } from "../../domain/issue-graph-policy";
import type { LocalIssueGraphRepository } from "../ports/issue-graph-repository";

export async function checkIssueGraph(repository: LocalIssueGraphRepository): Promise<IssueGraphResult> {
  const findings: IssueGraphFinding[] = [];
  const records: LocalIssueRecord[] = [];
  const plans = new Map<string, PlanDeclaration>();
  for (const issueId of await repository.listIssueRefs()) {
    let record: LocalIssueRecord | null;
    try {
      record = await repository.readIssue(issueId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Native issue could not be parsed.";
      const ruleId = /^IGRAPH-[A-Z-]+:/u.exec(message)?.[0].slice(0, -1) ?? "IGRAPH-NATIVE-METADATA";
      findings.push({ ruleId, issueId, path: "", message });
      continue;
    }
    if (record === null) { findings.push({ ruleId: "IGRAPH-ISSUE-MISSING", issueId, path: "", message: "Issue ref could not be read." }); continue; }
    if (record.metadata === null) continue;
    records.push(record);
    if (record.metadata?.plan !== null && record.metadata?.plan !== undefined) {
      try { plans.set(record.metadata.plan, parsePlanDeclaration(await repository.readPlan(record.metadata.plan))); }
      catch (error: unknown) { findings.push({ ruleId: "IGRAPH-FRONTMATTER", issueId, path: record.metadata.plan, message: error instanceof Error ? error.message : "Plan could not be parsed." }); }
    }
  }
  const graph = evaluateIssueGraph(records, plans);
  return { findings: [...findings, ...graph.findings].sort((left, right) => left.ruleId.localeCompare(right.ruleId) || left.issueId.localeCompare(right.issueId) || left.path.localeCompare(right.path) || left.message.localeCompare(right.message)) };
}
