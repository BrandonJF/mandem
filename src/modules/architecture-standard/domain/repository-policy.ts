/** @fileoverview Authored-source scope policy for architecture analysis. */
const typeScriptPath = /\.(?:ts|tsx)$/;

export function isExcludedAuthoredPath(path: string): boolean {
  return path.endsWith(".d.ts") || path.startsWith("tests/fixtures/");
}

export function isIncludedAuthoredTypeScriptPath(path: string): boolean {
  if (!typeScriptPath.test(path)) return false;
  return path.startsWith("src/") || path.startsWith("scripts/") || path.startsWith("tests/") || /^[^/]+\.config\.tsx?$/.test(path);
}

export function isProductionTypeScriptPath(path: string): boolean {
  return typeScriptPath.test(path) && path.startsWith("src/");
}
