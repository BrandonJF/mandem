/** @fileoverview Specifies the native issue graph policy. */
import { describe, expect, it } from "vitest";
import { evaluateIssueGraph, parseGraphMetadata, parsePlanDeclaration, serializeGraphMetadata, type LocalIssueRecord } from "./issue-graph-policy";

const epic = "abe862d6-b052-49fe-8611-bc1ab6e24253";
const child = "6a6a8bab-853f-4658-9bc0-38e2386b642d";

function record(issueId: string, parentIssueId: string | null, plan: string | null): LocalIssueRecord {
  return { issueId, state: "open", metadata: { issueKey: issueId === epic ? "EPIC" : "WI1", epicIssueId: epic, plan, parentIssueId, dependsOnIssueIds: [] }, providerMappings: [] };
}

describe("issue graph policy", () => {
  it("parses canonical metadata and a matching plan declaration", () => {
    const metadata = parseGraphMetadata('Mandem-Graph-Metadata: v1\nissue_key: "WI1"\nepic_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"\nplan: "docs/plans/issues/wi1.md"\nparent_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"\ndepends_on_issue_ids: []\n');
    const plan = parsePlanDeclaration('---\nepic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253\nissue_id: 6a6a8bab-853f-4658-9bc0-38e2386b642d\ndepends_on_issue_ids: []\npromotion: planned\nexecution_authorized: false\n---\n');
    expect(metadata.issueKey).toBe("WI1");
    expect(plan.issueId).toBe(child);
  });

  it("extracts graph fields from unified frontmatter and block dependency lists", () => {
    const plan = parsePlanDeclaration('---\ntitle: "WI1"\nartifact_contract: ce-unified-plan/v1\nparent: ../epic.md\nepic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253\nissue_id: 6a6a8bab-853f-4658-9bc0-38e2386b642d\ndepends_on_issue_ids:\n  - 745eda80-1e74-4866-bc95-2f2983b31025\npromotion: executable\nexecution_authorized: true\n---\n');
    expect(plan).toMatchObject({ issueId: child, promotion: "executable", executionAuthorized: true, dependsOnIssueIds: ["745eda80-1e74-4866-bc95-2f2983b31025"] });
  });

  it("accepts the exact nested epic policy and canonicalizes its relationship lists", () => {
    const metadata = parseGraphMetadata('Mandem-Graph-Metadata: v1\nissue_key: "EPIC"\nepic_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"\nplan: "docs/plans/epic.md"\nparent_issue_id: null\ndepends_on_issue_ids: []\nprovider:\n  kind: "github"\n  owner: "BrandonJF"\n  repository: "mandem"\nmilestone:\n  title: "Mandem v1"\n  description: "Tracks work."\n  state: "open"\n  due_on: null\nmanaged_labels:\n  blocked:\n    color: "B60205"\n    description: "Blocked"\n');
    expect(serializeGraphMetadata(metadata)).toContain('provider:\n  kind: "github"');
    expect(() => parseGraphMetadata('Mandem-Graph-Metadata: v1\nissue_key: "BAD_KEY"\nepic_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"\nplan: null\nparent_issue_id: null\ndepends_on_issue_ids: []\n')).toThrow("Invalid issue key");
  });

  it("rejects epic policy on a subissue and emits LF-terminated canonical metadata", () => {
    const payload = 'Mandem-Graph-Metadata: v1\nissue_key: "WI1"\nepic_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"\nplan: null\nparent_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"\ndepends_on_issue_ids: []\nprovider:\n  kind: "github"\n  owner: "BrandonJF"\n  repository: "mandem"\nmilestone:\n  title: "M"\n  description: "D"\n  state: "open"\n  due_on: null\nmanaged_labels:\n  blocked:\n    color: "B60205"\n    description: "Blocked"\n';
    expect(() => parseGraphMetadata(payload, child)).toThrow("Only the epic root");
    const output = serializeGraphMetadata(parseGraphMetadata('Mandem-Graph-Metadata: v1\nissue_key: "WI1"\nepic_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"\nplan: null\nparent_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"\ndepends_on_issue_ids: ["745eda80-1e74-4866-bc95-2f2983b31025"]\n'));
    expect(output.endsWith("\n")).toBe(true);
    expect(output).not.toContain("\r");
  });

  it("rejects uppercase UUIDs because portable issue identities are lowercase", () => {
    expect(() => parsePlanDeclaration('---\nepic_issue_id: ABE862D6-B052-49FE-8611-BC1AB6E24253\nissue_id: 6a6a8bab-853f-4658-9bc0-38e2386b642d\ndepends_on_issue_ids: []\npromotion: planned\nexecution_authorized: false\n---\n')).toThrow("must be UUIDs");
  });

  it("returns stable findings for graph and frontmatter failures", () => {
    const result = evaluateIssueGraph([
      record(epic, null, "docs/plans/epic.md"),
      { ...record(child, "missing", "docs/plans/issues/wi1.md"), metadata: { ...record(child, "missing", "docs/plans/issues/wi1.md").metadata!, issueKey: "EPIC", dependsOnIssueIds: ["missing"] } },
      record("short", epic, null),
    ], new Map([["docs/plans/epic.md", { epicIssueId: epic, issueId: epic, dependsOnIssueIds: [], promotion: "planned", executionAuthorized: false }], ["docs/plans/issues/wi1.md", { epicIssueId: epic, issueId: "short", dependsOnIssueIds: [], promotion: "planned", executionAuthorized: false }]]));
    expect(result.findings.map((finding) => finding.ruleId)).toEqual([...result.findings.map((finding) => finding.ruleId)].sort());
    expect(result.findings.map((finding) => finding.ruleId)).toEqual(expect.arrayContaining(["IGRAPH-DEPENDENCY", "IGRAPH-FRONTMATTER", "IGRAPH-ISSUE-KEY", "IGRAPH-UUID"]));
  });
});
