/** @fileoverview Run workflow-equivalent local checks for one exact pull request head. */
import { reportLocalQuality } from "@/modules/architecture-standard";
const [pr, sha, ...extra] = Bun.argv.slice(2);
try {
  if (!pr || !sha || extra.length) throw new Error("Usage: bun run ci:local -- <PR> <full-head-SHA>");
  const result = await reportLocalQuality({ pr: Number(pr), sha });
  console.log(JSON.stringify(result));
  if (result.state !== "success") process.exitCode = 1;
} catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
