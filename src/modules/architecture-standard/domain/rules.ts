/** @fileoverview Pure deterministic Mandem architecture rules. */
import { dirname, normalize } from "node:path";
import type { AnalysisResult, ArchitectureRule, RepositoryFile, RuleViolation } from "./types";

const ruleDescriptions = {
  "ARCH-MODULE-NAME": "module names are lowercase kebab-case", "ARCH-MODULE-DOMAIN": "modules contain domain", "ARCH-MODULE-APPLICATION": "modules contain application", "ARCH-MODULE-INFRASTRUCTURE": "modules contain infrastructure", "ARCH-MODULE-API": "modules contain api", "ARCH-MODULE-README": "modules contain README.md", "ARCH-MODULE-ROOT-BARREL": "modules contain index.ts", "ARCH-DOMAIN-TYPES": "modules contain domain/types.ts", "ARCH-API-COMPOSITION": "modules contain api/composition.ts", "ARCH-MODULE-TESTS": "modules contain tests", "ARCH-MODULE-TEST-FAKES": "modules contain tests/fakes", "ARCH-DOMAIN-DEPENDENCY": "domain imports no outer layer", "ARCH-APPLICATION-DEPENDENCY": "application imports only domain or application", "ARCH-CROSS-MODULE-DEEP-IMPORT": "modules use other module barrels", "ARCH-INFRASTRUCTURE-ROOT-EXPORT": "root barrels do not export infrastructure", "ARCH-IO-PLACEMENT": "IO is limited to infrastructure and composition", "ARCH-FILEOVERVIEW": "TypeScript begins with @fileoverview", "ARCH-NO-EXPLICIT-ANY": "explicit any is forbidden", "ARCH-DOMAIN-ENTITY-PLACEMENT": "domain entities belong in types.ts", "ARCH-COMPONENT-SIZE": "components are at most 150 physical lines", "ARCH-HOOK-SIZE": "hooks are at most 200 physical lines", "ARCH-COMPONENT-STATE": "components have fewer than five direct useState calls"
} as const;
export const architectureRules: readonly ArchitectureRule[] = Object.entries(ruleDescriptions).map(([id, description]) => ({ id, severity: "error", description }));
const requiredDirectories = [["domain", "ARCH-MODULE-DOMAIN"], ["application", "ARCH-MODULE-APPLICATION"], ["infrastructure", "ARCH-MODULE-INFRASTRUCTURE"], ["api", "ARCH-MODULE-API"], ["tests", "ARCH-MODULE-TESTS"], ["tests/fakes", "ARCH-MODULE-TEST-FAKES"]] as const;
const requiredFiles = [["README.md", "ARCH-MODULE-README"], ["index.ts", "ARCH-MODULE-ROOT-BARREL"], ["domain/types.ts", "ARCH-DOMAIN-TYPES"], ["api/composition.ts", "ARCH-API-COMPOSITION"]] as const;
const importExpression = /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const ioPackages = new Set(["fs", "fs/promises", "child_process", "net", "http", "https", "tls", "dgram", "process", "sqlite", "prisma", "axios"]);
const explicitAnyPattern = new RegExp("\\b" + String.fromCharCode(97, 110, 121) + "\\b");

function violation(ruleId: string, path: string, message = ruleDescriptions[ruleId as keyof typeof ruleDescriptions] ?? "architecture violation"): RuleViolation { return { ruleId, severity: "error", path, message }; }
function moduleNames(files: readonly RepositoryFile[]): string[] { return [...new Set(files.map(({ path }) => path.match(/^src\/modules\/([^/]+)/)?.[1]).filter((name): name is string => name !== undefined))]; }
function specifiers(text: string): string[] { return [...text.matchAll(importExpression)].map((match) => match[1] ?? match[2]).filter((value): value is string => value !== undefined); }
function resolveSpecifier(filePath: string, specifier: string): string | undefined {
  if (specifier.startsWith("@/")) return `src/${specifier.slice(2)}`;
  if (!specifier.startsWith(".")) return undefined;
  return normalize(`${dirname(filePath)}/${specifier}`).replaceAll("\\", "/").replace(/\.(?:ts|tsx|js|jsx)$/, "");
}
function physicalLines(text: string): number { const normalized = text.replaceAll("\r\n", "\n"); return normalized === "" ? 0 : normalized.replace(/\n$/, "").split("\n").length; }
function typeTokens(text: string): string { return text.replace(/\/\*[\s\S]*?\*\/|\/\/.*|(?:"(?:\\.|[^"\\])*")|(?:'(?:\\.|[^'\\])*')|(?:`(?:\\.|[^`\\])*`)/g, " "); }

export function evaluateArchitecture(files: readonly RepositoryFile[]): AnalysisResult {
  const paths = new Set(files.map(({ path }) => path)); const violations: RuleViolation[] = [];
  for (const name of moduleNames(files)) {
    const root = `src/modules/${name}`;
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) violations.push(violation("ARCH-MODULE-NAME", root));
    for (const [item, id] of requiredDirectories) if (![...paths].some((path) => path.startsWith(`${root}/${item}/`))) violations.push(violation(id, root));
    for (const [item, id] of requiredFiles) if (!paths.has(`${root}/${item}`)) violations.push(violation(id, root));
    const barrel = files.find((file) => file.path === `${root}/index.ts`);
    if (barrel && specifiers(barrel.text).some((specifier) => specifier === "./infrastructure" || specifier.startsWith("./infrastructure/"))) violations.push(violation("ARCH-INFRASTRUCTURE-ROOT-EXPORT", barrel.path));
  }
  for (const file of files.filter(({ path }) => path.startsWith("src/") && /\.tsx?$/.test(path))) {
    const moduleRoot = file.path.match(/^(src\/modules\/[^/]+)/)?.[1]; const layer = file.path.match(/^src\/modules\/[^/]+\/(domain|application|infrastructure|api)\//)?.[1]; const imports = specifiers(file.text);
    if (!file.text.startsWith("/** @fileoverview")) violations.push(violation("ARCH-FILEOVERVIEW", file.path));
    if (explicitAnyPattern.test(typeTokens(file.text))) violations.push(violation("ARCH-NO-EXPLICIT-ANY", file.path));
    for (const specifier of imports) {
      const resolved = resolveSpecifier(file.path, specifier); const targetLayer = resolved?.match(/^src\/modules\/[^/]+\/(domain|application|infrastructure|api)(?:\/|$)/)?.[1];
      if (layer === "domain" && targetLayer && targetLayer !== "domain") violations.push(violation("ARCH-DOMAIN-DEPENDENCY", file.path));
      if (layer === "application" && ((!resolved && !specifier.startsWith("@/")) || (targetLayer !== undefined && targetLayer !== "domain" && targetLayer !== "application"))) violations.push(violation("ARCH-APPLICATION-DEPENDENCY", file.path));
      const targetModule = resolved?.match(/^src\/modules\/([^/]+)/)?.[1];
      if (moduleRoot && targetModule && targetModule !== moduleRoot.slice("src/modules/".length) && resolved !== `src/modules/${targetModule}`) violations.push(violation("ARCH-CROSS-MODULE-DEEP-IMPORT", file.path));
      const packageName = specifier.replace(/^node:/, "");
      const ioAllowed = layer === "infrastructure" || file.path.endsWith("/api/composition.ts") || file.path === "src/cli/main.ts" || file.path === "src/server/main.ts";
      if (!ioAllowed && (ioPackages.has(packageName) || packageName.startsWith("fs/") || packageName === "fetch")) violations.push(violation("ARCH-IO-PLACEMENT", file.path));
    }
    const directIoAllowed = layer === "infrastructure" || file.path.endsWith("/api/composition.ts") || file.path === "src/cli/main.ts" || file.path === "src/server/main.ts";
    if (!directIoAllowed && /\b(?:Bun\.(?:file|write|spawn|serve)|process\.(?:cwd|exit|env)|fetch\s*\()/.test(file.text)) violations.push(violation("ARCH-IO-PLACEMENT", file.path));
    const lines = physicalLines(file.text); const isBarrel = /\/index\.tsx?$/.test(file.path);
    if (!isBarrel && /\.tsx$/.test(file.path) && lines > 150) violations.push(violation("ARCH-COMPONENT-SIZE", file.path));
    if (!isBarrel && /(?:use|hook)[^/]*\.ts$/i.test(file.path) && lines > 200) violations.push(violation("ARCH-HOOK-SIZE", file.path));
    if (/\.tsx$/.test(file.path) && (file.text.match(/useState\(/g)?.length ?? 0) >= 5) violations.push(violation("ARCH-COMPONENT-STATE", file.path));
    if (layer === "domain" && !file.path.endsWith("domain/types.ts") && /export\s+(?:class|interface)\s+\w*(?:Entity|Aggregate)\b/.test(file.text)) violations.push(violation("ARCH-DOMAIN-ENTITY-PLACEMENT", file.path));
  }
  return { violations: violations.sort((a, b) => a.ruleId.localeCompare(b.ruleId) || a.path.localeCompare(b.path) || a.message.localeCompare(b.message)) };
}
