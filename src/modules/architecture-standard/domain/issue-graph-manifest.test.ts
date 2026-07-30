/** @fileoverview Specifies canonical native issue graph manifests. */
import { describe, expect, it } from "vitest";
import { graphDigest, parseNativeIssueGraphManifest } from "./issue-graph-manifest";

const epic = "abe862d6-b052-49fe-8611-bc1ab6e24253";
const issue = "6a6a8bab-853f-4658-9bc0-38e2386b642d";

describe("native issue graph manifest", () => {
  it("parses a complete manifest and hashes its canonical ordering", () => {
    const manifest = parseNativeIssueGraphManifest(`version: 1\nissues:\n  - issue_id: "${issue}"\n    issue_key: "WI1"\n    epic_issue_id: "${epic}"\n    plan: null\n    parent_issue_id: "${epic}"\n    depends_on_issue_ids: []\n    expected_native_state: "open"\n    expected_native_labels: []\n`);
    expect(manifest.issues[0]?.issueId).toBe(issue);
    expect(graphDigest(manifest)).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("includes the complete epic provider policy in the canonical graph", () => {
    const manifest = parseNativeIssueGraphManifest(`version: 1
issues:
  - issue_id: "${epic}"
    issue_key: "EPIC"
    epic_issue_id: "${epic}"
    plan: "docs/plans/epic.md"
    parent_issue_id: null
    depends_on_issue_ids: []
    expected_native_state: "open"
    expected_native_labels: ["in-progress"]
    provider:
      kind: "github"
      owner: "BrandonJF"
      repository: "mandem"
    milestone:
      title: "Mandem v1"
      description: "Tracks work."
      state: "open"
      due_on: null
    managed_labels:
      in-progress:
        color: "ededed"
        description: ""
`);
    expect(manifest.issues[0]?.metadata.epicPolicy).toMatchObject({
      provider: { kind: "github", owner: "BrandonJF", repository: "mandem" },
      milestone: { state: "open" },
    });
    const changed = parseNativeIssueGraphManifest(`version: 1
issues:
  - issue_id: "${epic}"
    issue_key: "EPIC"
    epic_issue_id: "${epic}"
    plan: "docs/plans/epic.md"
    parent_issue_id: null
    depends_on_issue_ids: []
    expected_native_state: "open"
    expected_native_labels: ["in-progress"]
    provider:
      kind: "github"
      owner: "BrandonJF"
      repository: "mandem"
    milestone:
      title: "Mandem v1"
      description: "Changed."
      state: "open"
      due_on: null
    managed_labels:
      in-progress:
        color: "ededed"
        description: ""
`);
    expect(graphDigest(changed)).not.toBe(graphDigest(manifest));
  });
});
