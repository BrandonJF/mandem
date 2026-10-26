/** @fileoverview Inspect durable slot state or request one fresh configured consumer observation. */
import type { SlotStore } from "../application/ports/slot-store";
import type { SlotDispatcher } from "../application/slot-dispatch";
export async function handleSlotRoutes(request: Request, url: URL, store?: SlotStore, dispatcher?: SlotDispatcher): Promise<Response | undefined> {
  if (url.pathname === "/slots" && request.method === "GET") return store ? Response.json(await store.list()) : Response.json({ error: "slot store not configured" }, { status: 503 });
  if (url.pathname !== "/slots/check" || request.method !== "POST") return undefined;
  if (!dispatcher) return Response.json({ error: "slot refill is disabled; configure a consumer explicitly" }, { status: 503 });
  try { return Response.json(await dispatcher.check()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }); }
}
