/** @fileoverview Composes local native issue graph checking and guarded metadata application. */
import { createHash } from "node:crypto";
import { canonicalJson, type SetIssueGraphTarget } from "../domain/approval-contract";
import {
  graphDigest,
  type NativeIssueGraphManifest,
} from "../domain/issue-graph-manifest";
import { serializeGraphMetadata } from "../domain/issue-graph-policy";
import { checkIssueGraph } from "../application/use-cases/check-issue-graph";
import { GitNativeIssueGraphRepository } from "../infrastructure/repositories/git-native-issue-graph-repository";
import { NativeIssueGraphApprovalReader } from "../infrastructure/services/native-issue-graph-approval";
import { NativeIssueGraphWriter } from "../infrastructure/services/native-issue-graph-writer";

export async function runLocalIssueGraphCheck(root: string) {
  return checkIssueGraph(new GitNativeIssueGraphRepository(root));
}

function digestRefs(issueRefs: Readonly<Record<string, string>>): string {
  return createHash("sha256").update(canonicalJson(issueRefs)).digest("hex");
}

async function nativeTarget(
  manifest: NativeIssueGraphManifest,
  implementationSha: string,
  writer: NativeIssueGraphWriter,
): Promise<SetIssueGraphTarget> {
  const issueRefs: Record<string, string> = {};
  for (const entry of manifest.issues) issueRefs[entry.issueId] = await writer.remoteHead(entry.issueId);
  return {
    repository: "BrandonJF/mandem",
    graph_sha256: graphDigest(manifest),
    issue_refs: issueRefs,
    issue_refs_sha256: digestRefs(issueRefs),
    implementation_sha: implementationSha,
  };
}

function assertExpectedNativeState(
  manifest: NativeIssueGraphManifest,
  records: Awaited<ReturnType<GitNativeIssueGraphRepository["readIssue"]>>[],
): void {
  const epic = manifest.issues.find((entry) => entry.metadata.epicPolicy !== undefined);
  const managedLabels = new Set(Object.keys(epic?.metadata.epicPolicy?.managedLabels ?? {}));
  for (const [index, entry] of manifest.issues.entries()) {
    const record = records[index];
    if (!record) throw new Error(`native issue is missing: ${entry.issueId}`);
    const labels = record.labels.filter((label) => managedLabels.has(label)).sort();
    if (record.state !== entry.expectedNativeState || labels.join("\0") !== entry.expectedNativeLabels.join("\0")) {
      throw new Error(`native issue state or managed labels changed: ${entry.issueId}`);
    }
  }
}

export async function previewNativeIssueGraph(input: {
  readonly root: string;
  readonly manifest: NativeIssueGraphManifest;
  readonly implementationSha: string;
}): Promise<SetIssueGraphTarget> {
  return nativeTarget(input.manifest, input.implementationSha, new NativeIssueGraphWriter(input.root));
}

export async function runApplyNativeIssueGraph(input: {
  readonly root: string;
  readonly manifest: NativeIssueGraphManifest;
  readonly implementationSha: string;
  readonly approvalIssueId: string;
}): Promise<{ readonly commits: number; readonly pushes: number; readonly target: SetIssueGraphTarget }> {
  const graphSha256 = graphDigest(input.manifest);
  const approval = await new NativeIssueGraphApprovalReader(input.root).authorize({
    approvalIssueId: input.approvalIssueId,
    graphSha256,
    implementationSha: input.implementationSha,
  });
  const expectedIds = input.manifest.issues.map((entry) => entry.issueId);
  if (
    Object.keys(approval.target.issue_refs).sort().join("\0") !== expectedIds.join("\0") ||
    approval.target.issue_refs_sha256 !== digestRefs(approval.target.issue_refs)
  ) {
    throw new Error("approved native issue ref map does not match the manifest");
  }

  const repository = new GitNativeIssueGraphRepository(input.root);
  const records = await Promise.all(expectedIds.map(async (issueId) => repository.readIssue(issueId)));
  assertExpectedNativeState(input.manifest, records);
  const writer = new NativeIssueGraphWriter(input.root);
  let commits = 0;
  let pushes = 0;
  for (const [index, entry] of input.manifest.issues.entries()) {
    const current = records[index]?.metadata;
    const payload = serializeGraphMetadata(entry.metadata);
    if (current && serializeGraphMetadata(current) === payload) continue;
    const baseline = approval.target.issue_refs[entry.issueId];
    if (!baseline) throw new Error(`approved baseline is missing: ${entry.issueId}`);
    const result = await writer.apply({
      issueId: entry.issueId,
      approvedBaseline: baseline,
      payload,
      approvalCommit: approval.commit,
      approvalIssueId: input.approvalIssueId,
      approvalTimestamp: approval.timestamp,
    });
    if (result.action === "created") {
      commits += 1;
      pushes += 1;
    } else if (result.action === "pushed") {
      pushes += 1;
    }
  }
  return { commits, pushes, target: approval.target };
}
