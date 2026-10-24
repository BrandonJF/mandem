/** @fileoverview Herdr adapter contract using a fake command boundary. */
import { describe, expect, it } from "vitest";
import { createHerdrPaneIo } from "../infrastructure/herdr-pane";

function fakeHerdr() {
  const panes = new Map<string, { pane_id: string; label?: string }>([["w1:p1", { pane_id: "w1:p1", label: "user-pane" }]]);
  const calls: string[][] = [];
  let next = 2;
  let failRun = false;
  return {
    calls, panes,
    failNextRun() { failRun = true; },
    run(args: string[]): unknown {
      calls.push(args);
      const [group, command, id, value] = args;
      if(group === "agent" && command === "prompt") return { result: { type: "agent_prompted" } };
      if(command === "list") return { result: { panes: [...panes.values()], type: "pane_list" } };
      if(command === "split") {
        const pane = { pane_id: `w1:p${next++}` };
        panes.set(pane.pane_id, pane);
        return { result: { pane, type: "pane_split" } };
      }
      if(command === "rename") { panes.get(id!)!.label = value; return { result: {} }; }
      if(command === "close") { panes.delete(id!); return { result: {} }; }
      if(command === "run") {
        if(failRun) { failRun = false; throw new Error("shell unavailable"); }
        return { result: {} };
      }
      throw new Error(`Unexpected command ${args}`);
    },
  };
}

describe("Herdr panes", () => {
  it("reuses live labeled panes, refreshes snapshots after restart, and kills only owned panes", async () => {
    const fake = fakeHerdr();
    const io = createHerdrPaneIo({ parentPaneId: "w1:p1", workspaceId: "w1", run: fake.run });
    const request = { window: "agents" as const, label: "engineer", command: "printf ready", cwd: "/tmp/space dir", fresh: false };
    expect(await io.launchPane(request)).toBe("w1:p2");
    expect(await io.launchPane(request)).toBe("w1:p2");
    const restored = createHerdrPaneIo({ parentPaneId: "w1:p1", workspaceId: "w1", run: fake.run });
    expect(restored.readMap()).toEqual({ engineer: "w1:p2" });
    await restored.killPane("user-pane");
    expect(fake.panes.has("w1:p1")).toBe(true);
    expect(await io.launchPane({ ...request, fresh: true })).toBe("w1:p3");
    expect(fake.panes.has("w1:p2")).toBe(false);
    await restored.wake("w1:p3", "session:engineer", "7");
    await restored.killPane("engineer");
    await restored.killPane("engineer");
    expect(restored.readMap()).toEqual({});
    expect(fake.calls).toContainEqual(["pane", "split", "w1:p1", "--direction", "down", "--cwd", "/tmp/space dir", "--no-focus"]);
    expect(fake.calls).toContainEqual(["agent", "prompt", "w1:p3", "Mandem message 7 is waiting on session:engineer. Read and acknowledge it through mandem msg inbox/ack."]);
  });

  it("cleans up a newly split pane when launch fails", async () => {
    const fake = fakeHerdr();
    const io = createHerdrPaneIo({ parentPaneId: "w1:p1", workspaceId: "w1", run: fake.run });
    fake.failNextRun();
    await expect(io.launchPane({ window: "agents", label: "broken", command: "bad", fresh: true })).rejects.toThrow("shell unavailable");
    expect(io.readMap()).toEqual({});
    expect(fake.panes.size).toBe(1);
  });

  it("rejects malformed Herdr responses rather than guessing pane IDs", async () => {
    const io = createHerdrPaneIo({ parentPaneId: "w1:p1", workspaceId: "w1", run: () => ({result:{}}) });
    expect(() => io.readMap()).toThrow("Herdr");
  });
});

it("reads asynchronous activity only in its workspace and resolves owned session labels", async () => {
  const io = createHerdrPaneIo({ parentPaneId: "w1:p1", workspaceId: "w1", runAsync: async args => args[0] === "agent"
    ? { result: { agents: [
      { pane_id: "w1:p2", workspace_id: "w1", name: "provider-name", agent_status: "idle" },
      { pane_id: "w2:p2", workspace_id: "w2", name: "engineer", agent_status: "working" },
    ] } }
    : { result: { panes: [{ pane_id: "w1:p2", label: "mandem:engineer" }] } } });
  expect(await io.readActivity()).toEqual([{ paneId: "w1:p2", name: "engineer", state: { kind: "idle" } }]);
});
