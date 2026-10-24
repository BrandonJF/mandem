/** @fileoverview Herdr pane operations scoped to Mandem labels in one workspace. */
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { parseLiveAgent } from "../domain/stream-values";
import type { LiveAgent } from "../domain/streams";
import type { PaneQueueIo } from "../application/ports/pane-queue";

interface HerdrOptions {
  parentPaneId: string;
  workspaceId: string;
  run?: (args: string[]) => unknown;
  runAsync?: (args: string[]) => Promise<unknown>;
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
const execFileAsync = promisify(execFile);
async function runHerdrAsync(args: string[]): Promise<unknown> {
  if (process.env.HERDR_ENV !== "1") throw new Error("Herdr requires a managed pane (HERDR_ENV=1)");
  const { stdout } = await execFileAsync("herdr", args, { encoding: "utf8", timeout: 10_000 });
  return JSON.parse(stdout);
}

export function createHerdrPaneIo(options: HerdrOptions): PaneQueueIo & {
  wake(paneId: string, topic: string, id: string): Promise<void>;
  readMapAsync(): Promise<Record<string, string>>;
  readActivity(): Promise<LiveAgent[]>;
} {
  const run = options.run ?? runHerdr;
  const runAsync = options.runAsync ?? (options.run ? async (args: string[]) => options.run!(args) : runHerdrAsync);
  const prefix = "mandem:";
  function paneMap(value: unknown): Record<string, string> {
    const response = result(value);
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
  function readMap(): Record<string, string> {
    return paneMap(run(["pane", "list", "--workspace", options.workspaceId]));
  }
  return {
    readMap,
    async readMapAsync() {
      return paneMap(await runAsync(["pane", "list", "--workspace", options.workspaceId]));
    },
    async readActivity() {
      const response = result(await runAsync(["agent", "list"]));
      if (!Array.isArray(response.agents)) throw new Error("Invalid Herdr agent list");
      const map = await this.readMapAsync();
      return response.agents.filter(agent => record(agent) && agent.workspace_id === options.workspaceId).map(agent => {
        if (!record(agent) || typeof agent.pane_id !== "string" || typeof agent.agent_status !== "string") throw new Error("Invalid Herdr agent activity");
        const label = Object.keys(map).find(session => map[session] === agent.pane_id);
        return parseLiveAgent({ paneId: agent.pane_id, state: agent.agent_status, ...(label ? { name: label } : agent.name !== undefined ? { name: agent.name } : {}) });
      });
    },
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
      await runAsync(["agent", "prompt", paneId, `Mandem message ${id} is waiting on ${topic}. Read and acknowledge it through mandem msg inbox/ack.`]);
    },
  };
}
