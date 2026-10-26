/** @fileoverview Fixed consumer-command transport with bounded JSON and visible uncertainty. */
import { spawn } from "node:child_process";
export function createConsumerCommand(command: string[]) {
  if (!command.length || command.some(part => typeof part !== "string" || !part.trim())) throw new Error("Invalid consumer command");
  const [executable, ...args] = command;
  if (!executable) throw new Error("Consumer command is empty");
  const program: string = executable;
  return async function invoke(action: unknown): Promise<unknown> {
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
  };
}
