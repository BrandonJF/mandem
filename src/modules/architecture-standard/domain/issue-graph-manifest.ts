/** @fileoverview Parses and canonically hashes the NativeIssueGraphV1 manifest. */
import { createHash } from "node:crypto";
import { canonicalJson } from "./approval-contract";
import { parseGraphMetadata, serializeGraphMetadata } from "./issue-graph-policy";
import type { NativeGraphMetadata } from "./issue-graph-types";

export interface NativeIssueGraphEntry {
  readonly issueId: string;
  readonly metadata: NativeGraphMetadata;
  readonly expectedNativeState: "open" | "closed";
  readonly expectedNativeLabels: readonly string[];
}

export interface NativeIssueGraphManifest {
  readonly version: 1;
  readonly issues: readonly NativeIssueGraphEntry[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function scalar(value: string): string | null {
  if (value === "null") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "string") return parsed;
  } catch {
    // The closed manifest accepts plain YAML scalars where quoting is unambiguous.
  }
  if (/^[^\s#[\],]+$/u.test(value)) return value;
  throw new Error(`invalid manifest scalar: ${value}`);
}

function list(value: string): string[] {
  if (value === "[]") return [];
  const body = /^\[(.*)\]$/u.exec(value)?.[1];
  if (body === undefined) throw new Error("manifest lists must use inline YAML arrays");
  if (body.trim() === "") return [];
  return body.split(",").map((entry) => scalar(entry.trim()) ?? "");
}

function entryBlocks(lines: readonly string[]): readonly string[][] {
  const blocks: string[][] = [];
  for (const line of lines) {
    if (/^ {2}- /u.test(line)) blocks.push([line]);
    else {
      const block = blocks.at(-1);
      if (!block) {
        if (line !== "") throw new Error(`invalid manifest line: ${line}`);
      } else {
        block.push(line);
      }
    }
  }
  return blocks;
}

function topLevelFields(block: readonly string[]): ReadonlyMap<string, string> {
  const fields = new Map<string, string>();
  for (const [index, line] of block.entries()) {
    const match = index === 0
      ? /^ {2}- ([a-z_]+):\s*(.*)$/u.exec(line)
      : /^ {4}([a-z_]+):\s*(.*)$/u.exec(line);
    if (!match || match[1] === undefined || match[2] === undefined) continue;
    if (fields.has(match[1])) throw new Error(`duplicate manifest field: ${match[1]}`);
    fields.set(match[1], match[2]);
  }
  return fields;
}

function metadataSource(block: readonly string[]): string {
  const omitted = new Set(["issue_id", "expected_native_state", "expected_native_labels"]);
  const kept: string[] = [];
  let omitNested = false;
  for (const [index, line] of block.entries()) {
    const normalized = index === 0 ? line.replace(/^ {2}- /u, "") : line.replace(/^ {4}/u, "");
    const top = /^([a-z_]+):/u.exec(normalized)?.[1];
    if (top !== undefined) {
      omitNested = omitted.has(top);
      if (!omitNested) kept.push(normalized);
    } else if (!omitNested) {
      kept.push(normalized);
    }
  }
  return `Mandem-Graph-Metadata: v1\n${kept.join("\n")}\n`;
}

export function parseNativeIssueGraphManifest(source: string): NativeIssueGraphManifest {
  if (source.includes("\r")) throw new Error("manifest must use LF line endings");
  const lines = source.split("\n");
  if (lines[0] !== "version: 1" || lines[1] !== "issues:") {
    throw new Error("manifest must begin with version: 1 and issues:");
  }
  const issues = entryBlocks(lines.slice(2)).map((block): NativeIssueGraphEntry => {
    const fields = topLevelFields(block);
    const allowed = new Set([
      "issue_id", "issue_key", "epic_issue_id", "plan", "parent_issue_id",
      "depends_on_issue_ids", "expected_native_state", "expected_native_labels",
      "provider", "milestone", "managed_labels",
    ]);
    for (const name of fields.keys()) if (!allowed.has(name)) throw new Error(`unknown manifest field: ${name}`);
    const required = (name: string): string => {
      const value = fields.get(name);
      if (value === undefined) throw new Error(`manifest issue is missing ${name}`);
      return value;
    };
    const issueId = scalar(required("issue_id")) ?? "";
    const state = scalar(required("expected_native_state"));
    if (!UUID.test(issueId) || (state !== "open" && state !== "closed")) {
      throw new Error("manifest issue has invalid identity or state");
    }
    const labels = list(required("expected_native_labels"));
    const dependencies = list(required("depends_on_issue_ids"));
    if (dependencies.some((dependency, index) => index > 0 && dependency <= (dependencies[index - 1] ?? ""))) {
      throw new Error("depends_on_issue_ids must be unique and sorted");
    }
    if (labels.some((label, index) => index > 0 && label <= (labels[index - 1] ?? ""))) {
      throw new Error("expected_native_labels must be unique and sorted");
    }
    return {
      issueId,
      metadata: parseGraphMetadata(metadataSource(block), issueId),
      expectedNativeState: state,
      expectedNativeLabels: labels,
    };
  });
  if (
    issues.length === 0 ||
    issues.some((entry, index) => index > 0 && entry.issueId <= (issues[index - 1]?.issueId ?? ""))
  ) {
    throw new Error("manifest issues must be non-empty, unique, and sorted");
  }
  return { version: 1, issues };
}

function canonicalManifest(manifest: NativeIssueGraphManifest): unknown {
  return {
    version: 1,
    issues: manifest.issues.map((entry) => ({
      issue_id: entry.issueId,
      metadata: serializeGraphMetadata(entry.metadata),
      expected_native_state: entry.expectedNativeState,
      expected_native_labels: [...entry.expectedNativeLabels],
    })),
  };
}

export function graphDigest(manifest: NativeIssueGraphManifest): string {
  return createHash("sha256").update(canonicalJson(canonicalManifest(manifest))).digest("hex");
}
