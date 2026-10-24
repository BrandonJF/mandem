/** @fileoverview HTTP/CLI review dispatch through a real subprocess consumer adapter, without providers. */
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { startCoordinationServer } from "../api/composition";
import { parseReviewState } from "../domain/review-values";
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "review-runtime-"));
  roots.push(root);
  return root;
}
test("stays disabled until the operator configures consumer adapters", async () => {
  const server = startCoordinationServer({
    databasePath: join(fixture(), "db.sqlite"),
    port: 0,
    herdr: false,
  });
  try {
    expect(
      (
        await fetch(server.url + "/reviews/events", {
          method: "POST",
          body: "{}",
        })
      ).status,
    ).toBe(503);
  } finally {
    await server.stop();
  }
});
test("wires full review, retarget wait/reuse, delta and findings through the configured command and CLI", async () => {
  const root = fixture();
  const log = join(root, "effects.jsonl");
  const adapter = join(root, "consumer.ts");
  writeFileSync(
    adapter,
    `import {appendFileSync,existsSync,readFileSync} from 'node:fs';
const message=JSON.parse(await Bun.stdin.text());
const count=existsSync(${JSON.stringify(log)})?readFileSync(${JSON.stringify(log)},'utf8').trim().split('\\n').length:0;
appendFileSync(${JSON.stringify(log)},JSON.stringify(message)+'\\n');
console.log(JSON.stringify(message.action.kind==='launch'?{session:'reviewer-'+(count+1)}:{ok:true}));`,
  );
  const config = join(root, "review-config.json");
  writeFileSync(
    config,
    JSON.stringify({
      version: 1,
      templates: {
        full: { name: "full-review", revision: "v1" },
        delta: { name: "delta-review", revision: "v1" },
      },
      command: ["bun", adapter],
    }),
  );
  const server = startCoordinationServer({
    databasePath: join(root, "db.sqlite"),
    port: 0,
    herdr: false,
    reviewConfigPath: config,
  });
  const ref = { repository: "team/runtime", number: 9 };
  const artifact = { reference: "/patch", sha256: "a".repeat(64) };
  const input = {
    ref,
    head: "1".repeat(40),
    base: { name: "stack", sha: "2".repeat(40) },
    patch: { id: "3".repeat(40), artifact },
    authorSession: "author",
    eligibility: { kind: "eligible" },
    mergeRef: null,
    activeReviewHeads: [],
    delta: null,
  };
  async function submit(event: unknown) {
    const process = Bun.spawn(
      [
        "bun",
        "run",
        "src/cli/main.ts",
        "review",
        "event",
        "--data",
        JSON.stringify({ version: 1, ref, event }),
      ],
      {
        cwd: resolve(import.meta.dir, "../../../.."),
        env: { ...Bun.env, MANDEM_COORD_URL: server.url },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const output = await new Response(process.stdout).text();
    const error = await new Response(process.stderr).text();
    expect(await process.exited).toBe(0);
    if (error) throw new Error(error);
    return parseReviewState(JSON.parse(output));
  }
  try {
    let state = await submit({ kind: "observe", observation: input });
    const full = state.runs[0];
    if (!full || full.phase.kind !== "running")
      throw new Error("Full reviewer not running");
    await submit({ kind: "observe", observation: input });
    state = await submit({
      kind: "result",
      runId: full.task.id,
      session: full.phase.session.session,
      result: { verdict: "CLEAN", artifact },
    });
    expect(state.status.kind).toBe("waiting-for-merge-ref");
    const retarget = {
      ...input,
      base: { name: "main", sha: "5".repeat(40) },
      mergeRef: { sha: "6".repeat(40), parents: [input.base.sha, input.head] },
    };
    expect(
      (await submit({ kind: "observe", observation: retarget })).status.kind,
    ).toBe("waiting-for-merge-ref");
    const fresh = {
      ...retarget,
      mergeRef: {
        sha: "7".repeat(40),
        parents: [retarget.base.sha, retarget.head],
      },
    };
    expect(
      (await submit({ kind: "observe", observation: fresh })).status.kind,
    ).toBe("complete");
    const changed = {
      ...fresh,
      patch: {
        id: "8".repeat(40),
        artifact: { ...artifact, reference: "/new-patch" },
      },
      delta: {
        fromPatchId: input.patch.id,
        artifact: { ...artifact, reference: "/only-delta" },
      },
    };
    state = await submit({ kind: "observe", observation: changed });
    const delta = state.runs[1];
    if (!delta || delta.phase.kind !== "running")
      throw new Error("Delta reviewer not running");
    expect(delta.task.mode.kind).toBe("delta");
    expect(
      (
        await submit({
          kind: "result",
          runId: delta.task.id,
          session: delta.phase.session.session,
          result: {
            verdict: "FIX-NOW",
            artifact,
            findings: "Resolve the reconciliation delta",
          },
        })
      ).status.kind,
    ).toBe("complete");
    const rows = readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map((line: string): unknown => JSON.parse(line));
    expect(rows).toHaveLength(4);
    expect(rows).toMatchObject([
      { action: { kind: "launch" } },
      { action: { kind: "readiness" } },
      { action: { kind: "launch" } },
      { action: { kind: "findings" } },
    ]);
    expect(rows[1]).toMatchObject({
      action: { target: { base: { sha: retarget.base.sha } } },
    });
    expect(rows[2]).toMatchObject({
      action: { task: { mode: { artifact: { reference: "/only-delta" } } } },
    });
    expect(rows[3]).toMatchObject({ action: { recipient: "author" } });
    expect((await fetch(server.url + "/reviews")).status).toBe(200);
  } finally {
    await server.stop();
  }
});
