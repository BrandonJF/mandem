/**
 * @fileoverview `POST /sessions/register` + `GET /sessions` route logic (issue #2114),
 * extracted from `http-handler.ts` per the architecture-reviewer's Finding M3 (SRP / fat
 * route god-function) — a focused helper returning `undefined` on a non-match so the main
 * handler stays a thin dispatcher.
 *
 * `GET /sessions` performs the **best-effort advisory pane join**: for each
 * `SessionRecord`, if a `paneReader` is configured and it maps this session's id to a live
 * pane, the response carries `pane: { paneId }`. This is how a tracked agent's pane
 * `label` (== its session id, the co-design convention with #2075) shows its live
 * binding — an untracked manual session (e.g. `orch-b`) simply has no `pane` key.
 * Injected, never imported, so this registry does NOT hard-depend on #2075's pane
 * authority being built.
 */

import { randomUUID } from "node:crypto";
import { parseStreamSession } from "../domain/stream-values";
import type { SessionRecord, SessionStore } from "../application/ports/session-store";

/** A `SessionRecord` advisorily enriched with its live pane binding, when known. */
export type EnrichedSessionRecord = SessionRecord & { pane?: { paneId: string } };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// ── Logging (ADR-0150 bracket convention — mirrors http-handler.ts's own markers;
//    duplicated rather than imported to avoid a http-handler.ts <-> session-routes.ts
//    import cycle, since http-handler.ts imports this module). ──────────────────────

const LOG_PREFIX = "coord-service";
const BEGIN_MARKER = "▶";
const OK_MARKER = "✓";
const FAIL_MARKER = "✗";

function logRegisterBegin(): void {
  console.log(`${LOG_PREFIX}: ${BEGIN_MARKER} POST /sessions/register…`);
}

function logRegisterEnd(
  outcome: { ok: true; session: string } | { ok: false; error: string },
  elapsedMs: number,
): void {
  const marker = outcome.ok ? OK_MARKER : FAIL_MARKER;
  const detail = outcome.ok ? `session=${outcome.session}` : `FAILED: ${outcome.error}`;
  console.log(`${LOG_PREFIX}: ${marker} POST /sessions/register ${detail} (${elapsedMs}ms)`);
}

/** Options `session-routes.ts` needs from the composition root — a subset of
 *  `CoordServiceHandlerOptions`. */
export interface SessionRouteOptions {
  sessionStore?: SessionStore;
  /** Best-effort reader of the live pane map — a flat `{ label -> paneId }` string map
   *  (exactly #2075's `GET /panes` / `.agent-panes.json` shape). */
  paneReader?: () => Record<string, string>;
}

function enrich(
  records: SessionRecord[],
  paneReader?: () => Record<string, string>,
): EnrichedSessionRecord[] {
  if (!paneReader) return records;
  let paneMap: Record<string, string>;
  try { paneMap = paneReader(); }
  catch (error) {
    console.error("mandem: optional Herdr session enrichment failed", error);
    return records;
  }
  return records.map((record) => {
    const paneId = paneMap[record.session];
    return paneId !== undefined ? { ...record, pane: { paneId } } : record;
  });
}

/**
 * Handle `POST /sessions/register` and `GET /sessions` if `req` matches either route.
 * Returns `undefined` for any other path/method so `http-handler.ts` can fall through to
 * its next route (or the final 404).
 */
export async function handleSessionRoutes(
  req: Request,
  url: URL,
  opts: SessionRouteOptions,
): Promise<Response | undefined> {
  if (url.pathname === "/sessions/register" && req.method === "POST") {
    const requestStart = Date.now();
    if (!opts.sessionStore) {
      return Response.json({ error: "session registry not configured" }, { status: 500 });
    }
    logRegisterBegin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      logRegisterEnd({ ok: false, error: "invalid JSON body" }, Date.now() - requestStart);
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const session = isRecord(body) && typeof body.session === "string" ? body.session : undefined;
    if (!session) {
      logRegisterEnd(
        { ok: false, error: "missing required 'session' string field" },
        Date.now() - requestStart,
      );
      return Response.json({ error: "missing required 'session' string field" }, { status: 400 });
    }
    const role = isRecord(body) && typeof body.role === "string" ? body.role : undefined;
    if (!role) {
      logRegisterEnd(
        { ok: false, error: "missing required 'role' string field" },
        Date.now() - requestStart,
      );
      return Response.json({ error: "missing required 'role' string field" }, { status: 400 });
    }
    const data =
      isRecord(body) && isRecord(body.data) ? (body.data as Record<string, unknown>) : undefined;

    if (data?.stream !== undefined) {
      try {
        data.streamAssignment = randomUUID();
        parseStreamSession({ session, role, data });
      } catch (error) { return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }); }
    }
    await opts.sessionStore.register({ session, role, ...(data ? { data } : {}) });
    logRegisterEnd({ ok: true, session }, Date.now() - requestStart);
    return Response.json({ ok: true });
  }

  if (url.pathname === "/sessions" && req.method === "GET") {
    if (!opts.sessionStore) {
      return Response.json({ error: "session registry not configured" }, { status: 500 });
    }
    const records = await opts.sessionStore.list();
    return Response.json({ sessions: enrich(records, opts.paneReader) });
  }

  return undefined;
}
