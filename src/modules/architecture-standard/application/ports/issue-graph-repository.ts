/** @fileoverview Port for reading a local native issue graph. */
import type { LocalIssueRecord } from "../../domain/issue-graph-types";

export interface LocalIssueGraphRepository {
  listIssueRefs(): Promise<readonly string[]>;
  listPlanPaths(): Promise<readonly string[]>;
  readIssue(issueId: string): Promise<LocalIssueRecord | null>;
  readPlan(path: string): Promise<string>;
}
