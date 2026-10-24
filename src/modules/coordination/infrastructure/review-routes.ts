/** @fileoverview Parse review facts at HTTP boundaries; effects remain disabled without operator configuration. */
import type { ReviewDispatcher } from "../application/review-dispatch";
import type { ReviewStore } from "../application/ports/review-store";
import { parseReviewCommand, parseReviewRef } from "../domain/review-values";
export async function handleReviewRoutes(
  request: Request,
  url: URL,
  store?: ReviewStore,
  dispatcher?: ReviewDispatcher,
): Promise<Response | undefined> {
  if (url.pathname === "/reviews" && request.method === "GET") {
    if (!store)
      return Response.json(
        { error: "review store not configured" },
        { status: 503 },
      );
    const repository = url.searchParams.get("repository");
    const number = url.searchParams.get("number");
    if (repository === null && number === null)
      return Response.json(await store.list());
    if (repository === null || number === null || !/^[1-9]\d*$/.test(number))
      return Response.json(
        { error: "repository and positive number are required together" },
        { status: 400 },
      );
    let ref;
    try {
      ref = parseReviewRef({ repository, number: Number(number) });
    } catch {
      return Response.json(
        { error: "invalid review identity" },
        { status: 400 },
      );
    }
    const state = await store.get(ref);
    return Response.json(state ? [state] : []);
  }
  if (url.pathname !== "/reviews/events" || request.method !== "POST")
    return undefined;
  if (!dispatcher)
    return Response.json(
      {
        error:
          "review effects are disabled; configure consumer adapters explicitly",
      },
      { status: 503 },
    );
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  try {
    return Response.json(await dispatcher.submit(parseReviewCommand(input)));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
