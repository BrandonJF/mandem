/** @fileoverview Inspect durable repair effects or request fresh configured facts without caller policy. */
import type { RepairDispatcher } from "../application/repair-dispatch";
import type { RepairStore } from "../application/ports/repair-store";
export async function handleRepairRoutes(request: Request, url: URL, store?: RepairStore, dispatcher?: RepairDispatcher): Promise<Response | undefined> {
  if (url.pathname === "/repairs" && request.method === "GET") return store ? Response.json(await store.list()) : Response.json({ error: "repair store not configured" }, { status: 503 });
  if (url.pathname !== "/repairs/check" || request.method !== "POST") return undefined;
  if (!dispatcher) return Response.json({ error: "repair designation is disabled; configure a consumer explicitly" }, { status: 503 });
  try { return Response.json(await dispatcher.check()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }); }
}
