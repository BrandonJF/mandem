/**
 * @fileoverview `/messages*` + `/topics` route logic (issue #1993 — coord-service Phase
 * 4), extracted from `http-handler.ts` per the architecture-reviewer's Finding M3 (SRP /
 * fat route god-function) — a focused helper returning `undefined` on a non-match so the
 * main handler stays a thin dispatcher, exactly mirroring `session-routes.ts`'s shape.
 *
 * Routes: `POST /messages`, `GET /messages`, `GET /messages/stream` (SSE), `POST
 * /messages/:id/ack`, `GET /topics`. See `message-store.ts`'s file header for the
 * topic-addressing model and `PlaneMessage` schema this operates over.
 */

import type { MessageStore, Subscriptions } from "../application/ports/message-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// ── Logging (ADR-0150 bracket convention — mirrors http-handler.ts's own markers;
//    duplicated rather than imported to avoid a http-handler.ts <-> message-routes.ts
//    import cycle, since http-handler.ts imports this module). ──────────────────────

const LOG_PREFIX = "coord-service";
const BEGIN_MARKER = "▶";
const OK_MARKER = "✓";
const FAIL_MARKER = "✗";

function logPostMessageBegin(): void {
  console.log(`${LOG_PREFIX}: ${BEGIN_MARKER} POST /messages…`);
}

function logPostMessageEnd(
  outcome: { ok: true; topic: string } | { ok: false; error: string },
  elapsedMs: number,
): void {
  const marker = outcome.ok ? OK_MARKER : FAIL_MARKER;
  const detail = outcome.ok ? `topic=${outcome.topic}` : `FAILED: ${outcome.error}`;
  console.log(`${LOG_PREFIX}: ${marker} POST /messages ${detail} (${elapsedMs}ms)`);
}

function logAckBegin(id: string): void {
  console.log(`${LOG_PREFIX}: ${BEGIN_MARKER} POST /messages/${id}/ack…`);
}

function logAckEnd(
  id: string,
  outcome: { ok: true; session: string } | { ok: false; error: string },
  elapsedMs: number,
): void {
  const marker = outcome.ok ? OK_MARKER : FAIL_MARKER;
  const detail = outcome.ok ? `session=${outcome.session}` : `FAILED: ${outcome.error}`;
  console.log(`${LOG_PREFIX}: ${marker} POST /messages/${id}/ack ${detail} (${elapsedMs}ms)`);
}

/** `POST /messages` rejects a body over this size (Pinned specifics — a sane cap for a
 *  handoff-context message; retention bounds growth, not per-message size). */
const MAX_MESSAGE_BODY_BYTES = 64 * 1024;

/** Matches `/messages/<id>/ack` — `<id>` captured for the ack route. */
const ACK_PATH_RE = /^\/messages\/([^/]+)\/ack$/;

/** Options `message-routes.ts` needs from the composition root — a subset of
 *  `CoordServiceHandlerOptions`. */
export interface MessageRouteOptions {
  messageStore?: MessageStore;
  subscriptions?: Subscriptions;
}

const NOT_CONFIGURED_ERROR = "message bus not configured";

/** `GET /messages/stream`'s keep-alive tick (issue #2266). Bun.serve silently closes an
 *  idle SSE connection after ~10s of zero bytes sent (reproduced live: a quiet `curl -N`
 *  subscription was cut at 9.5s/10.0s). A comment-only SSE line (ignored by every client
 *  per the SSE spec, `: <text>\n\n`) resets that idle timer without emitting a real event
 *  — sent well under the ~10s cutoff so no idle subscriber (e.g. #2162's watcher) ever
 *  goes quiet long enough to be reaped and reconnect-cycle. */
export const SSE_HEARTBEAT_INTERVAL_MS = 5_000;

/** The comment-only SSE keep-alive line itself — exported so tests assert against the
 *  same literal instead of a duplicated copy (DRY). */
export const SSE_HEARTBEAT_COMMENT = ": ping\n\n";

/**
 * Handle every message-bus route if `req` matches one. Returns `undefined` for any other
 * path/method so `http-handler.ts` can fall through to its next route (or the final 404).
 */
export async function handleMessageRoutes(
  req: Request,
  url: URL,
  opts: MessageRouteOptions,
): Promise<Response | undefined> {
  if (url.pathname === "/messages" && req.method === "POST") {
    const requestStart = Date.now();
    if (!opts.messageStore || !opts.subscriptions) {
      return Response.json({ error: NOT_CONFIGURED_ERROR }, { status: 500 });
    }
    logPostMessageBegin();

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_MESSAGE_BODY_BYTES) {
      logPostMessageEnd(
        { ok: false, error: "message body exceeds 64KB limit" },
        Date.now() - requestStart,
      );
      return Response.json({ error: "message body exceeds 64KB limit" }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody) as unknown;
    } catch {
      logPostMessageEnd({ ok: false, error: "invalid JSON body" }, Date.now() - requestStart);
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const topic = isRecord(body) && typeof body.topic === "string" ? body.topic : undefined;
    const type = isRecord(body) && typeof body.type === "string" ? body.type : undefined;
    const subject = isRecord(body) && typeof body.subject === "string" ? body.subject : undefined;
    const sender = isRecord(body) && typeof body.sender === "string" ? body.sender : undefined;
    if (!topic || !type || !subject || !sender) {
      logPostMessageEnd(
        { ok: false, error: "missing required 'topic'/'type'/'subject'/'sender' string field" },
        Date.now() - requestStart,
      );
      return Response.json(
        { error: "missing required 'topic'/'type'/'subject'/'sender' string field" },
        { status: 400 },
      );
    }
    const data =
      isRecord(body) && isRecord(body.data) ? (body.data as Record<string, unknown>) : undefined;

    const stored = await opts.messageStore.append({
      topic,
      type,
      subject,
      sender,
      ts: new Date().toISOString(),
      ...(data ? { data } : {}),
    });
    opts.subscriptions.publish(stored);
    logPostMessageEnd({ ok: true, topic }, Date.now() - requestStart);
    return Response.json({ id: stored.id }, { status: 201 });
  }

  if (url.pathname === "/messages" && req.method === "GET") {
    if (!opts.messageStore) {
      return Response.json({ error: NOT_CONFIGURED_ERROR }, { status: 500 });
    }
    const topic = url.searchParams.get("topic");
    if (!topic) {
      return Response.json({ error: "missing required 'topic' query param" }, { status: 400 });
    }
    const since = url.searchParams.get("since") ?? undefined;
    const messages = await opts.messageStore.read(topic, since);
    return Response.json(messages);
  }

  if (url.pathname === "/messages/stream" && req.method === "GET") {
    if (!opts.subscriptions) {
      return Response.json({ error: NOT_CONFIGURED_ERROR }, { status: 500 });
    }
    const subscriptions = opts.subscriptions;
    const topic = url.searchParams.get("topic") ?? undefined;

    // Hoisted above `start()` so `cancel()` (fired by `reader.cancel()`, distinct from the
    // `abort` event fired by `req.signal`) can reach the same cleanup — a manual cancel
    // must stop the heartbeat interval and unsubscribe too, or both leak.
    let unsubscribe: (() => void) | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        unsubscribe = subscriptions.subscribe(topic, (message) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        });

        heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(SSE_HEARTBEAT_COMMENT));
          } catch {
            // stream already closed — the interval is cleared by close()/cancel() below;
            // this guards only the race where a tick was already in flight.
          }
        }, SSE_HEARTBEAT_INTERVAL_MS);

        const close = (): void => {
          clearInterval(heartbeat);
          unsubscribe?.();
          try {
            controller.close();
          } catch {
            // already closed — a concurrent abort + natural close race, harmless.
          }
        };

        req.signal.addEventListener("abort", close);
      },
      cancel() {
        clearInterval(heartbeat);
        unsubscribe?.();
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  }

  const ackMatch = url.pathname.match(ACK_PATH_RE);
  if (ackMatch && req.method === "POST") {
    const requestStart = Date.now();
    if (!opts.messageStore) {
      return Response.json({ error: NOT_CONFIGURED_ERROR }, { status: 500 });
    }
    const id = ackMatch[1]!;
    logAckBegin(id);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      logAckEnd(id, { ok: false, error: "invalid JSON body" }, Date.now() - requestStart);
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }
    const session = isRecord(body) && typeof body.session === "string" ? body.session : undefined;
    if (!session) {
      logAckEnd(
        id,
        { ok: false, error: "missing required 'session' string field" },
        Date.now() - requestStart,
      );
      return Response.json({ error: "missing required 'session' string field" }, { status: 400 });
    }

    await opts.messageStore.ack(id, session);
    logAckEnd(id, { ok: true, session }, Date.now() - requestStart);
    return Response.json({ ok: true });
  }

  if (url.pathname === "/topics" && req.method === "GET") {
    if (!opts.messageStore) {
      return Response.json({ error: NOT_CONFIGURED_ERROR }, { status: 500 });
    }
    const topics = await opts.messageStore.listTopics();
    return Response.json({ topics });
  }

  return undefined;
}
