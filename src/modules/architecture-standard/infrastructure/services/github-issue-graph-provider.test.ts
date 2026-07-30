/** @fileoverview Tests GitHub issue graph reads and exact mutation endpoints. */
import { describe, expect, it } from "vitest";
import type { IssueGraphOperation } from "../../domain/issue-graph-operations";
import { GitHubIssueGraphProvider, type GhApiRunner } from "./github-issue-graph-provider";

const mappings = [
  { provider: "github" as const, owner: "BrandonJF", repository: "mandem", issueNumber: 29 },
  { provider: "github" as const, owner: "BrandonJF", repository: "mandem", issueNumber: 22 },
];

describe("GitHubIssueGraphProvider", () => {
  it("reads all managed provider fields and treats an absent parent as null", async () => {
    const runner: GhApiRunner = async (request) => {
      if (request.endpoint.endsWith("/labels")) return [[{ name: "blocked", color: "B60205", description: "Blocked" }]];
      if (request.endpoint.includes("/milestones")) return [[{ number: 1, title: "Mandem v1", description: "Release", state: "open", due_on: null }]];
      if (request.endpoint.endsWith("/issues/29")) return { id: 2900, number: 29, state: "open", labels: [{ name: "in-progress" }], milestone: { number: 1 } };
      if (request.endpoint.endsWith("/issues/22")) return { id: 2200, number: 22, state: "closed", labels: [{ name: "blocked" }], milestone: { number: 1 } };
      if (request.endpoint.endsWith("/issues/29/parent")) return null;
      if (request.endpoint.endsWith("/issues/22/parent")) return { number: 29 };
      if (request.endpoint.endsWith("/issues/29/sub_issues")) return [[{ number: 22 }]];
      if (request.endpoint.endsWith("/issues/22/sub_issues")) return [[]];
      throw new Error(`unexpected ${request.endpoint}`);
    };
    const snapshot = await new GitHubIssueGraphProvider(runner).readSnapshot("BrandonJF/mandem", mappings);
    expect(snapshot).toEqual({
      repository: "BrandonJF/mandem",
      labels: [{ name: "blocked", color: "B60205", description: "Blocked" }],
      milestones: [{ number: 1, title: "Mandem v1", description: "Release", state: "open", dueOn: null }],
      issues: [
        { issueId: "BrandonJF/mandem#22", databaseId: 2200, number: 22, state: "closed", labels: ["blocked"], milestoneNumber: 1, parentNumber: 29, subissueNumbers: [] },
        { issueId: "BrandonJF/mandem#29", databaseId: 2900, number: 29, state: "open", labels: ["in-progress"], milestoneNumber: 1, parentNumber: null, subissueNumbers: [22] },
      ],
    });
  });

  it("uses the singular delete endpoint and database id payload for a move", async () => {
    const requests: { endpoint: string; method: string; fields?: Readonly<Record<string, string | number | null>> }[] = [];
    const runner: GhApiRunner = async (request) => { requests.push(request); return {}; };
    const operation: IssueGraphOperation = {
      kind: "move-subissue",
      key: "06:child:parent",
      issueId: "child",
      currentParentNumber: 20,
      desiredParentIssueId: "parent",
      desiredParentNumber: 29,
      subissueDatabaseId: 2200,
    };
    await new GitHubIssueGraphProvider(runner, "BrandonJF/mandem").apply(operation);
    expect(requests).toEqual([
      {
        endpoint: "repos/BrandonJF/mandem/issues/20/sub_issue",
        method: "DELETE",
        fields: { sub_issue_id: 2200 },
      },
      {
        endpoint: "repos/BrandonJF/mandem/issues/29/sub_issues",
        method: "POST",
        fields: { sub_issue_id: 2200 },
      },
    ]);
  });

  it("creates a milestone before assigning it and adds one label without replacing others", async () => {
    const requests: { endpoint: string; method: string; fields?: Readonly<Record<string, string | number | null>> }[] = [];
    const runner: GhApiRunner = async (request) => {
      requests.push(request);
      return request.endpoint.endsWith("/milestones") ? { number: 7 } : {};
    };
    const provider = new GitHubIssueGraphProvider(runner, "BrandonJF/mandem");
    await provider.apply({
      kind: "upsert-milestone",
      key: "02:milestone:Mandem v1",
      title: "Mandem v1",
      description: "Release",
      state: "open",
      dueOn: null,
    });
    await provider.apply({
      kind: "set-issue-milestone",
      key: "05:issue:milestone",
      issueId: "issue",
      issueNumber: 22,
      milestoneTitle: "Mandem v1",
    });
    await provider.apply({
      kind: "add-issue-label",
      key: "04:issue:label:blocked:add",
      issueId: "issue",
      issueNumber: 22,
      label: "blocked",
    });
    expect(requests).toEqual([
      {
        endpoint: "repos/BrandonJF/mandem/milestones",
        method: "POST",
        fields: { title: "Mandem v1", description: "Release", state: "open", due_on: null },
      },
      {
        endpoint: "repos/BrandonJF/mandem/issues/22",
        method: "PATCH",
        fields: { milestone: 7 },
      },
      {
        endpoint: "repos/BrandonJF/mandem/issues/22/labels",
        method: "POST",
        fields: { "labels[]": "blocked" },
      },
    ]);
  });
});
