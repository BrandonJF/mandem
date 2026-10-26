/** @fileoverview Operator-configured consumer command adapter; requests never choose executables or templates. */
import { readFileSync } from "node:fs";
import { createConsumerCommand } from "./consumer-command";
import type { ReviewEffects } from "../application/ports/review-effects";
import {
  parseReviewPolicy,
  parseReviewerSession,
} from "../domain/review-values";
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
/** Load a trusted operator file once; the effect command consumes one versioned JSON document on stdin. */
export function loadReviewConfiguration(path: string) {
  const input: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (
    !record(input) ||
    input.version !== 1 ||
    !Array.isArray(input.command) ||
    input.command.some(
      (part: unknown) => typeof part !== "string" || !part.trim(),
    )
  )
    throw new Error("Invalid review consumer configuration");
  const command: string[] = input.command.map((part: unknown) => {
    if (typeof part !== "string") throw new Error("Invalid consumer argument");
    return part;
  });
  const policy = parseReviewPolicy(input.templates);
  const invoke = createConsumerCommand(command);
  const effects: ReviewEffects = {
    async launch(task) {
      return parseReviewerSession(await invoke({ kind: "launch", task }));
    },
    async readiness(action) {
      const value = await invoke(action);
      if (!record(value) || value.ok !== true)
        throw new Error(
          "Consumer did not confirm readiness; inspect before recovery",
        );
    },
    async findings(action) {
      const value = await invoke(action);
      if (!record(value) || value.ok !== true)
        throw new Error(
          "Consumer did not confirm findings delivery; inspect before recovery",
        );
    },
  };
  return { policy, effects };
}
