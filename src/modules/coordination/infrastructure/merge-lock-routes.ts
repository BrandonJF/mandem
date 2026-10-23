/**
 * @fileoverview `/merge-lock/acquire` + `/merge-lock/release` + `/merge-lock` route logic
 * (issue #2409), mirroring `session-routes.ts`'s thin-helper extraction (SRP) — a focused
 * helper returning `undefined` on a non-match so `http-handler.ts` stays a thin dispatcher.
 *
 * See `merge-lock-store.ts`'s file header for the acquire/TTL/contention semantics this
 * surfaces over HTTP.
 */

import type { MergeLockStore } from "../application/ports/merge-lock-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// ── Logging (ADR-0150 bracket convention — mirrors http-handler.ts's own markers;
//    duplicated rather than imported to avoid a http-handler.ts <-> merge-lock-routes.ts
//    import cycle, since http-handler.ts imports this module). ──────────────────────

const LOG_PREFIX = "coord-service";
const BEGIN_MARKER = "▶";
const OK_MARKER = "✓";
const FAIL_MARKER = "✗";

function logAcquireBegin(): void {
  console.log(`${LOG_PREFIX}: ${BEGIN_MARKER} POST /merge-lock/acquire…`);
}

function logAcquireEnd(
  outcome:
    | { ok: true; name: string; holder: string; acquired: boolean }
    | { ok: false; error: string },
  elapsedMs: number,
): void {
  const marker = outcome.ok ? OK_MARKER : FAIL_MARKER;
  const detail = outcome.ok
    ? `name=${outcome.name} holder=${outcome.holder} acquired=${outcome.acquired}`
    : `FAILED: ${outcome.error}`;
  console.log(`${LOG_PREFIX}: ${marker} POST /merge-lock/acquire ${detail} (${elapsedMs}ms)`);
}

function logReleaseBegin(): void {
  console.log(`${LOG_PREFIX}: ${BEGIN_MARKER} POST /merge-lock/release…`);
}

function logReleaseEnd(
  outcome:
    | { ok: true; name: string; holder: string; released: boolean }
    | { ok: false; error: string },
  elapsedMs: number,
): void {
  const marker = outcome.ok ? OK_MARKER : FAIL_MARKER;
  const detail = outcome.ok
    ? `name=${outcome.name} holder=${outcome.holder} released=${outcome.released}`
    : `FAILED: ${outcome.error}`;
  console.log(`${LOG_PREFIX}: ${marker} POST /merge-lock/release ${detail} (${elapsedMs}ms)`);
}

const NOT_CONFIGURED_ERROR = "merge lock not configured";

/** Options `merge-lock-routes.ts` needs from the composition root — a subset of
 *  `CoordServiceHandlerOptions`. */
export interface MergeLockRouteOptions {
  mergeLockStore?: MergeLockStore;
}

/**
 * Handle `POST /merge-lock/acquire`, `POST /merge-lock/release`, and `GET /merge-lock` if
 * `req` matches one. Returns `undefined` for any other path/method so `http-handler.ts`
 * can fall through to its next route (or the final 404).
 */
export async function handleMergeLockRoutes(
  req: Request,
  url: URL,
  opts: MergeLockRouteOptions,
): Promise<Response | undefined> {
  if (url.pathname === "/merge-lock/acquire" && req.method === "POST") {
    const requestStart = Date.now();
    if (!opts.mergeLockStore) {
      return Response.json({ error: NOT_CONFIGURED_ERROR }, { status: 500 });
    }
    logAcquireBegin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      logAcquireEnd({ ok: false, error: "invalid JSON body" }, Date.now() - requestStart);
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const name = isRecord(body) && typeof body.name === "string" ? body.name : undefined;
    if (!name) {
      logAcquireEnd(
        { ok: false, error: "missing required 'name' string field" },
        Date.now() - requestStart,
      );
      return Response.json({ error: "missing required 'name' string field" }, { status: 400 });
    }
    const holder = isRecord(body) && typeof body.holder === "string" ? body.holder : undefined;
    if (!holder) {
      logAcquireEnd(
        { ok: false, error: "missing required 'holder' string field" },
        Date.now() - requestStart,
      );
      return Response.json({ error: "missing required 'holder' string field" }, { status: 400 });
    }
    const ttlSeconds =
      isRecord(body) && typeof body.ttlSeconds === "number" ? body.ttlSeconds : undefined;
    if (ttlSeconds === undefined || !Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
      logAcquireEnd(
        { ok: false, error: "missing required 'ttlSeconds' number field" },
        Date.now() - requestStart,
      );
      return Response.json(
        { error: "missing required 'ttlSeconds' number field" },
        { status: 400 },
      );
    }

    const result = await opts.mergeLockStore.acquire(name, holder, ttlSeconds);
    logAcquireEnd({ ok: true, name, holder, acquired: result.acquired }, Date.now() - requestStart);
    return Response.json(result);
  }

  if (url.pathname === "/merge-lock/release" && req.method === "POST") {
    const requestStart = Date.now();
    if (!opts.mergeLockStore) {
      return Response.json({ error: NOT_CONFIGURED_ERROR }, { status: 500 });
    }
    logReleaseBegin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      logReleaseEnd({ ok: false, error: "invalid JSON body" }, Date.now() - requestStart);
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const name = isRecord(body) && typeof body.name === "string" ? body.name : undefined;
    if (!name) {
      logReleaseEnd(
        { ok: false, error: "missing required 'name' string field" },
        Date.now() - requestStart,
      );
      return Response.json({ error: "missing required 'name' string field" }, { status: 400 });
    }
    const holder = isRecord(body) && typeof body.holder === "string" ? body.holder : undefined;
    if (!holder) {
      logReleaseEnd(
        { ok: false, error: "missing required 'holder' string field" },
        Date.now() - requestStart,
      );
      return Response.json({ error: "missing required 'holder' string field" }, { status: 400 });
    }

    const result = await opts.mergeLockStore.release(name, holder);
    logReleaseEnd({ ok: true, name, holder, released: result.released }, Date.now() - requestStart);
    return Response.json(result);
  }

  if (url.pathname === "/merge-lock" && req.method === "GET") {
    if (!opts.mergeLockStore) {
      return Response.json({ error: NOT_CONFIGURED_ERROR }, { status: 500 });
    }
    const name = url.searchParams.get("name");
    if (!name) {
      return Response.json({ error: "missing required 'name' query param" }, { status: 400 });
    }
    const status = await opts.mergeLockStore.status(name);
    return Response.json(status);
  }

  return undefined;
}
