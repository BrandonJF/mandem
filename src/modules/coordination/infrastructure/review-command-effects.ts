/** @fileoverview Operator-configured consumer command adapter; requests never choose executables or templates. */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import type { ReviewEffects } from "../application/ports/review-effects";
import type { ReviewAction } from "../domain/reviews";
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
  const [executable, ...args] = command;
  if (!executable) throw new Error("Review consumer command is empty");
  const program: string = executable;
  const policy = parseReviewPolicy(input.templates);
  async function invoke(action: ReviewAction): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const child = spawn(program, args, { stdio: ["pipe", "pipe", "ignore"] });
      let output = "";
      let timedOut = false;
      let oversized = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, 90_000);
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        output += chunk;
        if (output.length > 64 * 1024) {
          oversized = true;
          child.kill("SIGKILL");
        }
      });
      child.on("error", () => {
        clearTimeout(timeout);
        reject(
          new Error(
            "Consumer command could not start; inspect the reserved effect",
          ),
        );
      });
      child.stdin.on("error", () => {
        /* Close/error below retains the uncertain outcome. */
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (timedOut || oversized || code !== 0) {
          reject(
            new Error(
              `Consumer command ${timedOut ? "timed out" : oversized ? "exceeded output limit" : `exited ${code}`}; inspect before recovery`,
            ),
          );
          return;
        }
        try {
          const result: unknown = JSON.parse(output);
          resolve(result);
        } catch {
          reject(
            new Error(
              "Consumer returned invalid JSON; inspect before recovery",
            ),
          );
        }
      });
      child.stdin.end(JSON.stringify({ version: 1, action }));
    });
  }
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
