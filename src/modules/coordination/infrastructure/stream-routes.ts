/** @fileoverview Typed stop, stream check and staffing claim HTTP commands. */
import { parseClaimCommand, parseStopInput, record } from "../domain/stream-values";
import type { StreamMonitor } from "../application/stream-monitor";
export async function handleStreamRoutes(req: Request, url: URL, monitor?: StreamMonitor): Promise<Response | undefined> {
  if (req.method !== "POST" || !["/sessions/stop", "/streams/check", "/streams/claim"].includes(url.pathname)) return undefined;
  if (!monitor) return Response.json({ error: "stream monitor not configured" }, { status: 503 });
  let body: unknown;
  try { body = await req.json(); } catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }
  if (body === null || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "command must be an object" }, { status: 400 });
  const input = record(body);
  try {
    if (url.pathname === "/sessions/stop") return Response.json(await monitor.recordStop(parseStopInput(input)));
    if (url.pathname === "/streams/claim") return Response.json(await monitor.claim(parseClaimCommand(input)));
    const idleMinutes = input.idleMinutes;
    if (idleMinutes !== undefined && typeof idleMinutes !== "number") return Response.json({ error: "idleMinutes must be a number" }, { status: 400 });
    return Response.json(await monitor.check(idleMinutes));
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }); }
}
