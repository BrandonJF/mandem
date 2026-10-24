/** @fileoverview Fetch handler for the ported coordination routes. */
import type { ReviewStore } from '../application/ports/review-store';
import type { ReviewDispatcher } from '../application/review-dispatch';
import { handleReviewRoutes } from './review-routes';
import type { SessionStore } from '../application/ports/session-store';
import type { MessageStore, Subscriptions } from '../application/ports/message-store';
import type { MergeLockStore } from '../application/ports/merge-lock-store';
import type { PaneQueue, PaneWindow } from '../application/ports/pane-queue';
import type { StreamMonitor } from "../application/stream-monitor";
import { handleStreamRoutes } from "./stream-routes";
import { handleMessageRoutes } from './message-routes';
import { handleSessionRoutes } from './session-routes';
import { handleMergeLockRoutes } from './merge-lock-routes';
export interface CoordServiceHandlerOptions {
 sessionStore?: SessionStore; messageStore?: MessageStore; subscriptions?: Subscriptions;
 reviewStore?: ReviewStore; reviewDispatcher?: ReviewDispatcher;
 streamMonitor?: StreamMonitor; mergeLockStore?: MergeLockStore; paneQueue?: PaneQueue;
 paneReader?: () => Record<string,string>;
}
const WINDOWS = ['agents', 'orchestration', 'services'];
const LOG_PREFIX='coord-service', BEGIN_MARKER='▶', OK_MARKER='✓', FAIL_MARKER='✗';
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function logPaneBegin(action: "launch" | "kill", label?: string): void {
  const labelPart = label ? ` label=${label}` : "";
  console.log(`${LOG_PREFIX}: ${BEGIN_MARKER} POST /panes/${action}${labelPart}…`);
}

function logPaneEnd(
  action: "launch" | "kill",
  outcome:
    | { ok: true; label: string; paneId?: string }
    | { ok: false; label?: string; error: string },
  elapsedMs: number,
): void {
  const marker = outcome.ok ? OK_MARKER : FAIL_MARKER;
  const detail = outcome.ok
    ? `label=${outcome.label}${outcome.paneId ? ` paneId=${outcome.paneId}` : ""}`
    : `FAILED: ${outcome.error}`;
  console.log(`${LOG_PREFIX}: ${marker} POST /panes/${action} ${detail} (${elapsedMs}ms)`);
}


export function createCoordServiceRequestHandler(opts: CoordServiceHandlerOptions = {}): (req: Request) => Promise<Response> {
 return async req => {
  const url = new URL(req.url);
  const requestStart = Date.now();
  if(url.pathname === '/health' && req.method === 'GET') return Response.json({ok:true});
  try {
    if (url.pathname === "/panes/launch" && req.method === "POST") {
      if (!opts?.paneQueue) {
        return Response.json({ error: "pane queue not configured" }, { status: 500 });
      }
      const paneQueue = opts.paneQueue;

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        logPaneEnd("launch", { ok: false, error: "invalid JSON body" }, Date.now() - requestStart);
        return Response.json({ error: "invalid JSON body" }, { status: 400 });
      }

      const window = isRecord(body) && typeof body.window === "string" ? body.window : undefined;
      if (!window || !(WINDOWS as readonly string[]).includes(window)) {
        logPaneEnd(
          "launch",
          { ok: false, error: "missing/invalid 'window' field" },
          Date.now() - requestStart,
        );
        return Response.json({ error: "missing/invalid 'window' field" }, { status: 400 });
      }

      const label = isRecord(body) && typeof body.label === "string" ? body.label : undefined;
      if (!label) {
        logPaneEnd(
          "launch",
          { ok: false, error: "missing required 'label' string field" },
          Date.now() - requestStart,
        );
        return Response.json({ error: "missing required 'label' string field" }, { status: 400 });
      }

      const command = isRecord(body) && typeof body.command === "string" ? body.command : undefined;
      if (!command) {
        logPaneEnd(
          "launch",
          { ok: false, label, error: "missing required 'command' string field" },
          Date.now() - requestStart,
        );
        return Response.json({ error: "missing required 'command' string field" }, { status: 400 });
      }

      const cwd = isRecord(body) && typeof body.cwd === "string" ? body.cwd : undefined;
      const fresh = isRecord(body) && typeof body.fresh === "boolean" ? body.fresh : undefined;
      if (fresh === undefined) {
        logPaneEnd(
          "launch",
          { ok: false, label, error: "missing required 'fresh' boolean field" },
          Date.now() - requestStart,
        );
        return Response.json({ error: "missing required 'fresh' boolean field" }, { status: 400 });
      }

      logPaneBegin("launch", label);
      try {
        const paneId = await paneQueue.launch({
          window: window as PaneWindow,
          label,
          command,
          cwd,
          fresh,
        });
        logPaneEnd("launch", { ok: true, label, paneId }, Date.now() - requestStart);
        return Response.json({ paneId });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logPaneEnd("launch", { ok: false, label, error: message }, Date.now() - requestStart);
        return Response.json({ error: message }, { status: 500 });
      }
    }

    if (url.pathname === "/panes/kill" && req.method === "POST") {
      if (!opts?.paneQueue) {
        return Response.json({ error: "pane queue not configured" }, { status: 500 });
      }
      const paneQueue = opts.paneQueue;

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        logPaneEnd("kill", { ok: false, error: "invalid JSON body" }, Date.now() - requestStart);
        return Response.json({ error: "invalid JSON body" }, { status: 400 });
      }

      const label = isRecord(body) && typeof body.label === "string" ? body.label : undefined;
      if (!label) {
        logPaneEnd(
          "kill",
          { ok: false, error: "missing required 'label' string field" },
          Date.now() - requestStart,
        );
        return Response.json({ error: "missing required 'label' string field" }, { status: 400 });
      }

      logPaneBegin("kill", label);
      try {
        await paneQueue.kill(label);
        logPaneEnd("kill", { ok: true, label }, Date.now() - requestStart);
        return Response.json({ ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logPaneEnd("kill", { ok: false, label, error: message }, Date.now() - requestStart);
        return Response.json({ error: message }, { status: 500 });
      }
    }

    if (url.pathname === "/panes" && req.method === "GET") {
      if (!opts?.paneQueue) {
        return Response.json({ error: "pane queue not configured" }, { status: 500 });
      }
      return Response.json({ panes: opts.paneQueue.snapshot() });
    }

    const reviewResponse = await handleReviewRoutes(req, url, opts.reviewStore, opts.reviewDispatcher);
    if (reviewResponse) return reviewResponse;

    const streamResponse = await handleStreamRoutes(req, url, opts.streamMonitor);
    if (streamResponse) return streamResponse;

    const sessionResponse = await handleSessionRoutes(req, url, {
      sessionStore: opts?.sessionStore,
      paneReader: opts?.paneReader,
    });
    if (sessionResponse) return sessionResponse;

    const messageResponse = await handleMessageRoutes(req, url, {
      messageStore: opts?.messageStore,
      subscriptions: opts?.subscriptions,
    });
    if (messageResponse) return messageResponse;

    const mergeLockResponse = await handleMergeLockRoutes(req, url, {
      mergeLockStore: opts?.mergeLockStore,
    });
    if (mergeLockResponse) return mergeLockResponse;

    return Response.json({ error: "not found" }, { status: 404 });
  } catch(error) { console.error("coord-service: request failed", error); return Response.json({error: "coordination operation failed"}, {status:500}); }
  };
}
