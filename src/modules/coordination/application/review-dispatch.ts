/** @fileoverview Execute reserved review commands through consumer ports and retain uncertain outcomes. */
import type { ReviewEffects } from "./ports/review-effects";
import type { ReviewStore } from "./ports/review-store";
import type { ReviewCommand } from "../domain/review-values";
import { parseReviewerSession } from "../domain/review-values";
import type {
  ReviewEvent,
  ReviewPolicy,
  ReviewRef,
  ReviewState,
} from "../domain/reviews";
import { transitionReview } from "../domain/review-policy";
export function createReviewDispatcher(options: {
  store: ReviewStore;
  policy: ReviewPolicy;
  effects: ReviewEffects;
}) {
  const pending = new Set<Promise<ReviewState>>();
  async function perform(command: ReviewCommand): Promise<ReviewState> {
    const transition = await options.store.transition(command.ref, (state) =>
      transitionReview(state, command.event, options.policy),
    );
    const queue = [...transition.actions];
    while (queue.length) {
      const action = queue.shift();
      if (!action) break;
      let completed: ReviewEvent;
      try {
        if (action.kind === "launch")
          completed = {
            kind: "launched",
            runId: action.task.id,
            session: parseReviewerSession(
              await options.effects.launch(action.task),
            ),
          };
        else {
          if (action.kind === "readiness")
            await options.effects.readiness(action);
          else await options.effects.findings(action);
          completed = { kind: "effect-complete", effectId: action.id };
        }
        const result = await options.store.transition(command.ref, (state) =>
          transitionReview(state, completed, options.policy),
        );
        queue.push(...result.actions);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        const event: ReviewEvent =
          action.kind === "launch"
            ? { kind: "launch-uncertain", runId: action.task.id, reason }
            : { kind: "effect-uncertain", effectId: action.id, reason };
        const result = await options.store.transition(command.ref, (state) =>
          transitionReview(state, event, options.policy),
        );
        queue.push(...result.actions);
      }
    }
    const state = await options.store.get(command.ref);
    if (!state) throw new Error("Review state disappeared after dispatch");
    return state;
  }
  async function submit(command: ReviewCommand): Promise<ReviewState> {
    const operation = perform(command);
    pending.add(operation);
    try {
      return await operation;
    } finally {
      pending.delete(operation);
    }
  }
  return {
    submit,
    async drain() {
      await Promise.allSettled([...pending]);
    },
    async get(ref: ReviewRef) {
      return options.store.get(ref);
    },
    async list() {
      return options.store.list();
    },
  };
}
export type ReviewDispatcher = ReturnType<typeof createReviewDispatcher>;
