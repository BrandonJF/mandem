/** @fileoverview Fetch client preserving Strategy Builder Pro coordination interfaces. */
import { parseRepairState } from "../domain/repair-values";
import { parseSlotState } from "../domain/slot-values";
import { parseReviewState } from "../domain/review-values";
import { parseStoredStop, parseStreamReport, record } from "../domain/stream-values";
import type { StopRecord, StreamReport } from "../domain/streams";
import type { PlaneMessage } from '../application/ports/message-store';
import type { SessionRecord } from '../application/ports/session-store';
import type { EnrichedSessionRecord } from './session-routes';
import type { MergeLockStatus, MergeLockView } from '../application/ports/merge-lock-store';
export type { MergeLockStatus, MergeLockView };
export const DEFAULT_COORD_SERVICE_PORT = 8991;
export const DEFAULT_CLAIM_TIMEOUT_MS = 3000;
export const DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 1500;
export function resolveDefaultCoordServiceUrl(env: NodeJS.ProcessEnv = process.env): string {
 return env.MANDEM_COORD_URL ?? ('http://127.0.0.1:' + (env.COORD_SERVICE_PORT ?? DEFAULT_COORD_SERVICE_PORT));
}
export interface ClaimNextIdOptions { baseUrl?: string; timeoutMs?: number; fetchImpl?: typeof fetch; }

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function checkedFetch(opts?: ClaimNextIdOptions): typeof fetch {
 return (async (input: string | URL | Request, init?: RequestInit) => {
  const response = await (opts?.fetchImpl ?? fetch)(input, init);
  if (!response.ok) throw new Error('Coordination request failed: HTTP ' + response.status + ' ' + await response.text());
  return response;
 }) as typeof fetch;
}
type CoordServiceHealthOptions = ClaimNextIdOptions;
export async function isCoordServiceHealthy(opts?: CoordServiceHealthOptions): Promise<boolean> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = opts?.fetchImpl ?? fetch;

  try {
    const res = await fetchImpl(`${baseUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_HEALTH_CHECK_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const body: unknown = await res.json();
    return isRecord(body) && body.ok === true;
  } catch {
    return false;
  }
}

export async function registerSession(
  rec: { session: string; role: string; data?: Record<string, unknown> },
  opts?: ClaimNextIdOptions,
): Promise<void> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = checkedFetch(opts);

  const response = await fetchImpl(`${baseUrl}/sessions/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rec),
    signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_CLAIM_TIMEOUT_MS),
  });
  const body: unknown = await response.json();
  if (!isRecord(body) || body.ok !== true) throw new Error("Invalid coordination registration response");
}

/**
 * Fetch the current live-session directory via `GET /sessions` — advisorily enriched
 * with each tracked session's live pane binding when the coord service has a
 * `paneReader` configured (see `session-routes.ts`).
 */
export async function listSessions(
  opts?: ClaimNextIdOptions,
): Promise<Array<SessionRecord & { pane?: { paneId: string } }>> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = checkedFetch(opts);

  const res = await fetchImpl(`${baseUrl}/sessions`, {
    method: "GET",
    signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_CLAIM_TIMEOUT_MS),
  });
  const body: unknown = await res.json();
  const sessions = isRecord(body) && Array.isArray(body.sessions) ? body.sessions : [];
  if (!isRecord(body) || !Array.isArray(body.sessions)) throw new Error("Invalid coordination session response");
  return sessions as EnrichedSessionRecord[];
}

// ── Message bus (issue #1993 — coord-service Phase 4) ────────────────────────────
//
// A durable, topic-addressed mailbox + pub/sub — the black-boxed transport surface for
// the plane's message bus. See `message-store.ts`'s file header for the `PlaneMessage`
// schema + topic-addressing model this operates over. No call site outside this file may
// name the service's host/port/path (ADR-0161) — see `check-transport-leak.ts`.

/** Options for {@link postMessage}/{@link readMessages}/{@link ackMessage}/{@link listTopics}. */
export type MessageClientOptions = ClaimNextIdOptions;

/** Post a durable, topic-addressed message. Returns the server-assigned id. */
export async function postMessage(
  msg: {
    topic: string;
    type: string;
    subject: string;
    sender: string;
    data?: Record<string, unknown>;
  },
  opts?: MessageClientOptions,
): Promise<{ id: string }> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = checkedFetch(opts);

  const res = await fetchImpl(`${baseUrl}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(msg),
    signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_CLAIM_TIMEOUT_MS),
  });
  const body: unknown = await res.json();
  const id = isRecord(body) && typeof body.id === "string" ? body.id : "";
  if (!id) throw new Error("Invalid coordination message response");
  return { id };
}

/** Read a topic's durable backlog, optionally only ids strictly after `since` (exclusive). */
export async function readMessages(
  topic: string,
  opts?: MessageClientOptions & { since?: string },
): Promise<PlaneMessage[]> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = checkedFetch(opts);

  const url = new URL(`${baseUrl}/messages`);
  url.searchParams.set("topic", topic);
  if (opts?.since !== undefined) url.searchParams.set("since", opts.since);

  const res = await fetchImpl(url.toString(), {
    method: "GET",
    signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_CLAIM_TIMEOUT_MS),
  });
  const body: unknown = await res.json();
  if (!Array.isArray(body)) throw new Error("Invalid coordination inbox response");
  return body as PlaneMessage[];
}

/** Record a read-receipt for `id` (idempotent — acking twice is a no-op). */
export async function ackMessage(
  id: string,
  session: string,
  opts?: MessageClientOptions,
): Promise<void> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = checkedFetch(opts);

  const response = await fetchImpl(`${baseUrl}/messages/${encodeURIComponent(id)}/ack`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session }),
    signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_CLAIM_TIMEOUT_MS),
  });
  const body: unknown = await response.json();
  if (!isRecord(body) || body.ok !== true) throw new Error("Invalid coordination acknowledgement response");
}

/** List distinct topics that currently have at least one message (discovery). */
export async function listTopics(opts?: MessageClientOptions): Promise<string[]> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = checkedFetch(opts);

  const res = await fetchImpl(`${baseUrl}/topics`, {
    method: "GET",
    signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_CLAIM_TIMEOUT_MS),
  });
  const body: unknown = await res.json();
  if (!isRecord(body) || !Array.isArray(body.topics) || !body.topics.every(topic => typeof topic === "string")) throw new Error("Invalid coordination topic response");
  return body.topics as string[];
}

/** Parse one `data: <json>\n\n` SSE frame body into a `PlaneMessage`, or `undefined` if
 *  the frame carries no `data:` line (the wire format has no `event:`/`id:` lines). */
function parseSseFrame(frame: string): PlaneMessage | undefined {
  const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
  if (!dataLine) return undefined;
  try {
    return JSON.parse(dataLine.slice("data: ".length)) as PlaneMessage;
  } catch {
    return undefined;
  }
}

/**
 * Subscribe to a topic's live stream (or every topic, when `topic` is `undefined`).
 * Transport (SSE) is an internal detail — callers pass a topic + callback, never a URL.
 *
 * **Gap-free stitching (architecture-reviewer Finding H2).** The incident's core
 * requirement is *reliable* delivery — "a session that connects late still sees what it
 * missed." Live SSE and the durable backlog are two independent reads with a gap/overlap
 * window (a message published between "SSE opens" and "backlog read completes" could
 * otherwise be missed or double-delivered). This function owns the correct recipe so
 * every caller gets it for free: **open the SSE connection FIRST and buffer its frames
 * (undelivered)**, **then read the topic's backlog and deliver it**, **then replay the
 * buffered live frames, skipping any id already covered by the backlog (dedupe-by-id,
 * ids are monotonic)** — after which live frames are delivered directly. When `topic` is
 * `undefined` (an all-topics subscription), there is no single-topic backlog to stitch
 * against (`GET /messages` requires a `topic`), so this degrades to live-only delivery —
 * documented, not silently different behavior.
 *
 * **`onClose` (Task 1, #2162 — watcher message-bus migration).** Fires exactly once, when
 * delivery has permanently stopped for THIS subscription: the initial `fetch` rejected,
 * `res.body` was absent, the read loop's `reader.read()` threw, or the stream ended
 * (`result.done`). A caller-initiated `.abort()` also surfaces here (the abort makes the
 * in-flight fetch/read reject) — a caller that aborted deliberately can simply ignore the
 * callback. A long-lived subscriber (`watch-any-report.ts`'s subscriber loop) uses this to
 * reconnect; a one-shot caller may omit it entirely.
 */
export function subscribeMessages(
  topic: string | undefined,
  onMessage: (m: PlaneMessage) => void,
  opts?: MessageClientOptions & { onClose?: () => void },
): AbortController {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = checkedFetch(opts);
  const controller = new AbortController();

  const url = new URL(`${baseUrl}/messages/stream`);
  if (topic !== undefined) url.searchParams.set("topic", topic);

  let closed = false;
  /** Fire `onClose` at most once per `subscribeMessages` call — every terminal path below
   *  (fetch reject, no body, read error, stream end) routes through this. */
  const fireClose = (): void => {
    if (closed) return;
    closed = true;
    opts?.onClose?.();
  };

  void (async () => {
    let lastDeliveredId = -Infinity;
    let backlogLoaded = topic === undefined; // no backlog to stitch for an all-topics sub
    const buffered: PlaneMessage[] = [];

    function deliverIfNew(message: PlaneMessage): void {
      const idNum = Number(message.id);
      if (Number.isFinite(idNum) && idNum <= lastDeliveredId) return; // dedupe
      if (Number.isFinite(idNum)) lastDeliveredId = idNum;
      onMessage(message);
    }

    let res: Response;
    try {
      res = await fetchImpl(url.toString(), { signal: controller.signal });
    } catch {
      fireClose(); // connection failed — caller decides whether to retry
      return;
    }
    if (!res.body) {
      fireClose();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";

    const readLoopPromise = (async () => {
      while (true) {
        let result: Awaited<ReturnType<typeof reader.read>>;
        try {
          result = await reader.read();
        } catch {
          fireClose();
          return;
        }
        if (result.done) {
          fireClose();
          return;
        }
        textBuffer += decoder.decode(result.value, { stream: true });

        let separatorIndex: number;
        while ((separatorIndex = textBuffer.indexOf("\n\n")) !== -1) {
          const frame = textBuffer.slice(0, separatorIndex);
          textBuffer = textBuffer.slice(separatorIndex + 2);
          const message = parseSseFrame(frame);
          if (!message) continue;
          if (backlogLoaded) {
            deliverIfNew(message);
          } else {
            buffered.push(message);
          }
        }
      }
    })();
    void readLoopPromise;

    if (topic !== undefined) {
      try {
        const backlog = await readMessages(topic, { baseUrl, fetchImpl });
        for (const message of backlog) deliverIfNew(message);
      } catch {
        // Backlog read failed — fall through to live-only delivery of what follows;
        // still better than throwing away the whole subscription.
      }
      backlogLoaded = true;
      for (const message of buffered.splice(0)) deliverIfNew(message);
    }
  })();

  return controller;
}

export const MERGE_LOCK_NAME = "merge";

/** Default TTL a merge pipeline holds the lock (seconds). 15 min — generous headroom
 *  over a sync+gate+merge run, short enough that a crashed holder auto-heals promptly. */
export const MERGE_LOCK_TTL_SECONDS = 900;

/** Env var carrying a parent `gate-and-merge.ts`'s holder token to its child
 *  `finish-task.ts`, so the child skips its own acquire (the parent owns the lock). */
export const COORD_MERGE_LOCK_HOLDER_ENV = "COORD_MERGE_LOCK_HOLDER";

/**
 * Thrown by {@link acquireMergeLock} whenever the coord service could not be reached or
 * returned something unusable — FAIL-CLOSED, mirroring {@link CoordServiceUnavailableError}:
 * a merge pipeline must never proceed as if it held the lock when the coord service (the
 * lock's sole authority) is unreachable.
 */
export class CoordMergeLockUnavailableError extends Error {
  constructor(cause: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(
      `coord service unreachable while acquiring the merge lock — FAILED CLOSED (issue #2409): ` +
        `refusing to proceed as if the lock were held. Start it: ` +
        `mandem serve — cause: ${causeMessage}`,
    );
    this.name = "CoordMergeLockUnavailableError";
  }
}

function isMergeLockView(value: unknown): value is MergeLockView {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.holder === "string" &&
    typeof value.acquiredAt === "string" &&
    typeof value.ttlSeconds === "number" &&
    typeof value.expiresAt === "string" &&
    typeof value.expired === "boolean"
  );
}

/**
 * Acquire the merge lock. Generates a holder token via `crypto.randomUUID()` when
 * `opts.holder` is omitted. FAIL-CLOSED: throws {@link CoordMergeLockUnavailableError}
 * on unreachable/non-2xx/bad-shape (never merge on a coord outage). Contention (a valid
 * OTHER holder) is NOT an error — resolves `{ acquired: false, holder, view }`.
 */
export async function acquireMergeLock(
  opts?: ClaimNextIdOptions & {
    holder?: string;
    name?: string;
    ttlSeconds?: number;
  },
): Promise<{ acquired: boolean; holder: string; view: MergeLockView }> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const name = opts?.name ?? MERGE_LOCK_NAME;
  const holder = opts?.holder ?? crypto.randomUUID();
  const ttlSeconds = opts?.ttlSeconds ?? MERGE_LOCK_TTL_SECONDS;

  let res: Response;
  try {
    res = await fetchImpl(`${baseUrl}/merge-lock/acquire`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, holder, ttlSeconds }),
      signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_CLAIM_TIMEOUT_MS),
    });
  } catch (err) {
    throw new CoordMergeLockUnavailableError(err);
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body: unknown = await res.json();
      if (isRecord(body) && typeof body.error === "string") detail = body.error;
    } catch {
      // keep the HTTP-status detail
    }
    throw new CoordMergeLockUnavailableError(new Error(detail));
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch (err) {
    throw new CoordMergeLockUnavailableError(err);
  }

  if (!isRecord(body) || typeof body.acquired !== "boolean" || !isMergeLockView(body.view)) {
    throw new CoordMergeLockUnavailableError(
      new Error(`unexpected response shape: ${JSON.stringify(body)}`),
    );
  }

  return { acquired: body.acquired, holder, view: body.view };
}

/**
 * Release the merge lock held by `holder`. BEST-EFFORT: never throws — a failed release
 * just waits out the TTL (the auto-heal backstop). Safe to call in a `finally`.
 */
export async function releaseMergeLock(
  holder: string,
  opts?: ClaimNextIdOptions & { name?: string },
): Promise<void> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const name = opts?.name ?? MERGE_LOCK_NAME;

  try {
    await fetchImpl(`${baseUrl}/merge-lock/release`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, holder }),
      signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_CLAIM_TIMEOUT_MS),
    });
  } catch {
    // Best-effort — a failed release just waits out the TTL.
  }
}

/**
 * Read merge-lock status for `bun run status`. Never throws (mirrors {@link fetchGhStats})
 * — resolves `undefined` on any failure.
 */
export async function fetchMergeLock(
  opts?: ClaimNextIdOptions & { name?: string },
): Promise<MergeLockStatus | undefined> {
  const baseUrl = opts?.baseUrl ?? resolveDefaultCoordServiceUrl();
  const fetchImpl = opts?.fetchImpl ?? fetch;
  const name = opts?.name ?? MERGE_LOCK_NAME;

  try {
    const res = await fetchImpl(`${baseUrl}/merge-lock?name=${encodeURIComponent(name)}`, {
      method: "GET",
      signal: AbortSignal.timeout(opts?.timeoutMs ?? DEFAULT_HEALTH_CHECK_TIMEOUT_MS),
    });
    if (!res.ok) return undefined;
    const body: unknown = await res.json();
    if (!isRecord(body) || typeof body.held !== "boolean") return undefined;
    if (body.view !== undefined && !isMergeLockView(body.view)) return undefined;
    return body as unknown as MergeLockStatus;
  } catch {
    return undefined;
  }
}


/** Submit a bounded stream command; every response must complete successfully. */
export function streamCommand(path: "stop", data: Record<string, unknown>, opts?: ClaimNextIdOptions): Promise<StopRecord>;
export function streamCommand(path: "check", data: Record<string, unknown>, opts?: ClaimNextIdOptions): Promise<StreamReport>;
export function streamCommand(path: "claim", data: Record<string, unknown>, opts?: ClaimNextIdOptions): Promise<{ ok: true }>;
export async function streamCommand(path: "stop" | "check" | "claim", data: Record<string, unknown>, opts?: ClaimNextIdOptions): Promise<StopRecord | StreamReport | { ok: true }> {
  const endpoint = path === "stop" ? "/sessions/stop" : `/streams/${path}`;
  const response = await checkedFetch(opts)((opts?.baseUrl ?? resolveDefaultCoordServiceUrl()) + endpoint, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
    signal: AbortSignal.timeout(opts?.timeoutMs ?? 30_000),
  });
  const body: unknown = await response.json();
  if (path === "stop") return parseStoredStop(body);
  if (path === "check") return parseStreamReport(body);
  if (record(body).ok !== true) throw new Error("Invalid stream claim response");
  return { ok: true };
}

/** Submit parsed review facts; repeating an observation never repeats a reserved consumer effect. */
export async function reviewCommand(input: import("../domain/review-values").ReviewCommand, opts?: ClaimNextIdOptions): Promise<import("../domain/reviews").ReviewState> {
 const response = await checkedFetch(opts)((opts?.baseUrl ?? resolveDefaultCoordServiceUrl()) + "/reviews/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(opts?.timeoutMs ?? 100_000) });
 return parseReviewState(await response.json());
}
/** Read recorded review state even when consumer effects are disabled. */
export async function readReviews(ref?: import("../domain/reviews").ReviewRef, opts?: ClaimNextIdOptions): Promise<import("../domain/reviews").ReviewState[]> {
 const query = ref ? "?" + new URLSearchParams({ repository: ref.repository, number: String(ref.number) }) : "";
 const response = await checkedFetch(opts)((opts?.baseUrl ?? resolveDefaultCoordServiceUrl()) + "/reviews" + query, { signal: AbortSignal.timeout(opts?.timeoutMs ?? 3000) });
 const rows: unknown = await response.json(); if (!Array.isArray(rows)) throw new Error("Invalid review state list");
 return rows.map(parseReviewState);
}

/** Request one fresh configured slot observation; the consumer retains launch authorization. */
export async function checkSlots(opts?: ClaimNextIdOptions): Promise<import("../domain/slots").SlotState> {
  const response = await checkedFetch(opts)((opts?.baseUrl ?? resolveDefaultCoordServiceUrl()) + "/slots/check", { method: "POST", headers: { "content-type": "application/json" }, body: "{}", signal: AbortSignal.timeout(opts?.timeoutMs ?? 660_000) });
  return parseSlotState(await response.json());
}
/** Read durable reservations and diagnostics without enabling consumer effects. */
export async function readSlots(opts?: ClaimNextIdOptions): Promise<import("../domain/slots").SlotState[]> {
  const response = await checkedFetch(opts)((opts?.baseUrl ?? resolveDefaultCoordServiceUrl()) + "/slots", { signal: AbortSignal.timeout(opts?.timeoutMs ?? 3000) });
  const rows: unknown = await response.json(); if (!Array.isArray(rows)) throw new Error("Invalid slot state list");
  return rows.map(parseSlotState);
}

/** Request current repair facts; the consumer retains designation and merge guards. */
export async function checkRepairs(opts?: ClaimNextIdOptions): Promise<import("../domain/repairs").RepairState> {
  const response = await checkedFetch(opts)((opts?.baseUrl ?? resolveDefaultCoordServiceUrl()) + "/repairs/check", { method: "POST", signal: AbortSignal.timeout(opts?.timeoutMs ?? 300_000) });
  return parseRepairState(await response.json());
}
/** Inspect durable repair effects without enabling policy writes. */
export async function readRepairs(opts?: ClaimNextIdOptions): Promise<import("../domain/repairs").RepairState[]> {
  const response = await checkedFetch(opts)((opts?.baseUrl ?? resolveDefaultCoordServiceUrl()) + "/repairs", { signal: AbortSignal.timeout(opts?.timeoutMs ?? 3000) });
  const rows: unknown = await response.json(); if (!Array.isArray(rows)) throw new Error("Invalid repair state list"); return rows.map(parseRepairState);
}
