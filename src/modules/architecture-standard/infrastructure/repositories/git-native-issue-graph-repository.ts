/** @fileoverview Raw Git adapter for the local native issue graph. */
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { parseGraphMetadata, type LocalIssueRecord, type NativeIssueState, type ProviderMapping } from "../../domain/issue-graph-policy";
import type { LocalIssueGraphRepository } from "../../application/ports/issue-graph-repository";

const execute = promisify(execFile);
const ISSUE_REF_PREFIX = "refs/issues/";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

async function git(root: string, arguments_: readonly string[]): Promise<string> {
  try {
    const result = await execute("git", [...arguments_], { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    return result.stdout;
  } catch (error: unknown) {
    const output = error as { stderr?: string };
    throw new Error(output.stderr?.trim() || `git ${arguments_.join(" ")} failed`);
  }
}

function commitMessage(commit: string): string {
  const separator = commit.indexOf("\n\n");
  return separator < 0 ? "" : commit.slice(separator + 2);
}

function stateFromMessages(messages: readonly string[]): NativeIssueState {
  for (const message of messages) {
    if (/^State:/m.test(message) && !/^State:\s*(open|closed)\s*$/m.test(message)) throw new Error("IGRAPH-NATIVE-METADATA: malformed State trailer");
    const state = /^State:\s*(open|closed)\s*$/m.exec(message)?.[1];
    if (state === "open" || state === "closed") return state;
  }
  return "open";
}

function labelsFromMessages(messages: readonly string[]): readonly string[] {
  for (const message of messages) {
    const value = /^Labels:\s*(.*)$/mu.exec(message)?.[1];
    if (value !== undefined) {
      return value.split(",").map((label) => label.trim()).filter(Boolean).sort();
    }
  }
  return [];
}

function providerMappings(messages: readonly string[]): readonly ProviderMapping[] {
  const mappings = new Map<string, ProviderMapping>();
  for (const message of messages) {
    if (/^Provider-ID:/m.test(message) && !/^Provider-ID:\s*github:[^/\s]+\/[^#\s]+#[1-9][0-9]*\s*$/m.test(message)) throw new Error("IGRAPH-PROVIDER-MAPPING: malformed Provider-ID trailer");
    for (const match of message.matchAll(/^Provider-ID:\s*github:([^/\s]+)\/([^#\s]+)#([1-9][0-9]*)\s*$/gm)) {
    const owner = match[1];
    const repository = match[2];
    const issueNumber = match[3];
    if (owner === undefined || repository === undefined || issueNumber === undefined) continue;
    const mapping: ProviderMapping = { provider: "github", owner, repository, issueNumber: Number(issueNumber) };
    mappings.set(`${mapping.owner}/${mapping.repository}#${mapping.issueNumber}`, mapping);
    }
  }
  if (mappings.size > 1) throw new Error("IGRAPH-PROVIDER-MAPPING: issue has distinct provider mappings");
  return [...mappings.values()].sort((left, right) => `${left.owner}/${left.repository}#${left.issueNumber}`.localeCompare(`${right.owner}/${right.repository}#${right.issueNumber}`));
}

async function isAncestor(root: string, ancestor: string, descendant: string): Promise<boolean> {
  try { await git(root, ["merge-base", "--is-ancestor", ancestor, descendant]); return true; }
  catch { return false; }
}

export class GitNativeIssueGraphRepository implements LocalIssueGraphRepository {
  constructor(private readonly root: string) {}

  async listIssueRefs(): Promise<readonly string[]> {
    const output = await git(this.root, ["for-each-ref", "--format=%(refname)", ISSUE_REF_PREFIX]);
    return output.split("\n").filter(Boolean).map((reference) => reference.slice(ISSUE_REF_PREFIX.length)).sort((left, right) => left.localeCompare(right));
  }

  async readIssue(issueId: string): Promise<LocalIssueRecord | null> {
    if (!UUID.test(issueId)) return null;
    let commits: string[];
    try { commits = (await git(this.root, ["rev-list", `${ISSUE_REF_PREFIX}${issueId}`])).split("\n").filter(Boolean); }
    catch { return null; }
    const messages = await Promise.all(commits.map(async (commit) => commitMessage(await git(this.root, ["cat-file", "commit", commit]))));
    const metadataCandidates = commits.map((commit, index) => ({ commit, message: messages[index] ?? "" })).filter((candidate) => candidate.message.startsWith("Mandem-Graph-Metadata:"));
    if (metadataCandidates.some((candidate) => !candidate.message.startsWith("Mandem-Graph-Metadata: v1\n"))) throw new Error("IGRAPH-NATIVE-METADATA: unsupported metadata version");
    if (metadataCandidates.length === 0) return { issueId, state: stateFromMessages(messages), labels: labelsFromMessages(messages), metadata: null, providerMappings: providerMappings(messages) };
    const maxima = [] as typeof metadataCandidates;
    for (const candidate of metadataCandidates) {
      const descendsFromAll = (await Promise.all(metadataCandidates.map(async (other) => other.commit === candidate.commit || isAncestor(this.root, other.commit, candidate.commit)))).every(Boolean);
      if (descendsFromAll) maxima.push(candidate);
    }
    if (maxima.length !== 1) throw new Error("IGRAPH-NATIVE-CONFLICT: no unique maximal metadata commit");
    const metadata = parseGraphMetadata(maxima[0]?.message ?? "", issueId);
    return { issueId, state: stateFromMessages(messages), labels: labelsFromMessages(messages), metadata, providerMappings: providerMappings(messages) };
  }

  async readPlan(path: string): Promise<string> {
    if (path === "" || isAbsolute(path) || path.split("/").includes("..")) throw new Error(`Unsafe plan path: ${path}`);
    const absolutePath = resolve(this.root, path);
    if (relative(this.root, absolutePath).startsWith("..")) throw new Error(`Plan path escapes repository: ${path}`);
    return readFile(absolutePath, "utf8");
  }
}
