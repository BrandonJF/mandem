/** @fileoverview Rejects deprecated issue hierarchy vocabulary and validates narrow exceptions. */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const prohibited = /\b(program-level|program (?:ExecPlan|issue|graph|plan|orchestrator|membership|unit)|master[ -](?:program|plan)|master (?:requirements?|acceptance|lifecycle|epic|r\d+|ktd\d+)|work[ -]item|child (?:ExecPlan|plan|scaffold|issue|item|registry)|corrective (?:item|work)|support (?:item|issue|incident)|implementation units|unit (?:(?:issue|plan|scaffold|hierarchy|key)))\b/giu;
const directive = /^<!-- vocabulary-check: allow-next-line reason="([^"]*)" -->$/u;

async function files(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries
    .filter((entry) => ![".git", "node_modules", "dist"].includes(entry.name))
    .map(async (entry) => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]));
  return nested.flat();
}

function vocabularyMatches(line: string): readonly string[] {
  return [...line.matchAll(prohibited)].map((match) => match[0]);
}

export async function checkVocabulary(root: string): Promise<readonly string[]> {
  const findings: string[] = [];
  for (const path of await files(root)) {
    if (!/\.(?:md|ya?ml)$/u.test(path)) continue;
    const displayPath = relative(root, path);
    const lines = (await readFile(path, "utf8")).split("\n");
    let pending: { readonly line: number; readonly reason: string } | undefined;
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      const lineNumber = index + 1;
      const parsedDirective = directive.exec(line);
      if (pending) {
        if (line.trim() === "") {
          findings.push(`${displayPath}:${pending.line}: exception target must not be blank`);
          pending = undefined;
          continue;
        }
        if (line.includes("vocabulary-check:")) {
          findings.push(`${displayPath}:${pending.line}: exception target must not be another directive`);
          pending = undefined;
        } else {
          const matches = vocabularyMatches(line);
          if (matches.length === 0) findings.push(`${displayPath}:${pending.line}: exception is unused`);
          pending = undefined;
          continue;
        }
      }
      if (parsedDirective) {
        const reason = parsedDirective[1] ?? "";
        if ((reason.match(/\S/gu)?.length ?? 0) < 10) {
          findings.push(`${displayPath}:${lineNumber}: exception reason must contain at least 10 non-whitespace characters`);
        } else {
          pending = { line: lineNumber, reason };
        }
        continue;
      }
      if (line.includes("vocabulary-check:")) {
        findings.push(`${displayPath}:${lineNumber}: malformed vocabulary exception`);
        continue;
      }
      for (const match of vocabularyMatches(line)) findings.push(`${displayPath}:${lineNumber}: ${match}`);
    }
    if (pending) findings.push(`${displayPath}:${pending.line}: exception target is missing`);
  }
  return findings.sort();
}

if (import.meta.main) {
  const findings = await checkVocabulary(process.cwd());
  for (const finding of findings) console.error(finding);
  if (findings.length > 0) process.exitCode = 1;
}
