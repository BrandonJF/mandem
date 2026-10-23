/** @fileoverview Imported coordination route behavior tests from Strategy Builder Pro. */
import { describe, expect, it, vi } from 'vitest';
import { createCoordServiceRequestHandler } from '../infrastructure/http-handler';
import { createInMemorySessionStore } from '../application/ports/session-store';
import { createInMemoryMessageStore, createSubscriptions } from '../application/ports/message-store';
import { createInMemoryMergeLockStore } from '../application/ports/merge-lock-store';
import { SSE_HEARTBEAT_COMMENT, SSE_HEARTBEAT_INTERVAL_MS } from '../infrastructure/message-routes';
import type { PaneQueue } from '../application/ports/pane-queue';
describe('coordination routes', () => {
  // ── Pane authority (#2075) — POST /panes/launch, POST /panes/kill, GET /panes ──

  const CONCURRENT_PANE_LAUNCH_COUNT = 20;

  function launchRequest(body: unknown): Request {
    return new Request("http://127.0.0.1:8991/panes/launch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function killRequest(body: unknown): Request {
    return new Request("http://127.0.0.1:8991/panes/kill", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  /** A minimal in-memory Fake `PaneQueue` — no real tmux, no real `.agent-panes.json`. */
  function createFakePaneQueue(): PaneQueue & { map: Record<string, string> } {
    let map: Record<string, string> = {};
    let nextId = 100;
    return {
      get map() {
        return map;
      },
      launch: async (req) => {
        const paneId = `%${nextId++}`;
        map = { ...map, [req.label]: paneId };
        return paneId;
      },
      kill: async (label) => {
        const next = { ...map };
        delete next[label];
        map = next;
      },
      snapshot: () => ({ ...map }),
    };
  }

  describe("POST /panes/launch", () => {
    it("launches a pane and returns { paneId }", async () => {
      const paneQueue = createFakePaneQueue();
      const handler = createCoordServiceRequestHandler(
        { paneQueue },
      );

      const res = await handler(
        launchRequest({ window: "agents", label: "engineer", command: "claude", fresh: true }),
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ paneId: "%100" });
      expect(paneQueue.map["engineer"]).toBe("%100");
    });

    it("500s with 'pane queue not configured' when paneQueue is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(
        launchRequest({ window: "agents", label: "engineer", command: "claude", fresh: true }),
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "pane queue not configured" });
    });

    it("400s when 'label' is missing", async () => {
      const handler = createCoordServiceRequestHandler(
        { paneQueue: createFakePaneQueue() },
      );

      const res = await handler(
        launchRequest({ window: "agents", command: "claude", fresh: true }),
      );
      expect(res.status).toBe(400);
    });

    it("400s when 'window' is missing/invalid", async () => {
      const handler = createCoordServiceRequestHandler(
        { paneQueue: createFakePaneQueue() },
      );

      const res = await handler(
        launchRequest({
          window: "not-a-window",
          label: "engineer",
          command: "claude",
          fresh: true,
        }),
      );
      expect(res.status).toBe(400);
    });

    it("400s when 'command' is missing", async () => {
      const handler = createCoordServiceRequestHandler(
        { paneQueue: createFakePaneQueue() },
      );

      const res = await handler(
        launchRequest({ window: "agents", label: "engineer", fresh: true }),
      );
      expect(res.status).toBe(400);
    });

    it("400s when 'fresh' is missing", async () => {
      const handler = createCoordServiceRequestHandler(
        { paneQueue: createFakePaneQueue() },
      );

      const res = await handler(
        launchRequest({ window: "agents", label: "engineer", command: "claude" }),
      );
      expect(res.status).toBe(400);
    });

    it("400s on invalid JSON", async () => {
      const handler = createCoordServiceRequestHandler(
        { paneQueue: createFakePaneQueue() },
      );

      const res = await handler(
        new Request("http://127.0.0.1:8991/panes/launch", { method: "POST", body: "not json" }),
      );
      expect(res.status).toBe(400);
    });

    it("propagates a paneQueue failure as a 500 with the error message", async () => {
      const paneQueue: PaneQueue = {
        launch: () => Promise.reject(new Error("tmux down")),
        kill: () => Promise.resolve(),
        snapshot: () => ({}),
      };
      const handler = createCoordServiceRequestHandler(
        { paneQueue },
      );

      const res = await handler(
        launchRequest({ window: "agents", label: "engineer", command: "claude", fresh: true }),
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "tmux down" });
    });

    // ── Concurrency invariant, proven at the HTTP transport layer ──────────────
    it(`${CONCURRENT_PANE_LAUNCH_COUNT} concurrent POST /panes/launch calls each get a distinct, non-clobbered entry`, async () => {
      const paneQueue = createFakePaneQueue();
      const handler = createCoordServiceRequestHandler(
        { paneQueue },
      );

      const bodies = Array.from({ length: CONCURRENT_PANE_LAUNCH_COUNT }, (_, i) => ({
        window: "agents",
        label: `agent-${i}`,
        command: "claude",
        fresh: true,
      }));

      const responses = await Promise.all(bodies.map((body) => handler(launchRequest(body))));
      const paneIds = await Promise.all(responses.map(async (res) => (await res.json()).paneId));

      expect(new Set(paneIds).size).toBe(CONCURRENT_PANE_LAUNCH_COUNT);
      expect(Object.keys(paneQueue.map)).toHaveLength(CONCURRENT_PANE_LAUNCH_COUNT);
    });
  });

  describe("POST /panes/kill", () => {
    it("kills a pane and returns { ok: true }", async () => {
      const paneQueue = createFakePaneQueue();
      await paneQueue.launch({
        window: "agents",
        label: "engineer",
        command: "claude",
        fresh: true,
      });
      const handler = createCoordServiceRequestHandler(
        { paneQueue },
      );

      const res = await handler(killRequest({ label: "engineer" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(paneQueue.map["engineer"]).toBeUndefined();
    });

    it("is idempotent — killing an unknown label is still a 200 { ok: true }", async () => {
      const handler = createCoordServiceRequestHandler(
        { paneQueue: createFakePaneQueue() },
      );

      const res = await handler(killRequest({ label: "no-such-label" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    });

    it("500s with 'pane queue not configured' when paneQueue is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(killRequest({ label: "engineer" }));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "pane queue not configured" });
    });

    it("400s when 'label' is missing", async () => {
      const handler = createCoordServiceRequestHandler(
        { paneQueue: createFakePaneQueue() },
      );

      const res = await handler(killRequest({}));
      expect(res.status).toBe(400);
    });
  });

  describe("GET /panes", () => {
    it("returns the queue's current snapshot", async () => {
      const paneQueue = createFakePaneQueue();
      await paneQueue.launch({
        window: "agents",
        label: "engineer",
        command: "claude",
        fresh: true,
      });
      const handler = createCoordServiceRequestHandler(
        { paneQueue },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/panes"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ panes: { engineer: "%100" } });
    });

    it("500s with 'pane queue not configured' when paneQueue is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(new Request("http://127.0.0.1:8991/panes"));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "pane queue not configured" });
    });
  });

  // ── Session registry (#2114) — POST /sessions/register + GET /sessions ─────────

  function registerRequest(body: unknown): Request {
    return new Request("http://127.0.0.1:8991/sessions/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  describe("POST /sessions/register", () => {
    it("upserts and returns 200 { ok: true }", async () => {
      const sessionStore = createInMemorySessionStore();
      const handler = createCoordServiceRequestHandler(
        { sessionStore },
      );

      const res = await handler(registerRequest({ session: "engineer-foo", role: "engineer" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(await sessionStore.get("engineer-foo")).toEqual(
        expect.objectContaining({ session: "engineer-foo", role: "engineer" }),
      );
    });

    it("400s when 'session' is missing", async () => {
      const handler = createCoordServiceRequestHandler(
        { sessionStore: createInMemorySessionStore() },
      );

      const res = await handler(registerRequest({ role: "engineer" }));
      expect(res.status).toBe(400);
    });

    it("400s when 'role' is missing", async () => {
      const handler = createCoordServiceRequestHandler(
        { sessionStore: createInMemorySessionStore() },
      );

      const res = await handler(registerRequest({ session: "engineer-foo" }));
      expect(res.status).toBe(400);
    });

    it("500s with 'session registry not configured' when sessionStore is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(registerRequest({ session: "engineer-foo", role: "engineer" }));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "session registry not configured" });
    });

    it("logs a begin-marker then an end-marker (ADR-0150)", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const handler = createCoordServiceRequestHandler(
        { sessionStore: createInMemorySessionStore() },
      );

      await handler(registerRequest({ session: "engineer-foo", role: "engineer" }));

      const lines = logSpy.mock.calls.map((call) => String(call[0]));
      expect(lines[0]).toBe("coord-service: ▶ POST /sessions/register…");
      expect(lines[1]).toMatch(
        /^coord-service: ✓ POST \/sessions\/register session=engineer-foo \(\d+ms\)$/,
      );
      logSpy.mockRestore();
    });
  });

  describe("GET /sessions", () => {
    it("returns the directory from sessionStore.list()", async () => {
      const sessionStore = createInMemorySessionStore();
      await sessionStore.register({ session: "orch-b", role: "orchestrator" });
      const handler = createCoordServiceRequestHandler(
        { sessionStore },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/sessions"));

      expect(res.status).toBe(200);
      const body = (await res.json()) as { sessions: Array<{ session: string }> };
      expect(body.sessions).toEqual([
        expect.objectContaining({ session: "orch-b", role: "orchestrator" }),
      ]);
    });

    it("500s with 'session registry not configured' when sessionStore is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(new Request("http://127.0.0.1:8991/sessions"));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "session registry not configured" });
    });

    // ── Advisory pane join (co-design with #2075) ─────────────────────────────

    it("enriches a tracked session with its live pane binding when paneReader is configured", async () => {
      const sessionStore = createInMemorySessionStore();
      await sessionStore.register({ session: "engineer-foo", role: "engineer" });
      await sessionStore.register({ session: "orch-b", role: "orchestrator" });
      const handler = createCoordServiceRequestHandler(
        { sessionStore, paneReader: () => ({ "engineer-foo": "%180" }) },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/sessions"));
      const body = (await res.json()) as {
        sessions: Array<{ session: string; pane?: { paneId: string } }>;
      };

      const tracked = body.sessions.find((s) => s.session === "engineer-foo");
      const untracked = body.sessions.find((s) => s.session === "orch-b");
      expect(tracked?.pane).toEqual({ paneId: "%180" });
      expect(untracked?.pane).toBeUndefined();
    });

    it("returns session-only records (no `pane` key) when no paneReader is configured", async () => {
      const sessionStore = createInMemorySessionStore();
      await sessionStore.register({ session: "engineer-foo", role: "engineer" });
      const handler = createCoordServiceRequestHandler(
        { sessionStore },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/sessions"));
      const body = (await res.json()) as { sessions: Array<Record<string, unknown>> };

      expect(body.sessions[0]).not.toHaveProperty("pane");
    });
  });

  // ── Message bus (#1993, Phase 4) ────────────────────────────────────────────────

  function postMessageRequest(body: unknown): Request {
    return new Request("http://127.0.0.1:8991/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const VALID_MESSAGE = {
    topic: "issue:1983",
    type: "handoff",
    subject: "context",
    sender: "orch-b",
  };

  describe("POST /messages", () => {
    it("persists AND publishes, returning 201 { id }", async () => {
      const messageStore = createInMemoryMessageStore();
      const subscriptions = createSubscriptions();
      const published: unknown[] = [];
      subscriptions.subscribe(undefined, (m) => published.push(m));
      const handler = createCoordServiceRequestHandler(
        { messageStore, subscriptions },
      );

      const res = await handler(postMessageRequest(VALID_MESSAGE));

      expect(res.status).toBe(201);
      const body = (await res.json()) as { id: string };
      expect(body.id).toBeTruthy();
      expect(await messageStore.read("issue:1983")).toHaveLength(1);
      expect(published).toHaveLength(1);
    });

    it("400s on a missing required field", async () => {
      const handler = createCoordServiceRequestHandler(
        { messageStore: createInMemoryMessageStore(), subscriptions: createSubscriptions() },
      );

      const res = await handler(postMessageRequest({ topic: "issue:1983", type: "handoff" }));
      expect(res.status).toBe(400);
    });

    it("413s on a body over 64KB", async () => {
      const handler = createCoordServiceRequestHandler(
        { messageStore: createInMemoryMessageStore(), subscriptions: createSubscriptions() },
      );

      const res = await handler(
        postMessageRequest({ ...VALID_MESSAGE, data: { blob: "x".repeat(70_000) } }),
      );
      expect(res.status).toBe(413);
    });

    it("500s with 'message bus not configured' when messageStore is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(postMessageRequest(VALID_MESSAGE));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "message bus not configured" });
    });

    it("logs a begin-marker then an end-marker (ADR-0150)", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const handler = createCoordServiceRequestHandler(
        { messageStore: createInMemoryMessageStore(), subscriptions: createSubscriptions() },
      );

      await handler(postMessageRequest(VALID_MESSAGE));

      const lines = logSpy.mock.calls.map((call) => String(call[0]));
      expect(lines[0]).toBe("coord-service: ▶ POST /messages…");
      expect(lines[1]).toMatch(/^coord-service: ✓ POST \/messages topic=issue:1983 \(\d+ms\)$/);
      logSpy.mockRestore();
    });
  });

  describe("GET /messages", () => {
    it("returns the durable backlog for a topic", async () => {
      const messageStore = createInMemoryMessageStore();
      await messageStore.append({ ...VALID_MESSAGE, ts: "2026-07-16T00:00:00.000Z" });
      const handler = createCoordServiceRequestHandler(
        { messageStore, subscriptions: createSubscriptions() },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/messages?topic=issue:1983"));

      expect(res.status).toBe(200);
      const messages = (await res.json()) as Array<{ subject: string }>;
      expect(messages).toHaveLength(1);
      expect(messages[0]!.subject).toBe("context");
    });

    it("400s when topic is absent", async () => {
      const handler = createCoordServiceRequestHandler(
        { messageStore: createInMemoryMessageStore(), subscriptions: createSubscriptions() },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/messages"));
      expect(res.status).toBe(400);
    });
  });

  describe("GET /messages/stream", () => {
    it("streams a text/event-stream response that round-trips a published message", async () => {
      const messageStore = createInMemoryMessageStore();
      const subscriptions = createSubscriptions();
      const handler = createCoordServiceRequestHandler(
        { messageStore, subscriptions },
      );

      const res = await handler(
        new Request("http://127.0.0.1:8991/messages/stream?topic=issue:1983"),
      );

      expect(res.headers.get("content-type")).toContain("text/event-stream");
      expect(res.body).toBeTruthy();

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      const framePromise = (async () => {
        let buffer = "";
        while (!buffer.includes("\n\n")) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value);
        }
        return buffer;
      })();

      const stored = await messageStore.append(VALID_MESSAGE);
      subscriptions.publish(stored);

      const frame = await framePromise;
      expect(frame.startsWith("data: ")).toBe(true);
      const parsed = JSON.parse(frame.replace(/^data: /, "").trim()) as { id: string };
      expect(parsed.id).toBe(stored.id);
      await reader.cancel();
    });

    it("does not yield a frame for a non-matching topic", async () => {
      const messageStore = createInMemoryMessageStore();
      const subscriptions = createSubscriptions();
      const handler = createCoordServiceRequestHandler(
        { messageStore, subscriptions },
      );

      const res = await handler(
        new Request("http://127.0.0.1:8991/messages/stream?topic=issue:1983"),
      );
      const reader = res.body!.getReader();

      subscriptions.publish({
        id: "1",
        topic: "other-topic",
        type: "handoff",
        subject: "context",
        sender: "orch-b",
        ts: "2026-07-16T00:00:00.000Z",
        ackedBy: [],
      });

      // No frame arrives — race a short timeout against the read.
      const result = await Promise.race([
        reader.read(),
        new Promise<{ timedOut: true }>((resolve) =>
          setTimeout(() => resolve({ timedOut: true }), 50),
        ),
      ]);
      expect(result).toEqual({ timedOut: true });
      await reader.cancel();
    });

    it("unsubscribes when the request is aborted", async () => {
      const messageStore = createInMemoryMessageStore();
      const subscriptions = createSubscriptions();
      const handler = createCoordServiceRequestHandler(
        { messageStore, subscriptions },
      );
      const controller = new AbortController();

      const res = await handler(
        new Request("http://127.0.0.1:8991/messages/stream?topic=issue:1983", {
          signal: controller.signal,
        }),
      );
      const reader = res.body!.getReader();
      controller.abort();
      // Give the abort handler a tick to fire and cancel the stream.
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await reader.read();
      expect(result.done).toBe(true);
    });

    it("sends a comment-only heartbeat frame on an idle subscription, well under Bun's ~10s idle-connection timeout (#2266)", async () => {
      vi.useFakeTimers();
      try {
        const subscriptions = createSubscriptions();
        const handler = createCoordServiceRequestHandler(
          { messageStore: createInMemoryMessageStore(), subscriptions },
        );

        const res = await handler(
          new Request("http://127.0.0.1:8991/messages/stream?topic=issue:1983"),
        );
        const reader = res.body!.getReader();

        const framePromise = reader.read();
        await vi.advanceTimersByTimeAsync(SSE_HEARTBEAT_INTERVAL_MS);
        const { value, done } = await framePromise;

        expect(done).toBe(false);
        expect(new TextDecoder().decode(value)).toBe(SSE_HEARTBEAT_COMMENT);
        await reader.cancel();
      } finally {
        vi.useRealTimers();
      }
    });

    it("stops sending heartbeats after the request is aborted", async () => {
      vi.useFakeTimers();
      try {
        const subscriptions = createSubscriptions();
        const handler = createCoordServiceRequestHandler(
          { messageStore: createInMemoryMessageStore(), subscriptions },
        );
        const controller = new AbortController();

        const res = await handler(
          new Request("http://127.0.0.1:8991/messages/stream?topic=issue:1983", {
            signal: controller.signal,
          }),
        );
        const reader = res.body!.getReader();
        controller.abort();
        await vi.advanceTimersByTimeAsync(0);

        // Stream is closed — no further heartbeat tick can enqueue past this point.
        const result = await Promise.race([
          reader.read(),
          (async () => {
            await vi.advanceTimersByTimeAsync(SSE_HEARTBEAT_INTERVAL_MS * 3);
            return { done: true, value: undefined };
          })(),
        ]);
        expect(result.done).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("POST /messages/:id/ack", () => {
    it("marks the read-receipt, visible on a subsequent GET /messages", async () => {
      const messageStore = createInMemoryMessageStore();
      const stored = await messageStore.append(VALID_MESSAGE);
      const handler = createCoordServiceRequestHandler(
        { messageStore, subscriptions: createSubscriptions() },
      );

      const res = await handler(
        new Request(`http://127.0.0.1:8991/messages/${stored.id}/ack`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ session: "orch-a" }),
        }),
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      const [message] = await messageStore.read("issue:1983");
      expect(message!.ackedBy).toEqual(["orch-a"]);
    });

    it("400s when 'session' is missing", async () => {
      const messageStore = createInMemoryMessageStore();
      const stored = await messageStore.append(VALID_MESSAGE);
      const handler = createCoordServiceRequestHandler(
        { messageStore, subscriptions: createSubscriptions() },
      );

      const res = await handler(
        new Request(`http://127.0.0.1:8991/messages/${stored.id}/ack`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("logs a begin-marker then an end-marker (ADR-0150)", async () => {
      const messageStore = createInMemoryMessageStore();
      const stored = await messageStore.append(VALID_MESSAGE);
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const handler = createCoordServiceRequestHandler(
        { messageStore, subscriptions: createSubscriptions() },
      );

      await handler(
        new Request(`http://127.0.0.1:8991/messages/${stored.id}/ack`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ session: "orch-a" }),
        }),
      );

      const lines = logSpy.mock.calls.map((call) => String(call[0]));
      expect(lines[0]).toBe(`coord-service: ▶ POST /messages/${stored.id}/ack…`);
      expect(lines[1]).toMatch(
        new RegExp(
          `^coord-service: ✓ POST /messages/${stored.id}/ack session=orch-a \\(\\d+ms\\)$`,
        ),
      );
      logSpy.mockRestore();
    });
  });

  describe("GET /topics", () => {
    it("lists active topics", async () => {
      const messageStore = createInMemoryMessageStore();
      await messageStore.append(VALID_MESSAGE);
      await messageStore.append({ ...VALID_MESSAGE, topic: "events" });
      const handler = createCoordServiceRequestHandler(
        { messageStore, subscriptions: createSubscriptions() },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/topics"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        topics: expect.arrayContaining(["issue:1983", "events"]),
      });
    });

    it("500s with 'message bus not configured' when messageStore is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(new Request("http://127.0.0.1:8991/topics"));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "message bus not configured" });
    });
  });

  // ── Merge lock (issue #2409) ─────────────────────────────────────────────────

  function acquireRequest(body: unknown): Request {
    return new Request("http://127.0.0.1:8991/merge-lock/acquire", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function releaseRequest(body: unknown): Request {
    return new Request("http://127.0.0.1:8991/merge-lock/release", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  describe("POST /merge-lock/acquire", () => {
    it("200s { acquired: true, view } on a free lock", async () => {
      const mergeLockStore = createInMemoryMergeLockStore();
      const handler = createCoordServiceRequestHandler(
        { mergeLockStore },
      );

      const res = await handler(
        acquireRequest({ name: "merge", holder: "holder-a", ttlSeconds: 900 }),
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { acquired: boolean; view: { holder: string } };
      expect(body.acquired).toBe(true);
      expect(body.view.holder).toBe("holder-a");
    });

    it("200s { acquired: false, view } on contention — the other holder's view, not an error", async () => {
      const mergeLockStore = createInMemoryMergeLockStore();
      await mergeLockStore.acquire("merge", "holder-a", 900);
      const handler = createCoordServiceRequestHandler(
        { mergeLockStore },
      );

      const res = await handler(
        acquireRequest({ name: "merge", holder: "holder-b", ttlSeconds: 900 }),
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { acquired: boolean; view: { holder: string } };
      expect(body.acquired).toBe(false);
      expect(body.view.holder).toBe("holder-a");
    });

    it("400s when a required field is missing", async () => {
      const handler = createCoordServiceRequestHandler(
        { mergeLockStore: createInMemoryMergeLockStore() },
      );

      const res = await handler(acquireRequest({ holder: "holder-a", ttlSeconds: 900 }));
      expect(res.status).toBe(400);
    });

    it("500s with 'merge lock not configured' when mergeLockStore is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(
        acquireRequest({ name: "merge", holder: "holder-a", ttlSeconds: 900 }),
      );
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "merge lock not configured" });
    });
  });

  describe("POST /merge-lock/release", () => {
    it("200s { released: true } for the current holder", async () => {
      const mergeLockStore = createInMemoryMergeLockStore();
      await mergeLockStore.acquire("merge", "holder-a", 900);
      const handler = createCoordServiceRequestHandler(
        { mergeLockStore },
      );

      const res = await handler(releaseRequest({ name: "merge", holder: "holder-a" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ released: true });
    });

    it("400s when a required field is missing", async () => {
      const handler = createCoordServiceRequestHandler(
        { mergeLockStore: createInMemoryMergeLockStore() },
      );

      const res = await handler(releaseRequest({ name: "merge" }));
      expect(res.status).toBe(400);
    });

    it("500s with 'merge lock not configured' when mergeLockStore is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(releaseRequest({ name: "merge", holder: "holder-a" }));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "merge lock not configured" });
    });
  });

  describe("GET /merge-lock", () => {
    it("200s { held: false } when free", async () => {
      const handler = createCoordServiceRequestHandler(
        { mergeLockStore: createInMemoryMergeLockStore() },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/merge-lock?name=merge"));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ held: false });
    });

    it("200s { held: true, view } when held", async () => {
      const mergeLockStore = createInMemoryMergeLockStore();
      await mergeLockStore.acquire("merge", "holder-a", 900);
      const handler = createCoordServiceRequestHandler(
        { mergeLockStore },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/merge-lock?name=merge"));

      expect(res.status).toBe(200);
      const body = (await res.json()) as { held: boolean; view: { holder: string } };
      expect(body.held).toBe(true);
      expect(body.view.holder).toBe("holder-a");
    });

    it("400s when 'name' query param is absent", async () => {
      const handler = createCoordServiceRequestHandler(
        { mergeLockStore: createInMemoryMergeLockStore() },
      );

      const res = await handler(new Request("http://127.0.0.1:8991/merge-lock"));
      expect(res.status).toBe(400);
    });

    it("500s with 'merge lock not configured' when mergeLockStore is omitted", async () => {
      const handler = createCoordServiceRequestHandler(
        );

      const res = await handler(new Request("http://127.0.0.1:8991/merge-lock?name=merge"));
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "merge lock not configured" });
    });
  });
});

it.each([0, -1, 0.5])("rejects invalid lock TTL %s before storing it", async ttlSeconds => {
  const store = createInMemoryMergeLockStore();
  const handler = createCoordServiceRequestHandler({ mergeLockStore:store });
  const response = await handler(new Request("http://localhost/merge-lock/acquire",{method:"POST",body:JSON.stringify({name:"merge",holder:"a",ttlSeconds})}));
  expect(response.status).toBe(400);
  expect(await store.status("merge")).toEqual({held:false});
});

it("returns stored sessions when optional Herdr enrichment fails", async () => {
  const store = createInMemorySessionStore();
  await store.register({session:"engineer",role:"engineer"});
  const handler = createCoordServiceRequestHandler({sessionStore:store,paneReader:()=>{throw new Error("Herdr socket down");}});
  const response = await handler(new Request("http://localhost/sessions"));
  expect(response.status).toBe(200);
  expect((await response.json()).sessions).toEqual([expect.objectContaining({session:"engineer",role:"engineer"})]);
});
