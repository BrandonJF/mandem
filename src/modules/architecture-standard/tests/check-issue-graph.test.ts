/** @fileoverview Specifies application assembly of the local issue graph. */
import { describe, expect, it } from "vitest";
import { checkIssueGraph } from "../application/use-cases/check-issue-graph";
import type { LocalIssueGraphRepository } from "../application/ports/issue-graph-repository";

const epic = "abe862d6-b052-49fe-8611-bc1ab6e24253";

describe("check issue graph", () => {
  it("reports a missing native issue without reading a provider", async () => {
    const repository: LocalIssueGraphRepository = { listIssueRefs: async () => [epic], readIssue: async () => null, readPlan: async () => "" };
    await expect(checkIssueGraph(repository)).resolves.toMatchObject({ findings: expect.arrayContaining([expect.objectContaining({ ruleId: "IGRAPH-ISSUE-MISSING" })]) });
  });

  it("ignores native issues that do not opt into managed graph metadata", async () => {
    const repository: LocalIssueGraphRepository = {
      listIssueRefs: async () => [epic],
      readIssue: async () => ({ issueId: epic, state: "open", labels: [], metadata: null, providerMappings: [] }),
      readPlan: async () => "",
    };
    await expect(checkIssueGraph(repository)).resolves.toEqual({ findings: [{ issueId: "", message: "The graph must have exactly one epic root.", path: "", ruleId: "IGRAPH-EPIC" }] });
  });

  it("converts malformed native storage into a stable finding", async () => {
    const repository: LocalIssueGraphRepository = {
      listIssueRefs: async () => [epic],
      readIssue: async () => { throw new Error("IGRAPH-NATIVE-CONFLICT: incomparable metadata"); },
      readPlan: async () => "",
    };
    await expect(checkIssueGraph(repository)).resolves.toMatchObject({
      findings: expect.arrayContaining([
        expect.objectContaining({ issueId: epic, ruleId: "IGRAPH-NATIVE-CONFLICT" }),
      ]),
    });
  });
});
