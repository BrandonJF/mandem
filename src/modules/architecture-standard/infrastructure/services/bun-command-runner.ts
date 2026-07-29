/** @fileoverview Bun process adapter for application command execution. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { CommandRunner } from "../../application/use-cases/check-authored-path";

const execute = promisify(execFile);

export class BunCommandRunner implements CommandRunner {
  async run(command: readonly string[], cwd: string): Promise<{ readonly exitCode: number; readonly output: string }> {
    const [program, ...arguments_] = command;
    if (!program) throw new Error("command cannot be empty");
    try {
      const result = await execute(program, arguments_, { cwd, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
      return { exitCode: 0, output: `${result.stdout}${result.stderr}` };
    } catch (error: unknown) {
      const result = error as { code?: number; stdout?: string; stderr?: string };
      return { exitCode: typeof result.code === "number" ? result.code : 2, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
    }
  }
}
