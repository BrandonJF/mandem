/** @fileoverview Specifies the exact conversation-native approval contract. */
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ApprovalContractError,
  canonicalJson,
  parseApproval,
  selectApproval,
  serializeApproval,
  type ApprovalRecord,
} from "./approval-contract";

const executeApproval: ApprovalRecord = {
  decision: "approved",
  action: "execute-plan",
  issueId: "745eda80-1e74-4866-bc95-2f2983b31025",
  target: {
    plan_commit: "3b88d7035f3d62eb692cc715c1a41e11cffe3838",
    plan_sha256: "ad913ec3f674083d428f11fee28397c745c05545f4c911821267716764df37af",
  },
  actor: "operator",
  response: "APPROVED",
  evidence: {
    channel: "mandem-conversation",
    conversation_id: null,
    message_id: null,
    recorded_at: "2026-07-29T18:58:26Z",
  },
};

describe("approval contract", () => {
  it("serializes and parses the canonical execute-plan record exactly", () => {
    const serialized = serializeApproval(executeApproval);
    expect(serialized).toBe(
      'Mandem-Approval: v1\n' +
        'decision: "approved"\n' +
        'action: "execute-plan"\n' +
        'issue_id: "745eda80-1e74-4866-bc95-2f2983b31025"\n' +
        "target:\n" +
        '  plan_commit: "3b88d7035f3d62eb692cc715c1a41e11cffe3838"\n' +
        '  plan_sha256: "ad913ec3f674083d428f11fee28397c745c05545f4c911821267716764df37af"\n' +
        'actor: "operator"\n' +
        'response: "APPROVED"\n' +
        "evidence:\n" +
        '  channel: "mandem-conversation"\n' +
        "  conversation_id: null\n" +
        "  message_id: null\n" +
        '  recorded_at: "2026-07-29T18:58:26Z"\n',
    );
    expect(parseApproval(serialized)).toEqual(executeApproval);
  });

  it("rejects unknown keys, invalid response pairs, noncanonical whitespace, and invalid targets", () => {
    const canonical = serializeApproval(executeApproval);
    for (const invalid of [
      canonical.replace('actor: "operator"', 'extra: "value"\nactor: "operator"'),
      canonical.replace('response: "APPROVED"', 'response: "DENIED"'),
      canonical.replace("target:\n", "target: \n"),
      canonical.replace("3b88d7035f3d62eb692cc715c1a41e11cffe3838", "abc"),
      canonical.slice(0, -1),
    ]) {
      expect(() => parseApproval(invalid)).toThrow(ApprovalContractError);
    }
  });

  it("sorts object keys recursively while preserving array order", () => {
    const json = canonicalJson({ z: [{ b: 2, a: 1 }], a: true });
    expect(json).toBe('{"a":true,"z":[{"a":1,"b":2}]}');
    expect(createHash("sha256").update(json).digest("hex")).toHaveLength(64);
  });

  it("round-trips native graph and projection approval targets", () => {
    const issueRefs = {
      "6a6a8bab-853f-4658-9bc0-38e2386b642d": "a".repeat(40),
      "abe862d6-b052-49fe-8611-bc1ab6e24253": "b".repeat(40),
    };
    const issueRefsDigest = createHash("sha256").update(canonicalJson(issueRefs)).digest("hex");
    const native: ApprovalRecord = {
      ...executeApproval,
      action: "set-issue-graph",
      issueId: "6a6a8bab-853f-4658-9bc0-38e2386b642d",
      target: {
        repository: "BrandonJF/mandem",
        graph_sha256: "c".repeat(64),
        issue_refs: issueRefs,
        issue_refs_sha256: issueRefsDigest,
        implementation_sha: "d".repeat(40),
      },
    };
    const projection: ApprovalRecord = {
      ...executeApproval,
      action: "sync-issue-projection",
      issueId: "6a6a8bab-853f-4658-9bc0-38e2386b642d",
      target: {
        repository: "BrandonJF/mandem",
        graph_sha256: "a".repeat(64),
        transaction_sha256: "b".repeat(64),
        provider_snapshot_sha256: "c".repeat(64),
        operations_sha256: "d".repeat(64),
        implementation_sha: "e".repeat(40),
      },
    };
    expect(parseApproval(serializeApproval(native))).toEqual(native);
    expect(parseApproval(serializeApproval(projection))).toEqual(projection);
  });

  it("selects the unique descendant and lets a later denial revoke approval", async () => {
    const denied: ApprovalRecord = { ...executeApproval, decision: "denied", response: "DENIED" };
    const selected = await selectApproval(
      [
        { commit: "a".repeat(40), message: serializeApproval(executeApproval) },
        { commit: "b".repeat(40), message: serializeApproval(denied) },
      ],
      executeApproval,
      async (ancestor, descendant) => ancestor === descendant || descendant === "b".repeat(40),
    );
    expect(selected).toEqual({ commit: "b".repeat(40), record: denied, authorized: false });
  });

  it("denies absent, malformed matching, and incomparable approvals", async () => {
    await expect(selectApproval([], executeApproval, async () => false)).resolves.toBeUndefined();
    await expect(
      selectApproval(
        [{ commit: "a".repeat(40), message: serializeApproval(executeApproval).replace("actor:", "bad:") }],
        executeApproval,
        async () => false,
      ),
    ).rejects.toThrow(ApprovalContractError);
    await expect(
      selectApproval(
        [
          { commit: "a".repeat(40), message: serializeApproval(executeApproval) },
          { commit: "b".repeat(40), message: serializeApproval(executeApproval) },
        ],
        executeApproval,
        async (ancestor, descendant) => ancestor === descendant,
      ),
    ).rejects.toThrow(/incomparable/);
  });
});
