#!/usr/bin/env bun
/** @fileoverview Reports the review choices permitted by a plan's failure history. */

import { allowedReviewChoices } from "../src/modules/architecture-standard";

function readCount(flag: string): number {
  const index = Bun.argv.indexOf(flag);
  const raw = index < 0 ? undefined : Bun.argv[index + 1];
  if (raw === undefined || !/^\d+$/u.test(raw)) {
    throw new Error(`${flag} requires a non-negative integer`);
  }
  return Number(raw);
}

try {
  const choices = allowedReviewChoices({
    failedVerdicts: readCount("--failed-verdicts"),
    permitsUsed: readCount("--permits-used"),
  });
  console.log(choices.join("\n"));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
