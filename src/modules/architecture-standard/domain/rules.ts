/** @fileoverview Pure deterministic Mandem architecture rules. */
import type { AnalysisResult, RepositoryFile, RuleViolation } from "./types";

const requiredDirectories = [
  ["domain", "ARCH-MODULE-DOMAIN"], ["application", "ARCH-MODULE-APPLICATION"],
  ["infrastructure", "ARCH-MODULE-INFRASTRUCTURE"], ["api", "ARCH-MODULE-API"],
  ["tests", "ARCH-MODULE-TESTS"], ["tests/fakes", "ARCH-MODULE-TEST-FAKES"]
] as const;
const requiredFiles = [["README.md", "ARCH-MODULE-README"], ["index.ts", "ARCH-MODULE-ROOT-BARREL"], ["domain/types.ts", "ARCH-DOMAIN-TYPES"], ["api/composition.ts", "ARCH-API-COMPOSITION"]] as const;
const ioPattern = /from\s+["'](?:node:)?(?:fs|child_process|net|http|https|process|sqlite|prisma|axios|fetch)["']/;

function violation(ruleId: string, path: string, message: string): RuleViolation {
  return { ruleId, severity: "error", path, message };
}

function moduleNames(files: readonly RepositoryFile[]): string[] {
  return [...new Set(files.map(({ path }) => path.match(/^src\/modules\/([^/]+)/)?.[1]).filter((name): name is string => name !== undefined))];
}

export function evaluateArchitecture(files: readonly RepositoryFile[]): AnalysisResult {
  const paths = new Set(files.map(({ path }) => path));
  const violations: RuleViolation[] = [];
  for (const name of moduleNames(files)) {
    const root = `src/modules/${name}`;
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) violations.push(violation("ARCH-MODULE-NAME", root, "module name must be lowercase kebab-case"));
    for (const [item, id] of requiredDirectories) if (![...paths].some((path) => path.startsWith(`${root}/${item}/`))) violations.push(violation(id, root, `module must contain ${item}/`));
    for (const [item, id] of requiredFiles) if (!paths.has(`${root}/${item}`)) violations.push(violation(id, root, `module must contain ${item}`));
    const barrel = files.find((file) => file.path === `${root}/index.ts`);
    if (barrel?.text.match(/export[^;]*["']\.\/infrastructure/)) violations.push(violation("ARCH-INFRASTRUCTURE-ROOT-EXPORT", barrel.path, "root barrel must not export infrastructure"));
  }
  for (const file of files.filter(({ path }) => path.startsWith("src/") && /\.tsx?$/.test(path))) {
    const layer = file.path.match(/^src\/modules\/[^/]+\/(domain|application|infrastructure|api)\//)?.[1];
    if (!file.text.startsWith("/** @fileoverview")) violations.push(violation("ARCH-FILEOVERVIEW", file.path, "TypeScript source must begin with an @fileoverview comment"));
    if (/\bany\b/.test(file.text)) violations.push(violation("ARCH-NO-EXPLICIT-ANY", file.path, "explicit any is forbidden"));
    if (layer === "domain" && /from\s+["'][^"']*(?:application|infrastructure|\/api)[^"']*["']/.test(file.text)) violations.push(violation("ARCH-DOMAIN-DEPENDENCY", file.path, "domain may not import outer layers"));
    if (layer === "application" && /from\s+["'][^"']*(?:infrastructure|\/api)[^"']*["']/.test(file.text)) violations.push(violation("ARCH-APPLICATION-DEPENDENCY", file.path, "application may import only domain and ports"));
    if (layer && layer !== "infrastructure" && layer !== "api" && ioPattern.test(file.text)) violations.push(violation("ARCH-IO-PLACEMENT", file.path, "IO imports belong in infrastructure or composition"));
    const target = file.text.match(/from\s+["']@\/modules\/([^/]+)\/(.+)["']/);
    if (target) violations.push(violation("ARCH-CROSS-MODULE-DEEP-IMPORT", file.path, "cross-module imports must use the module barrel"));
    const lines = file.text.replace(/\r\n/g, "\n").split("\n").length;
    const isBarrel = /\/index\.tsx?$/.test(file.path);
    if (!isBarrel && /\.(?:tsx)$/.test(file.path) && lines > 150) violations.push(violation("ARCH-COMPONENT-SIZE", file.path, "component must not exceed 150 lines"));
    if (!isBarrel && /(?:use|hook)[^/]*\.ts$/i.test(file.path) && lines > 200) violations.push(violation("ARCH-HOOK-SIZE", file.path, "hook must not exceed 200 lines"));
    if (/\.tsx$/.test(file.path) && (file.text.match(/useState\(/g)?.length ?? 0) >= 5) violations.push(violation("ARCH-COMPONENT-STATE", file.path, "component must use fewer than five direct useState calls"));
    if (layer === "domain" && !file.path.endsWith("domain/types.ts") && /export\s+(?:class|interface)\s+\w*(?:Entity|Aggregate)\b/.test(file.text)) violations.push(violation("ARCH-DOMAIN-ENTITY-PLACEMENT", file.path, "exported domain entities belong in domain/types.ts"));
  }
  return { violations: violations.sort((a, b) => a.ruleId.localeCompare(b.ruleId) || a.path.localeCompare(b.path) || a.message.localeCompare(b.message)) };
}
