/**
 * @fileoverview Unit tests for `session-store.ts` (issue #2114 — the live-session
 * registry). Mirrors `id-counter-store.ts`'s port+fake testing posture.
 *
 * The load-bearing case is the anti-growth proof: re-registering the SAME `session` id
 * many times must leave exactly one record — the unbounded-append growth the message-bus
 * review flagged as Finding L1 (`__sessions__` growing a new row per re-register) must be
 * impossible by construction here.
 */

import { describe, expect, it } from "vitest";
import { createInMemorySessionStore } from "../application/ports/session-store";

const RE_REGISTER_COUNT = 100;

describe("createInMemorySessionStore", () => {
  it("register then list round-trips a single session", async () => {
    const store = createInMemorySessionStore();

    await store.register({ session: "engineer-foo", role: "engineer" });
    const sessions = await store.list();

    expect(sessions).toEqual([
      expect.objectContaining({ session: "engineer-foo", role: "engineer" }),
    ]);
  });

  it("fills `ts` when absent", async () => {
    const store = createInMemorySessionStore();

    const stored = await store.register({ session: "orch-b", role: "orchestrator" });

    expect(typeof stored.ts).toBe("string");
    expect(Number.isNaN(Date.parse(stored.ts))).toBe(false);
  });

  it("preserves an explicitly-provided `ts` and `data`", async () => {
    const store = createInMemorySessionStore();

    const stored = await store.register({
      session: "orch-b",
      role: "orchestrator",
      ts: "2026-01-01T00:00:00.000Z",
      data: { worktree: "/tmp/x" },
    });

    expect(stored.ts).toBe("2026-01-01T00:00:00.000Z");
    expect(stored.data).toEqual({ worktree: "/tmp/x" });
  });

  it("get returns the record for a registered session, or undefined otherwise", async () => {
    const store = createInMemorySessionStore();
    await store.register({ session: "engineer-foo", role: "engineer" });

    expect(await store.get("engineer-foo")).toEqual(
      expect.objectContaining({ session: "engineer-foo", role: "engineer" }),
    );
    expect(await store.get("nobody")).toBeUndefined();
  });

  it("list returns all distinct sessions", async () => {
    const store = createInMemorySessionStore();
    await store.register({ session: "a", role: "engineer" });
    await store.register({ session: "b", role: "researcher" });

    const sessions = await store.list();
    expect(sessions.map((s) => s.session).sort()).toEqual(["a", "b"]);
  });

  // ── The L1 anti-growth proof ─────────────────────────────────────────────────

  it(`re-registering the same session id ${RE_REGISTER_COUNT} times leaves exactly ONE record`, async () => {
    const store = createInMemorySessionStore();

    for (let i = 0; i < RE_REGISTER_COUNT; i++) {
      await store.register({
        session: "engineer-foo",
        role: "engineer",
        data: { attempt: i },
      });
    }

    const sessions = await store.list();
    const matching = sessions.filter((s) => s.session === "engineer-foo");
    expect(matching).toHaveLength(1);
    expect(matching[0]!.data).toEqual({ attempt: RE_REGISTER_COUNT - 1 });
  });
});
