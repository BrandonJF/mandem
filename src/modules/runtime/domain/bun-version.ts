/** @fileoverview Pure Bun runtime-version policy. */
const requiredBunVersion = "1.3.14";
export function assertBunVersion(version: string): void {
  if (version !== requiredBunVersion) throw new Error(`Mandem requires Bun ${requiredBunVersion}; install it before running repository checks.`);
}
