/**
 * @fileoverview The durable, topic-addressed message bus port (issue #1993 — coord-service
 * Phase 4). A `PlaneMessage` is the ONE primitive behind two usages: a **plane event**
 * (posted to the `events` topic — `type: "needs-harvest.new"`, `"report.complete"`, …)
 * and a **handoff message** (posted to an addressable topic like `session:orch-b` or
 * `issue:1983`). Same schema, same store, same SSE (`Subscriptions` below).
 *
 * Addressing is by TOPIC, never by tmux pane id — the root fix for the #1983
 * sibling-session incident, where the only path was raw `tmux send-keys` against a
 * guessed pane id, left no durable record, and silently failed once. A sender posts to a
 * topic; any live session subscribed to it (or reading its backlog) receives it, with no
 * knowledge of the receiver's pane or even its existence.
 *
 * **The live-session registry (`session-store.ts`, issue #2114) is a SEPARATE, dedicated
 * construct — NOT a reserved topic on this log.** An earlier design folded session
 * registration onto a reserved `__sessions__` topic here; that was superseded (co-design
 * decision, #2077) precisely because it let unbounded-append growth and firehose noise
 * (Findings L1/L2) leak into this durable action-log. This module has no session-registry
 * concept at all.
 *
 * Mirrors `id-counter-store.ts`'s port+fake+atomicity discipline: `id`/`ts` are
 * server-assigned; the Postgres adapter (`message-store-postgres.server.ts`) gets ack's
 * idempotent read-receipt via a single atomic statement, never read-modify-write.
 */

/** A durable, topic-addressed, sender-attributed plane message. No field names any runtime. */
import type { PlaneMessage } from '../../domain/types';
export type { PlaneMessage } from '../../domain/types';

/** Persistence port. Postgres adapter (.server.ts) + in-memory fake both implement it. */
export interface MessageStore {
  /** Persist a message (assigning id + ts if absent); returns the stored message. */
  append(
    msg: Omit<PlaneMessage, "id" | "ackedBy" | "ts"> & { ts?: string; id?: string; ackedBy?: string[] },
  ): Promise<PlaneMessage>;
  /** Durable backlog for a topic, id-ascending, NUMERICALLY optionally filtered to ids
   *  strictly greater than `sinceId` (exclusive — see file header + M1 test). */
  read(topic: string, sinceId?: string): Promise<PlaneMessage[]>;
  /** Record a read-receipt (idempotent — acking twice by the same session is a no-op). */
  ack(id: string, session: string): Promise<void>;
  /** Distinct topics that currently have at least one message (discovery). */
  listTopics(): Promise<string[]>;
}

/** In-process live fan-out for SSE subscribers (separate from the durable store above —
 *  this is ephemeral, process-lifetime pub/sub, never persisted). */
export interface Subscriptions {
  /** Deliver a message to every subscriber whose topic filter matches (undefined filter = all). */
  publish(message: PlaneMessage): void;
  /** Register a listener for `topic` (or all topics when undefined); returns unsubscribe. */
  subscribe(topic: string | undefined, listener: (m: PlaneMessage) => void): () => void;
}

/**
 * The in-memory `MessageStore` test fake. A single monotonic counter (never reset)
 * assigns `id`s across ALL topics — `read` filters by topic and compares `sinceId`
 * numerically, so per-topic pages stay ascending even though ids are not contiguous
 * within a single topic (mirrors the Postgres adapter's global `BIGSERIAL`).
 */
export function createInMemoryMessageStore(): MessageStore {
  const messages: PlaneMessage[] = [];
  let nextId = 1;

  return {
    async append(
      msg: Omit<PlaneMessage, "id" | "ackedBy" | "ts"> & { ts?: string; id?: string; ackedBy?: string[] },
    ): Promise<PlaneMessage> {
      const stored: PlaneMessage = {
        id: msg.id ?? String(nextId++),
        topic: msg.topic,
        type: msg.type,
        subject: msg.subject,
        sender: msg.sender,
        ts: msg.ts ?? new Date().toISOString(),
        ...(msg.data !== undefined ? { data: msg.data } : {}),
        ackedBy: msg.ackedBy ?? [],
      };
      messages.push(stored);
      return stored;
    },

    async read(topic: string, sinceId?: string): Promise<PlaneMessage[]> {
      const sinceIdNum = sinceId !== undefined ? Number(sinceId) : undefined;
      return messages
        .filter((m) => m.topic === topic)
        .filter((m) => sinceIdNum === undefined || Number(m.id) > sinceIdNum)
        .sort((a, b) => Number(a.id) - Number(b.id));
    },

    async ack(id: string, session: string): Promise<void> {
      const message = messages.find((m) => m.id === id);
      if (!message) return;
      if (!message.ackedBy.includes(session)) message.ackedBy.push(session);
    },

    async listTopics(): Promise<string[]> {
      return Array.from(new Set(messages.map((m) => m.topic)));
    },
  };
}

/** Build a process-lifetime {@link Subscriptions} instance — a singleton for the
 *  coord-service process (built once at the composition root, never per-request). */
export function createSubscriptions(): Subscriptions {
  const listeners = new Map<string | undefined, Set<(m: PlaneMessage) => void>>();

  return {
    publish(message: PlaneMessage): void {
      for (const [topic, set] of listeners) {
        if (topic === undefined || topic === message.topic) {
          for (const listener of set) listener(message);
        }
      }
    },

    subscribe(topic: string | undefined, listener: (m: PlaneMessage) => void): () => void {
      let set = listeners.get(topic);
      if (!set) {
        set = new Set();
        listeners.set(topic, set);
      }
      set.add(listener);
      return () => {
        set?.delete(listener);
      };
    },
  };
}
