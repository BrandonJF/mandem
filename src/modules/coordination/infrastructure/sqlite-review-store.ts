/** @fileoverview SQLite review reservations and reviewer registry records in one immediate transaction. */
import type { Database } from "bun:sqlite";
import type { ReviewStore } from "../application/ports/review-store";
import type {
  ReviewRef,
  ReviewState,
  ReviewTransition,
} from "../domain/reviews";
import { emptyReviewState, reviewRefKey } from "../domain/review-policy";
import { parseReviewState } from "../domain/review-values";
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function sameSession(payload: string, session: string, runId: string): boolean {
  const value: unknown = JSON.parse(payload);
  return (
    record(value) &&
    value.session === session &&
    value.role === "reviewer" &&
    record(value.data) &&
    record(value.data.reviewDispatch) &&
    value.data.reviewDispatch.version === 1 &&
    value.data.reviewDispatch.runId === runId
  );
}
export function createSqliteReviewStore(db: Database): ReviewStore {
  db.exec(
    "CREATE TABLE IF NOT EXISTS review_states (key TEXT PRIMARY KEY, payload TEXT NOT NULL)",
  );
  const read = (ref: ReviewRef): ReviewState | undefined => {
    const row = db
      .query<{ payload: string }, [string]>(
        "SELECT payload FROM review_states WHERE key=?",
      )
      .get(reviewRefKey(ref));
    if (!row) return undefined;
    const state = parseReviewState(JSON.parse(row.payload));
    if (reviewRefKey(state.ref) !== reviewRefKey(ref))
      throw new Error("Review row belongs to another PR");
    return state;
  };
  const apply = db.transaction(
    (
      ref: ReviewRef,
      reduce: (state: ReviewState) => ReviewTransition,
    ): ReviewTransition => {
      const result = reduce(read(ref) ?? emptyReviewState(ref));
      const state = parseReviewState(result.state);
      if (reviewRefKey(state.ref) !== reviewRefKey(ref))
        throw new Error("Review transition changed PR identity");
      for (const run of state.runs) {
        if (run.phase.kind !== "running" && run.phase.kind !== "reviewed")
          continue;
        const session = run.phase.session;
        const prior = db
          .query<{ payload: string }, [string]>(
            "SELECT payload FROM sessions WHERE session=?",
          )
          .get(session.session);
        if (prior && !sameSession(prior.payload, session.session, run.task.id))
          throw new Error("Reviewer session already belongs to another task");
        if (!prior) {
          const target = run.task.target;
          const registered = {
            session: session.session,
            role: "reviewer",
            ts: new Date().toISOString(),
            data: {
              ...(session.paneId ? { herdrPaneId: session.paneId } : {}),
              reviewDispatch: {
                version: 1,
                runId: run.task.id,
                repository: target.ref.repository,
                number: target.ref.number,
                head: target.head,
                patchId: target.patch.id,
                mode: run.task.mode.kind,
                template: run.task.template,
              },
            },
          };
          db.query("INSERT INTO sessions(session,payload) VALUES (?,?)").run(
            session.session,
            JSON.stringify(registered),
          );
        }
      }
      db.query(
        "INSERT INTO review_states(key,payload) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload",
      ).run(reviewRefKey(ref), JSON.stringify(state));
      return { state, actions: result.actions };
    },
  );
  return {
    async get(ref) {
      return read(ref);
    },
    async list() {
      return db
        .query<{ payload: string }, []>(
          "SELECT payload FROM review_states ORDER BY key",
        )
        .all()
        .map((row) => parseReviewState(JSON.parse(row.payload)));
    },
    async transition(ref, reduce) {
      return apply.immediate(ref, reduce);
    },
  };
}
