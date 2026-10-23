/** @fileoverview Herdr pane operations scoped to Mandem labels in one workspace. */
import { execFileSync } from "node:child_process";
import type { PaneQueueIo } from "../application/ports/pane-queue";

interface HerdrOptions {
  parentPaneId: string;
  workspaceId: string;
  run?: (args: string[]) => unknown;
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function result(value: unknown): Record<string, unknown> {
  if (!record(value) || !record(value.result)) throw new Error("Invalid Herdr response");
  return value.result;
}
function runHerdr(args: string[]): unknown {
  if (process.env.HERDR_ENV !== "1") throw new Error("Herdr requires a managed pane (HERDR_ENV=1)");
  return JSON.parse(execFileSync("herdr", args, { encoding: "utf8", timeout: 10_000 }));
}

export function createHerdrPaneIo(options: HerdrOptions): PaneQueueIo & {
  wake(paneId: string, topic: string, id: string): Promise<void>;
} {
  const run = options.run ?? runHerdr;
  const prefix = "mandem:";
  function readMap(): Record<string, string> {
    const response = result(run(["pane", "list", "--workspace", options.workspaceId]));
    if (!Array.isArray(response.panes)) throw new Error("Invalid Herdr pane list");
    const map: Record<string, string> = Object.create(null);
    for (const pane of response.panes) {
      if (!record(pane) || typeof pane.pane_id !== "string") throw new Error("Invalid Herdr pane record");
      if (typeof pane.label === "string" && pane.label.startsWith(prefix)) {
        const label = pane.label.slice(prefix.length);
        if (map[label]) throw new Error(`Duplicate Herdr pane label: ${label}`);
        map[label] = pane.pane_id;
      }
    }
    return map;
  }
  return {
    readMap,
    async launchPane(request) {
      const existing = readMap()[request.label];
      if (existing && !request.fresh) return existing;
      if (existing) run(["pane", "close", existing]);
      const args = ["pane", "split", options.parentPaneId, "--direction", "down"];
      if (request.cwd) args.push("--cwd", request.cwd);
      args.push("--no-focus");
      const split = result(run(args));
      if (!record(split.pane) || typeof split.pane.pane_id !== "string") throw new Error("Invalid Herdr split response");
      const id = split.pane.pane_id;
      try {
        run(["pane", "rename", id, prefix + request.label]);
        run(["pane", "run", id, request.command]);
      } catch (error) {
        try { run(["pane", "close", id]); } catch (cleanupError) { console.error("mandem: Herdr launch cleanup failed", cleanupError); }
        throw error;
      }
      return id;
    },
    async killPane(label) {
      const id = readMap()[label];
      if (id) run(["pane", "close", id]);
    },
    async wake(paneId, topic, id) {
      run(["agent", "prompt", paneId, `Mandem message ${id} is waiting on ${topic}. Read and acknowledge it through mandem msg inbox/ack.`]);
    },
  };
}
