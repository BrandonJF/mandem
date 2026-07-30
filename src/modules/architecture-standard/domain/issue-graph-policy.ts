/** @fileoverview Pure parsing and validation for native issue graph metadata. */
import type { EpicPolicy, IssueGraphFinding, IssueGraphResult, IssuePromotion, LocalIssueRecord, NativeGraphMetadata, PlanDeclaration } from "./issue-graph-types";
export type { EpicPolicy, IssueGraphFinding, IssueGraphResult, LocalIssueRecord, NativeGraphMetadata, NativeIssueState, PlanDeclaration, ProviderMapping } from "./issue-graph-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ISSUE_KEY = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/;
const PROMOTIONS: readonly IssuePromotion[] = ["scaffolded", "planned", "clean-room-approved", "executable", "complete"];
const METADATA_MARKER = "Mandem-Graph-Metadata: v1";

export class IssueGraphParseError extends Error {}

function isUuid(value: string): boolean { return UUID.test(value); }

function unquote(value: string): string {
  const quoted = /^"((?:[^"\\]|\\.)*)"$/.exec(value);
  if (quoted?.[1] !== undefined) return quoted[1].replace(/\\(["\\])/g, "$1");
  if (/^[^\s#]+$/.test(value)) return value;
  throw new IssueGraphParseError(`Invalid scalar value: ${value}`);
}

function parseNullableScalar(value: string): string | null {
  return value === "null" ? null : unquote(value);
}

function parseStringList(value: string): string[] {
  if (value === "[]") return [];
  const content = /^\[(.*)\]$/.exec(value)?.[1];
  if (content === undefined) throw new IssueGraphParseError(`Expected an inline list: ${value}`);
  return content.split(",").map((part) => unquote(part.trim())).filter(Boolean);
}

type YamlValue = string | null | string[] | Map<string, string | null | Map<string, string | null>>;

function parseDocument(source: string, marker: string | null): Map<string, YamlValue> {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  if (marker !== null) {
    if (lines.shift() !== marker) throw new IssueGraphParseError(`Expected ${marker}`);
  }
  const fields = new Map<string, YamlValue>();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line === "") continue;
    const match = /^([a-z_]+):(?:\s*(.*))$/.exec(line);
    if (!match) throw new IssueGraphParseError(`Invalid metadata line: ${line}`);
    const name = match[1];
    const value = match[2];
    if (name === undefined || value === undefined) throw new IssueGraphParseError(`Invalid metadata line: ${line}`);
    if (fields.has(name)) throw new IssueGraphParseError(`Duplicate metadata field: ${name}`);
    if (value !== "") { fields.set(name, value); continue; }
    const block: string[] = [];
    while ((lines[index + 1] ?? "").startsWith("  ")) { index += 1; block.push((lines[index] ?? "").slice(2)); }
    if (block.every((entry) => /^-\s+/.test(entry))) fields.set(name, block.map((entry) => unquote(entry.slice(2))));
    else {
      const map = new Map<string, string | null | Map<string, string | null>>();
      for (let blockIndex = 0; blockIndex < block.length; blockIndex += 1) {
        const entry = block[blockIndex] ?? "";
        const child = /^([a-z_][a-z0-9_-]*):(?:\s*(.*))$/.exec(entry);
        if (!child || child[1] === undefined || child[2] === undefined) throw new IssueGraphParseError(`Invalid nested metadata line: ${entry}`);
        const childName = child[1];
        const childValue = child[2];
        if (map.has(childName)) throw new IssueGraphParseError(`Duplicate nested metadata field: ${childName}`);
        if (childValue !== "") { map.set(childName, childValue === "null" ? null : childValue); continue; }
        const nested = new Map<string, string | null>();
        while ((block[blockIndex + 1] ?? "").startsWith("  ")) {
          blockIndex += 1;
          const nestedLine = (block[blockIndex] ?? "").slice(2);
          const nestedMatch = /^([a-z_]+):\s*(.+)$/.exec(nestedLine);
          if (!nestedMatch || nestedMatch[1] === undefined || nestedMatch[2] === undefined) throw new IssueGraphParseError(`Invalid nested metadata line: ${nestedLine}`);
          nested.set(nestedMatch[1], nestedMatch[2] === "null" ? null : nestedMatch[2]);
        }
        map.set(childName, nested);
      }
      fields.set(name, map);
    }
  }
  return fields;
}

function requiredString(fields: ReadonlyMap<string, unknown>, name: string): string {
  const value = fields.get(name);
  if (typeof value !== "string") throw new IssueGraphParseError(`Missing or invalid metadata field: ${name}`);
  return value;
}

function nullableString(fields: ReadonlyMap<string, unknown>, name: string): string | null {
  const value = fields.get(name);
  if (value === null) return null;
  if (typeof value === "string") return parseNullableScalar(value);
  throw new IssueGraphParseError(`Missing or invalid metadata field: ${name}`);
}

function requiredList(fields: Map<string, YamlValue>, name: string): string[] {
  const value = fields.get(name);
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return parseStringList(value);
  throw new IssueGraphParseError(`Missing or invalid metadata field: ${name}`);
}

function requireOnly(fields: Map<string, YamlValue>, allowed: readonly string[]): void {
  for (const name of fields.keys()) if (!allowed.includes(name)) throw new IssueGraphParseError(`Unknown metadata field: ${name}`);
}

export function parseGraphMetadata(source: string, issueId?: string): NativeGraphMetadata {
  const fields = parseDocument(source, METADATA_MARKER);
  const epic = fields.has("provider") || fields.has("milestone") || fields.has("managed_labels");
  requireOnly(fields, epic ? ["issue_key", "epic_issue_id", "plan", "parent_issue_id", "depends_on_issue_ids", "provider", "milestone", "managed_labels"] : ["issue_key", "epic_issue_id", "plan", "parent_issue_id", "depends_on_issue_ids"]);
  const metadata: NativeGraphMetadata = {
    issueKey: unquote(requiredString(fields, "issue_key")),
    epicIssueId: unquote(requiredString(fields, "epic_issue_id")),
    plan: parseNullableScalar(requiredString(fields, "plan")),
    parentIssueId: parseNullableScalar(requiredString(fields, "parent_issue_id")),
    dependsOnIssueIds: requiredList(fields, "depends_on_issue_ids").sort(),
  };
  if (!ISSUE_KEY.test(metadata.issueKey)) throw new IssueGraphParseError(`Invalid issue key: ${metadata.issueKey}`);
  if (!isUuid(metadata.epicIssueId)) throw new IssueGraphParseError(`Invalid epic issue id: ${metadata.epicIssueId}`);
  if (metadata.parentIssueId !== null && !isUuid(metadata.parentIssueId)) throw new IssueGraphParseError(`Invalid parent issue id: ${metadata.parentIssueId}`);
  for (const dependency of metadata.dependsOnIssueIds) if (!isUuid(dependency)) throw new IssueGraphParseError(`Invalid dependency issue id: ${dependency}`);
  let epicPolicy: EpicPolicy | undefined;
  if (epic) {
    const provider = fields.get("provider"); const milestone = fields.get("milestone"); const managedLabels = fields.get("managed_labels");
    if (!(provider instanceof Map) || !(milestone instanceof Map) || !(managedLabels instanceof Map)) throw new IssueGraphParseError("Epic policy must use nested mappings");
    requireOnly(provider as Map<string, YamlValue>, ["kind", "owner", "repository"]);
    requireOnly(milestone as Map<string, YamlValue>, ["title", "description", "state", "due_on"]);
    const labels: Record<string, { color: string; description: string }> = {};
    for (const [name, label] of managedLabels) {
      if (!(label instanceof Map)) throw new IssueGraphParseError(`Managed label ${name} must be a mapping`);
      requireOnly(label as Map<string, YamlValue>, ["color", "description"]);
      labels[name] = {
        color: unquote(requiredString(label as Map<string, YamlValue>, "color")),
        description: unquote(requiredString(label as Map<string, YamlValue>, "description")),
      };
    }
    const state = unquote(requiredString(milestone as Map<string, YamlValue>, "state"));
    if (unquote(requiredString(provider as Map<string, YamlValue>, "kind")) !== "github" || (state !== "open" && state !== "closed")) throw new IssueGraphParseError("Invalid epic provider or milestone state");
    epicPolicy = { provider: { kind: "github", owner: unquote(requiredString(provider as Map<string, YamlValue>, "owner")), repository: unquote(requiredString(provider as Map<string, YamlValue>, "repository")) }, milestone: { title: unquote(requiredString(milestone as Map<string, YamlValue>, "title")), description: unquote(requiredString(milestone as Map<string, YamlValue>, "description")), state, dueOn: nullableString(milestone, "due_on") }, managedLabels: labels };
  }
  if (issueId !== undefined && epic !== (issueId === metadata.epicIssueId)) throw new IssueGraphParseError(epic ? "Only the epic root may provide epic policy fields" : "Epic root requires epic policy fields");
  return epicPolicy ? { ...metadata, epicPolicy } : metadata;
}

export function parsePlanDeclaration(source: string): PlanDeclaration {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  if (lines.shift() !== "---") throw new IssueGraphParseError("Plan must start with frontmatter");
  const end = lines.indexOf("---");
  if (end < 0) throw new IssueGraphParseError("Plan frontmatter is not closed");
  const fields = parseDocument(lines.slice(0, end).join("\n"), null);
  const promotion = unquote(requiredString(fields, "promotion")) as IssuePromotion;
  const authorization = requiredString(fields, "execution_authorized");
  if (!PROMOTIONS.includes(promotion)) throw new IssueGraphParseError(`Invalid promotion: ${promotion}`);
  if (authorization !== "true" && authorization !== "false") throw new IssueGraphParseError("execution_authorized must be true or false");
  const declaration: PlanDeclaration = {
    epicIssueId: unquote(requiredString(fields, "epic_issue_id")),
    issueId: unquote(requiredString(fields, "issue_id")),
    dependsOnIssueIds: requiredList(fields, "depends_on_issue_ids").sort(),
    promotion,
    executionAuthorized: authorization === "true",
  };
  if (!isUuid(declaration.epicIssueId) || !isUuid(declaration.issueId)) throw new IssueGraphParseError("Plan issue identifiers must be UUIDs");
  for (const dependency of declaration.dependsOnIssueIds) if (!isUuid(dependency)) throw new IssueGraphParseError(`Invalid plan dependency: ${dependency}`);
  return declaration;
}

export function serializeGraphMetadata(metadata: NativeGraphMetadata): string {
  const quote = (value: string): string => `"${value.replace(/["\\]/g, "\\$&")}"`;
  const lines = [METADATA_MARKER, `issue_key: ${quote(metadata.issueKey)}`, `epic_issue_id: ${quote(metadata.epicIssueId)}`, `plan: ${metadata.plan === null ? "null" : quote(metadata.plan)}`, `parent_issue_id: ${metadata.parentIssueId === null ? "null" : quote(metadata.parentIssueId)}`, `depends_on_issue_ids: [${[...metadata.dependsOnIssueIds].sort().map(quote).join(", ")}]`];
  if (metadata.epicPolicy) {
    lines.push("provider:", `  kind: "github"`, `  owner: ${quote(metadata.epicPolicy.provider.owner)}`, `  repository: ${quote(metadata.epicPolicy.provider.repository)}`, "milestone:", `  title: ${quote(metadata.epicPolicy.milestone.title)}`, `  description: ${quote(metadata.epicPolicy.milestone.description)}`, `  state: ${quote(metadata.epicPolicy.milestone.state)}`, `  due_on: ${metadata.epicPolicy.milestone.dueOn === null ? "null" : quote(metadata.epicPolicy.milestone.dueOn)}`, "managed_labels:");
    for (const name of Object.keys(metadata.epicPolicy.managedLabels).sort()) { const label = metadata.epicPolicy.managedLabels[name]; if (!label) continue; lines.push(`  ${name}:`, `    color: ${quote(label.color)}`, `    description: ${quote(label.description)}`); }
  }
  return `${lines.join("\n")}\n`;
}

function safePlanPath(path: string): boolean { return path !== "" && !path.startsWith("/") && !path.split("/").includes(".."); }

function finding(ruleId: string, issueId: string, path: string, message: string): IssueGraphFinding { return { ruleId, issueId, path, message }; }

function dependencyCycle(records: readonly LocalIssueRecord[], issueId: string): boolean {
  const byId = new Map(records.map((record) => [record.issueId, record]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const cyclic = (byId.get(id)?.metadata?.dependsOnIssueIds ?? []).some(visit);
    visiting.delete(id);
    visited.add(id);
    return cyclic;
  };
  return visit(issueId);
}

function reachesEpicRoot(records: ReadonlyMap<string, LocalIssueRecord>, issueId: string, rootId: string): boolean {
  const visited = new Set<string>();
  let current = records.get(issueId);
  while (current && !visited.has(current.issueId)) {
    if (current.issueId === rootId) return true;
    visited.add(current.issueId);
    const parentId = current.metadata?.parentIssueId;
    current = parentId === null || parentId === undefined ? undefined : records.get(parentId);
  }
  return false;
}

export function evaluateIssueGraph(records: readonly LocalIssueRecord[], plans: ReadonlyMap<string, PlanDeclaration>): IssueGraphResult {
  const findings: IssueGraphFinding[] = [];
  const byId = new Map(records.map((record) => [record.issueId, record]));
  const keys = new Map<string, string>();
  const providers = new Map<string, string>();
  const roots: LocalIssueRecord[] = [];
  for (const record of records) {
    if (!isUuid(record.issueId)) findings.push(finding("IGRAPH-UUID", record.issueId, "", "Issue ref must be a full UUID."));
    if (record.metadata === null) { findings.push(finding("IGRAPH-NATIVE-METADATA", record.issueId, "", "Issue has no graph metadata.")); continue; }
    const metadata = record.metadata;
    if (keys.has(metadata.issueKey)) findings.push(finding("IGRAPH-ISSUE-KEY", record.issueId, "", `Issue key duplicates ${keys.get(metadata.issueKey)}.`));
    else keys.set(metadata.issueKey, record.issueId);
    if (metadata.parentIssueId === null && metadata.epicIssueId === record.issueId) roots.push(record);
    if (metadata.plan !== null && !safePlanPath(metadata.plan)) findings.push(finding("IGRAPH-PATH", record.issueId, metadata.plan, "Plan path must be a non-empty repository-relative path."));
    for (const provider of record.providerMappings) {
      const providerId = `${provider.provider}:${provider.owner}/${provider.repository}#${provider.issueNumber}`;
      if (providers.has(providerId)) findings.push(finding("IGRAPH-PROVIDER-MAPPING", record.issueId, "", `Provider mapping duplicates ${providers.get(providerId)}.`));
      else providers.set(providerId, record.issueId);
    }
    for (const dependency of metadata.dependsOnIssueIds) if (!byId.has(dependency)) findings.push(finding("IGRAPH-DEPENDENCY", record.issueId, "", `Dependency ${dependency} does not exist.`));
    if (dependencyCycle(records, record.issueId)) findings.push(finding("IGRAPH-CYCLE", record.issueId, "", "Issue dependencies contain a cycle."));
    if (metadata.plan !== null) {
      const plan = plans.get(metadata.plan);
      if (!plan) findings.push(finding("IGRAPH-PLAN", record.issueId, metadata.plan, "Referenced plan could not be read."));
      else {
        if (plan.issueId !== record.issueId || plan.epicIssueId !== metadata.epicIssueId || plan.dependsOnIssueIds.join("\0") !== metadata.dependsOnIssueIds.join("\0")) findings.push(finding("IGRAPH-FRONTMATTER", record.issueId, metadata.plan, "Plan frontmatter does not agree with issue metadata."));
        if (plan.executionAuthorized && plan.promotion !== "executable") findings.push(finding("IGRAPH-AUTHORIZATION", record.issueId, metadata.plan, "Only executable plans may authorize execution."));
      }
    }
  }
  if (roots.length !== 1) findings.push(finding("IGRAPH-EPIC", "", "", "The graph must have exactly one epic root."));
  const root = roots[0];
  if (root && !root.metadata?.epicPolicy) findings.push(finding("IGRAPH-EPIC", root.issueId, "", "Epic root must provide provider, milestone, and managed labels."));
  if (root) for (const record of records) {
    const metadata = record.metadata;
    if (!metadata || record.issueId === root.issueId) continue;
    if (metadata.epicPolicy) findings.push(finding("IGRAPH-EPIC", record.issueId, "", "Only the epic root may provide epic policy fields."));
    if (metadata.epicIssueId !== root.issueId) findings.push(finding("IGRAPH-EPIC", record.issueId, "", "Issue belongs to a different epic."));
    if (metadata.parentIssueId === null || !byId.has(metadata.parentIssueId)) findings.push(finding("IGRAPH-EPIC", record.issueId, "", "Child issue must name an existing parent."));
    else if (!reachesEpicRoot(byId, record.issueId, root.issueId)) findings.push(finding("IGRAPH-EPIC", record.issueId, "", "Parent chain does not reach the epic root."));
  }
  return { findings: findings.sort((left, right) => left.ruleId.localeCompare(right.ruleId) || left.issueId.localeCompare(right.issueId) || left.path.localeCompare(right.path) || left.message.localeCompare(right.message)) };
}
