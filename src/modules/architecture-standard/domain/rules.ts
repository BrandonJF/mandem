/** @fileoverview Pure deterministic Mandem architecture rules. */
import { dirname, normalize } from "node:path";
import { isExcludedAuthoredPath, isIncludedAuthoredTypeScriptPath, isProductionTypeScriptPath } from "./repository-policy";
import type { AnalysisResult, ArchitectureRule, RepositoryFile, RuleViolation } from "./types";

const ruleDescriptions = {
  "ARCH-MODULE-NAME": "module names are lowercase kebab-case", "ARCH-MODULE-DOMAIN": "modules contain domain", "ARCH-MODULE-APPLICATION": "modules contain application", "ARCH-MODULE-INFRASTRUCTURE": "modules contain infrastructure", "ARCH-MODULE-API": "modules contain api", "ARCH-MODULE-README": "modules contain README.md", "ARCH-MODULE-ROOT-BARREL": "modules contain index.ts", "ARCH-DOMAIN-TYPES": "modules contain domain/types.ts", "ARCH-API-COMPOSITION": "modules contain api/composition.ts", "ARCH-MODULE-TESTS": "modules contain tests", "ARCH-MODULE-TEST-FAKES": "modules contain tests/fakes", "ARCH-DOMAIN-DEPENDENCY": "domain imports no outer layer", "ARCH-APPLICATION-DEPENDENCY": "application imports only domain or application", "ARCH-CROSS-MODULE-DEEP-IMPORT": "modules use other module barrels", "ARCH-INFRASTRUCTURE-ROOT-EXPORT": "root barrels do not export infrastructure", "ARCH-IO-PLACEMENT": "IO is limited to infrastructure and composition", "ARCH-FILEOVERVIEW": "TypeScript begins with @fileoverview", "ARCH-NO-EXPLICIT-ANY": "explicit any is forbidden", "ARCH-UNSCOPED-TYPESCRIPT": "TypeScript path is not covered by authored-source policy", "ARCH-DOMAIN-ENTITY-PLACEMENT": "domain entities belong in types.ts", "ARCH-COMPONENT-SIZE": "components are at most 150 physical lines", "ARCH-HOOK-SIZE": "hooks are at most 200 physical lines", "ARCH-COMPONENT-STATE": "components have fewer than five direct useState calls"
} as const;
export const architectureRules: readonly ArchitectureRule[] = Object.entries(ruleDescriptions).map(([id, description]) => ({ id, severity: "error", description }));
const requiredDirectories = [["domain", "ARCH-MODULE-DOMAIN"], ["application", "ARCH-MODULE-APPLICATION"], ["infrastructure", "ARCH-MODULE-INFRASTRUCTURE"], ["api", "ARCH-MODULE-API"], ["tests", "ARCH-MODULE-TESTS"], ["tests/fakes", "ARCH-MODULE-TEST-FAKES"]] as const;
const requiredFiles = [["README.md", "ARCH-MODULE-README"], ["index.ts", "ARCH-MODULE-ROOT-BARREL"], ["domain/types.ts", "ARCH-DOMAIN-TYPES"], ["api/composition.ts", "ARCH-API-COMPOSITION"]] as const;
const importExpression = /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const ioPackages = new Set(["fs", "fs/promises", "child_process", "net", "http", "https", "tls", "dgram", "process", "sqlite", "prisma", "axios", "@octokit/rest"]);
const explicitAnyPattern = new RegExp("\\b" + String.fromCharCode(97, 110, 121) + "\\b");

function violation(ruleId: string, path: string, message = ruleDescriptions[ruleId as keyof typeof ruleDescriptions] ?? "architecture violation"): RuleViolation { return { ruleId, severity: "error", path, message }; }
function moduleNames(files: readonly RepositoryFile[]): string[] { return [...new Set(files.map(({ path }) => path.match(/^src\/modules\/([^/]+)/)?.[1]).filter((name): name is string => name !== undefined))]; }
function specifiers(text: string): string[] { return [...text.matchAll(importExpression)].map((match) => match[1] ?? match[2]).filter((value): value is string => value !== undefined); }
function resolveSpecifier(filePath: string, specifier: string): string | undefined { if (specifier.startsWith("@/")) return `src/${specifier.slice(2)}`; if (!specifier.startsWith(".")) return undefined; return normalize(`${dirname(filePath)}/${specifier}`).replaceAll("\\", "/").replace(/\.(?:ts|tsx|js|jsx)$/, ""); }
function physicalLines(text: string): number { const normalized = text.replaceAll("\r\n", "\n"); return normalized === "" ? 0 : normalized.replace(/\n$/, "").split("\n").length; }
function codeTokens(text: string): string {
  let result = ""; let index = 0;
  while (index < text.length) {
    const current = text[index] ?? ""; const next = text[index + 1] ?? "";
    if (current === "/" && next === "/") { index = text.indexOf("\n", index + 2); if (index < 0) break; result += "\n"; index += 1; continue; }
    if (current === "/" && next === "*") { const end = text.indexOf("*/", index + 2); index = end < 0 ? text.length : end + 2; result += " "; continue; }
    if (current === "\"" || current === "'") { const quote = current; index += 1; while (index < text.length && text[index] !== quote) index += text[index] === "\\" ? 2 : 1; index += 1; result += " "; continue; }
    if (current === "`") { index += 1; while (index < text.length && text[index] !== "`") { if (text[index] === "\\") { index += 2; continue; } if (text[index] === "$" && text[index + 1] === "{") { const start = index + 2; let depth = 1; index = start; while (index < text.length && depth > 0) { if (text[index] === "{") depth += 1; if (text[index] === "}") depth -= 1; index += 1; } result += codeTokens(text.slice(start, index - 1)); continue; } index += 1; } index += 1; result += " "; continue; }
    result += current; index += 1;
  }
  return result;
}
function ioAllowed(path: string, layer: string | undefined): boolean { return layer === "infrastructure" || path.endsWith("/api/composition.ts") || path === "src/cli/main.ts" || path === "src/server/main.ts"; }
function directIo(tokens: string): boolean { return /\b(?:Bun\.(?:file|write|spawn|serve|connect)|process\.(?:cwd|exit|env|stdin)|process\.stdout\.write|fetch\s*\()/.test(tokens); }

export function evaluateArchitecture(files: readonly RepositoryFile[]): AnalysisResult {
  const paths = new Set(files.map(({ path }) => path)); const directories = new Set<string>(); const violations: RuleViolation[] = [];
  for (const path of paths) for (let separator = path.indexOf("/"); separator >= 0; separator = path.indexOf("/", separator + 1)) directories.add(path.slice(0, separator));
  for (const name of moduleNames(files)) {
    const root = `src/modules/${name}`;
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) violations.push(violation("ARCH-MODULE-NAME", root));
    for (const [item, id] of requiredDirectories) if (!directories.has(`${root}/${item}`)) violations.push(violation(id, root));
    for (const [item, id] of requiredFiles) if (!paths.has(`${root}/${item}`)) violations.push(violation(id, root));
    const barrel = files.find((file) => file.path === `${root}/index.ts`);
    if (barrel && specifiers(barrel.text).map((specifier) => resolveSpecifier(barrel.path, specifier)).some((path) => path === `${root}/infrastructure` || path?.startsWith(`${root}/infrastructure/`))) violations.push(violation("ARCH-INFRASTRUCTURE-ROOT-EXPORT", barrel.path));
  }
  for (const file of files.filter(({ path }) => /\.tsx?$/.test(path) && !isExcludedAuthoredPath(path))) {
    const included = isIncludedAuthoredTypeScriptPath(file.path); const tokens = included ? codeTokens(file.text) : "";
    if (included) {
      if (!file.text.startsWith("/** @fileoverview")) violations.push(violation("ARCH-FILEOVERVIEW", file.path));
      if (explicitAnyPattern.test(tokens)) violations.push(violation("ARCH-NO-EXPLICIT-ANY", file.path));
    } else violations.push(violation("ARCH-UNSCOPED-TYPESCRIPT", file.path));
    if (!isProductionTypeScriptPath(file.path)) continue;
    const moduleRoot = file.path.match(/^(src\/modules\/[^/]+)/)?.[1]; const layer = file.path.match(/^src\/modules\/[^/]+\/(domain|application|infrastructure|api)\//)?.[1]; const imports = specifiers(file.text); const allowed = ioAllowed(file.path, layer);
    for (const specifier of imports) {
      const resolved = resolveSpecifier(file.path, specifier); const targetLayer = resolved?.match(/^src\/modules\/[^/]+\/(domain|application|infrastructure|api)(?:\/|$)/)?.[1]; const packageName = specifier.replace(/^node:/, ""); const isIoPackage = ioPackages.has(packageName) || packageName.startsWith("fs/") || packageName === "fetch";
      if (layer === "domain" && ((targetLayer !== undefined && targetLayer !== "domain") || isIoPackage)) violations.push(violation("ARCH-DOMAIN-DEPENDENCY", file.path));
      if (layer === "application" && ((!resolved && !specifier.startsWith("@/")) || (targetLayer !== undefined && targetLayer !== "domain" && targetLayer !== "application"))) violations.push(violation("ARCH-APPLICATION-DEPENDENCY", file.path));
      const targetModule = resolved?.match(/^src\/modules\/([^/]+)/)?.[1];
      if (moduleRoot && targetModule && targetModule !== moduleRoot.slice("src/modules/".length) && resolved !== `src/modules/${targetModule}`) violations.push(violation("ARCH-CROSS-MODULE-DEEP-IMPORT", file.path));
      if (!allowed && isIoPackage) violations.push(violation("ARCH-IO-PLACEMENT", file.path));
    }
    if (!allowed && directIo(tokens)) violations.push(violation("ARCH-IO-PLACEMENT", file.path));
    const lines = physicalLines(file.text); const isBarrel = /\/index\.tsx?$/.test(file.path);
    if (!isBarrel && /\.tsx$/.test(file.path) && lines > 150) violations.push(violation("ARCH-COMPONENT-SIZE", file.path));
    if (!isBarrel && /(?:use|hook)[^/]*\.ts$/i.test(file.path) && lines > 200) violations.push(violation("ARCH-HOOK-SIZE", file.path));
    if (/\.tsx$/.test(file.path) && (file.text.match(/useState\(/g)?.length ?? 0) >= 5) violations.push(violation("ARCH-COMPONENT-STATE", file.path));
    if (layer === "domain" && !file.path.endsWith("domain/types.ts") && /export\s+(?:class|interface)\s+\w*(?:Entity|Aggregate)\b/.test(file.text)) violations.push(violation("ARCH-DOMAIN-ENTITY-PLACEMENT", file.path));
  }
  return { violations: violations.sort((a, b) => a.ruleId.localeCompare(b.ruleId) || a.path.localeCompare(b.path) || a.message.localeCompare(b.message)) };
}
