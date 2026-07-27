/** @fileoverview Versioned documentation and authored-source policy evaluators. */
import type { AnalysisResult, RepositoryPolicy, RepositorySnapshot, RuleViolation } from "./types";

const typeScriptPath = /\.(?:ts|tsx)$/;
const maintainedDocumentPath = /\.(?:md|ya?ml)$/i;
const placeholderOverview = /^(?:todo|tbd|description|file|placeholder)$/i;

export const documentationPolicyV1: RepositoryPolicy = {
  recursiveDocumentationRoots: ["docs"],
  rootIndexEntries: ["AGENTS.md", "CLAUDE.md", "PLANS.md", ".agents/OPERATING.md", "docs/README.md", "scripts/README.md", ".githooks/README.md", "src/modules/README.md"],
  specialIndexes: {
    ".agents/skills": ["SKILL.md"],
    "scripts": ["README.md"],
    ".githooks": ["README.md"],
    "src/modules": ["README.md"]
  },
  excludedSegments: [".git", ".codex", ".claude", ".github", "node_modules", "dist", "coverage", "generated", "vendor", "vendored"],
  excludedPrefixes: ["tests/fixtures/"],
  authoredSourceIncludes: ["src/", "scripts/", "tests/", "*.config.ts", "*.config.tsx"],
  authoredSourceExcludes: ["tests/fixtures/", "*.d.ts"]
};

export const authoredSourcePolicyV1: RepositoryPolicy = documentationPolicyV1;

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+/g, "/").replace(/\/$/, "");
}

function hasExcludedSegment(path: string, policy: RepositoryPolicy): boolean {
  return normalizePath(path).split("/").some((segment) => policy.excludedSegments.includes(segment));
}

function matchesAuthoredPathPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith("/")) return path.startsWith(pattern);
  if (pattern.startsWith("*.")) return path.endsWith(pattern.slice(1));
  return path === pattern;
}

function authoredPathMatch(path: string, policy: RepositoryPolicy): { excluded: boolean; included: boolean; production: boolean } {
  const normalized = normalizePath(path);
  const excluded = policy.authoredSourceExcludes.some((pattern) => matchesAuthoredPathPattern(normalized, pattern)) || hasExcludedSegment(normalized, policy);
  const included = typeScriptPath.test(normalized) && !excluded && policy.authoredSourceIncludes.some((pattern) => matchesAuthoredPathPattern(normalized, pattern));
  return { excluded, included, production: typeScriptPath.test(normalized) && normalized.startsWith("src/") && !/(?:^|\/)tests(?:\/|$)/.test(normalized) };
}

export function isExcludedAuthoredPath(path: string, policy: RepositoryPolicy = authoredSourcePolicyV1): boolean {
  return authoredPathMatch(path, policy).excluded;
}

export function isIncludedAuthoredTypeScriptPath(path: string, policy: RepositoryPolicy = authoredSourcePolicyV1): boolean {
  return authoredPathMatch(path, policy).included;
}

export function isProductionTypeScriptPath(path: string, policy: RepositoryPolicy = authoredSourcePolicyV1): boolean {
  return authoredPathMatch(path, policy).production;
}

function finding(ruleId: string, path: string, message: string): RuleViolation {
  return { ruleId, severity: "error", path, message };
}

function sorted(violations: RuleViolation[]): AnalysisResult {
  return { violations: violations.sort((left, right) => left.ruleId.localeCompare(right.ruleId) || left.path.localeCompare(right.path) || left.message.localeCompare(right.message)) };
}

function directory(path: string): string {
  const separator = path.lastIndexOf("/");
  return separator < 0 ? "" : path.slice(0, separator);
}

function isDocumentationPath(path: string, policy: RepositoryPolicy): boolean {
  const normalized = normalizePath(path);
  if (hasExcludedSegment(normalized, policy) || policy.excludedPrefixes.some((prefix) => normalized.startsWith(prefix))) return false;
  return policy.recursiveDocumentationRoots.some((root) => normalized === root || normalized.startsWith(`${root}/`)) && maintainedDocumentPath.test(normalized);
}

function isSpecialDocument(path: string, policy: RepositoryPolicy): boolean {
  const normalized = normalizePath(path);
  if (hasExcludedSegment(normalized, policy) || !normalized.endsWith(".md")) return false;
  if (normalized === "README.md") return true;
  if (policy.rootIndexEntries.includes(normalized)) return true;
  if (normalized.startsWith(".agents/skills/") && normalized.endsWith("/SKILL.md")) return true;
  if (normalized.startsWith(".agents/skills/") && normalized.includes("/references/")) return true;
  if (normalized.startsWith("scripts/") || normalized.startsWith(".githooks/") || normalized === "src/modules/README.md") return true;
  return /^src\/modules\/[^/]+\/README\.md$/.test(normalized);
}

function isExcludedDocumentationFile(path: string): boolean {
  return /^\.agents\/skills\/[^/]+\/agents\/openai\.yaml$/.test(path);
}

function decodeTarget(value: string): string | undefined {
  const withoutWrapper = value.trim().replace(/^<(.+)>$/, "$1");
  const target = withoutWrapper.replace(/[?#].*$/, "");
  if (target === "") return undefined;
  if (/^(?:https?:|mailto:|#)/i.test(target)) return "";
  if (target.includes("\\")) return undefined;
  try { return decodeURIComponent(target); } catch { return undefined; }
}

function resolveLink(from: string, target: string): string | undefined {
  const segments = [...directory(from).split("/"), ...target.split("/")];
  const resolved: string[] = [];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") { if (resolved.length === 0) return undefined; resolved.pop(); }
    else resolved.push(segment);
  }
  return resolved.join("/");
}

function readmeLinks(path: string, text: string): Array<{ target: string; resolved?: string }> {
  const definitions = new Map<string, string>();
  for (const match of text.matchAll(/^\s*\[([^\]]+)\]:\s*(\S.*?)\s*$/gm)) definitions.set(match[1]?.trim().toLowerCase() ?? "", match[2] ?? "");
  const targets = [...text.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)|(?<!!)\[[^\]]+\]\[([^\]]+)\]/g)].map((match) => match[1] ?? definitions.get((match[2] ?? "").trim().toLowerCase()) ?? "");
  return targets.map((value) => ({ target: value, resolved: (() => { const decoded = decodeTarget(value); return decoded === undefined || decoded === "" ? decoded : resolveLink(path, decoded); })() }));
}

function hasIndexLink(index: { readonly path: string; readonly text: string }, target: string): boolean {
  return readmeLinks(index.path, index.text).some((link) => link.resolved === target || `${link.resolved}/README.md` === target);
}

function specialIndexTargets(files: readonly { readonly path: string }[]): ReadonlyMap<string, readonly string[]> {
  const targets = new Map<string, string[]>();
  const add = (index: string, target: string): void => {
    if (target === index) return;
    const values = targets.get(index) ?? [];
    values.push(target);
    targets.set(index, values);
  };
  for (const file of files) {
    const path = file.path;
    const skill = path.match(/^\.agents\/skills\/[^/]+\//)?.[0]?.slice(0, -1);
    if (skill && path.endsWith(".md") && path !== `${skill}/SKILL.md`) add(`${skill}/SKILL.md`, path);
    if (path.startsWith("scripts/") && path.endsWith(".md") && path !== "scripts/README.md" && (!path.slice("scripts/".length).includes("/") || path.endsWith("/README.md"))) add("scripts/README.md", path);
    if (path.startsWith(".githooks/") && path.endsWith(".md") && path !== ".githooks/README.md") add(".githooks/README.md", path);
    if (/^src\/modules\/[^/]+\/README\.md$/.test(path)) add("src/modules/README.md", path);
    if (/^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(path)) add("README.md", path);
  }
  return new Map([...targets].map(([index, values]) => [index, [...new Set(values)].sort()]));
}

export function hasUsefulFileoverview(text: string): boolean {
  const content = text.replace(/^#![^\n]*(?:\n|$)/, "");
  const match = content.match(/^\/\*\*([\s\S]*?)\*\//);
  if (!match || !/@fileoverview\b/i.test(match[1] ?? "")) return false;
  const value = (match[1] ?? "").match(/@fileoverview\b([^@]*)/i)?.[1] ?? "";
  return value.replace(/\*\s*/g, " ").split(/\s+/).map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").toLowerCase()).some((word) => word !== "" && !placeholderOverview.test(word));
}

export function evaluateDocumentation(snapshot: RepositorySnapshot, policy: RepositoryPolicy = documentationPolicyV1): AnalysisResult {
  const files = snapshot.files.map((file) => ({ ...file, path: normalizePath(file.path) }));
  const paths = new Set(files.map((file) => file.path));
  const documents = files.filter((file) => isDocumentationPath(file.path, policy));
  const violations: RuleViolation[] = [];
  if (!paths.has("README.md")) violations.push(finding("DOC-LOCAL-README", "README.md", "add the repository root README.md"));
  const directories = new Set<string>();
  for (const file of documents) {
    let current = directory(file.path);
    while (current.startsWith("docs")) { directories.add(current); current = directory(current); }
  }
  for (const directoryPath of [...directories].sort()) {
    const readme = directoryPath === "" ? "README.md" : `${directoryPath}/README.md`;
    if (!paths.has(readme)) violations.push(finding("DOC-LOCAL-README", directoryPath, "add README.md to index this documentation directory"));
  }
  for (const file of documents.filter((file) => !file.path.endsWith("/README.md"))) {
    const readme = `${directory(file.path)}/README.md`;
    const links = files.find((candidate) => candidate.path === readme);
    if (links && !readmeLinks(readme, links.text).some((link) => link.resolved === file.path)) violations.push(finding("DOC-LOCAL-INDEX", file.path, "link this document from the local README.md"));
  }
  for (const directoryPath of [...directories].sort()) {
    const parentReadme = `${directory(directoryPath)}/README.md`;
    const parent = files.find((file) => file.path === parentReadme);
    const childReadme = `${directoryPath}/README.md`;
    if (parent && !readmeLinks(parentReadme, parent.text).some((link) => link.resolved === childReadme || link.resolved === directoryPath)) violations.push(finding("DOC-PARENT-INDEX", childReadme, "link this child README.md from its parent README.md"));
  }
  const rootReadme = files.find((file) => file.path === "README.md");
  if (rootReadme) for (const entry of policy.rootIndexEntries.filter((candidate) => paths.has(candidate))) {
    if (!hasIndexLink(rootReadme, entry)) violations.push(finding("DOC-LOCAL-INDEX", entry, "link this required document from the root README.md"));
  }
  for (const [indexPath, targets] of specialIndexTargets(files)) {
    const index = files.find((file) => file.path === indexPath);
    if (!index) {
      violations.push(finding("DOC-LOCAL-README", indexPath, "add the required documentation index"));
      continue;
    }
    for (const target of targets) if (!hasIndexLink(index, target)) violations.push(finding("DOC-LOCAL-INDEX", target, `link this document from ${indexPath}`));
  }
  for (const readme of files.filter((file) => (file.path.endsWith("README.md") || file.path.endsWith("/SKILL.md")) && (isDocumentationPath(file.path, policy) || isSpecialDocument(file.path, policy)))) {
    for (const link of readmeLinks(readme.path, readme.text)) {
      if (link.resolved === "") continue;
      if (link.resolved === undefined || (!paths.has(link.resolved) && !paths.has(`${link.resolved}/README.md`))) violations.push(finding("DOC-BROKEN-LOCAL-LINK", readme.path, "repair or remove the broken local link"));
    }
  }
  for (const file of files.filter((candidate) => maintainedDocumentPath.test(candidate.path) && !isExcludedDocumentationFile(candidate.path) && !hasExcludedSegment(candidate.path, policy) && !policy.excludedPrefixes.some((prefix) => candidate.path.startsWith(prefix)))) {
    if (!isDocumentationPath(file.path, policy) && !isSpecialDocument(file.path, policy)) violations.push(finding("DOC-UNSCOPED-DOCUMENT", file.path, "add this document to the versioned documentation policy"));
  }
  return sorted(violations);
}

export function evaluateAuthoredSources(snapshot: RepositorySnapshot, policy: RepositoryPolicy = authoredSourcePolicyV1): AnalysisResult {
  const violations: RuleViolation[] = [];
  for (const file of snapshot.files) {
    const path = normalizePath(file.path);
    if (!typeScriptPath.test(path) || isExcludedAuthoredPath(path, policy)) continue;
    if (!isIncludedAuthoredTypeScriptPath(path, policy)) violations.push(finding("ARCH-UNSCOPED-TYPESCRIPT", path, "add this TypeScript path to the authored-source policy"));
    else if (!hasUsefulFileoverview(file.text)) violations.push(finding("ARCH-FILEOVERVIEW", path, "start with a useful JSDoc @fileoverview comment"));
  }
  return sorted(violations);
}
