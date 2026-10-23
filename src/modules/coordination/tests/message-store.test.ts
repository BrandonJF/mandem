/**
 * @fileoverview Unit tests for `message-store.ts` (issue #1993 — coord-service Phase 4,
 * durable topic-addressed message bus).
 *
 * Covers `append`/`read`/`ack`/`listTopics` against the in-memory fake, and the pure
 * `Subscriptions` in-process fan-out helper (fan-out/filter/unsubscribe).
 *
 * The backlog-filter case deliberately crosses a digit boundary (id "9" -> id "10") per
 * the architecture-reviewer's Finding M1: `sinceId` comparison is NUMERIC, and a fake
 * that accidentally compared ids as strings would sort "10" < "9" — a single-digit-only
 * test would pass under EITHER a correct or a buggy (lexical) comparison, silently
 * diverging from the Postgres adapter's real `id > $1::bigint` behavior.
 */

import { describe, expect, it } from "vitest";
import {
  createInMemoryMessageStore,
  createSubscriptions,
  type PlaneMessage,
} from "../application/ports/message-store";

function baseMsg(overrides: Partial<PlaneMessage> = {}): Omit<PlaneMessage, "id" | "ackedBy"> & {
  id?: string;
  ackedBy?: string[];
} {
  return {
    topic: "issue:1983",
    type: "handoff",
    subject: "context",
    sender: "orch-b",
    ts: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

describe("createInMemoryMessageStore", () => {
  it("append assigns an id + preserves fields", async () => {
    const store = createInMemoryMessageStore();

    const stored = await store.append(baseMsg());

    expect(stored.id).toBeTruthy();
    expect(stored.topic).toBe("issue:1983");
    expect(stored.type).toBe("handoff");
    expect(stored.subject).toBe("context");
    expect(stored.sender).toBe("orch-b");
    expect(stored.ackedBy).toEqual([]);
  });

  it("fills ts when absent", async () => {
    const store = createInMemoryMessageStore();
    const { ts: _omit, ...withoutTs } = baseMsg();
    void _omit;

    const stored = await store.append(withoutTs);

    expect(typeof stored.ts).toBe("string");
    expect(Number.isNaN(Date.parse(stored.ts))).toBe(false);
  });

  it("read(topic) returns that topic's messages id-ascending, filtered by topic", async () => {
    const store = createInMemoryMessageStore();
    await store.append(baseMsg({ topic: "issue:1983", subject: "first" }));
    await store.append(baseMsg({ topic: "events", subject: "noise" }));
    await store.append(baseMsg({ topic: "issue:1983", subject: "second" }));

    const messages = await store.read("issue:1983");

    expect(messages.map((m) => m.subject)).toEqual(["first", "second"]);
    expect(Number(messages[0]!.id)).toBeLessThan(Number(messages[1]!.id));
  });

  it("read(topic, sinceId) is exclusive and NUMERIC — crosses the '9' -> '10' digit boundary", async () => {
    const store = createInMemoryMessageStore();
    // Post 9 unrelated messages to push the monotonic id counter past single digits,
    // then two on the topic under test whose ids straddle "9"/"10".
    for (let i = 0; i < 8; i++) {
      await store.append(baseMsg({ topic: "noise", subject: `noise-${i}` }));
    }
    const ninth = await store.append(baseMsg({ topic: "issue:1983", subject: "ninth" }));
    const tenth = await store.append(baseMsg({ topic: "issue:1983", subject: "tenth" }));

    expect(ninth.id).toBe("9");
    expect(tenth.id).toBe("10");

    const messages = await store.read("issue:1983", "9");

    // A lexical (string) comparison would sort "10" < "9" and wrongly INCLUDE id "9"
    // again or exclude "10" — the correct, numeric behavior returns exactly id "10".
    expect(messages.map((m) => m.id)).toEqual(["10"]);
  });

  it("ack adds the session to ackedBy idempotently", async () => {
    const store = createInMemoryMessageStore();
    const stored = await store.append(baseMsg());

    await store.ack(stored.id, "orch-a");
    await store.ack(stored.id, "orch-a"); // idempotent — no duplicate entry
    await store.ack(stored.id, "orch-c");

    const [message] = await store.read("issue:1983");
    expect(message!.ackedBy.sort()).toEqual(["orch-a", "orch-c"]);
  });

  it("listTopics returns distinct topics", async () => {
    const store = createInMemoryMessageStore();
    await store.append(baseMsg({ topic: "issue:1983" }));
    await store.append(baseMsg({ topic: "events" }));
    await store.append(baseMsg({ topic: "issue:1983" }));

    expect((await store.listTopics()).sort()).toEqual(["events", "issue:1983"]);
  });
});

describe("createSubscriptions", () => {
  it("delivers a published message to a matching-topic listener", () => {
    const subs = createSubscriptions();
    const received: PlaneMessage[] = [];
    subs.subscribe("issue:1983", (m) => received.push(m));

    const message: PlaneMessage = {
      id: "1",
      topic: "issue:1983",
      type: "handoff",
      subject: "context",
      sender: "orch-b",
      ts: "2026-07-16T00:00:00.000Z",
      ackedBy: [],
    };
    subs.publish(message);

    expect(received).toEqual([message]);
  });

  it("skips a non-matching-topic listener", () => {
    const subs = createSubscriptions();
    const received: PlaneMessage[] = [];
    subs.subscribe("other-topic", (m) => received.push(m));

    subs.publish({
      id: "1",
      topic: "issue:1983",
      type: "handoff",
      subject: "context",
      sender: "orch-b",
      ts: "2026-07-16T00:00:00.000Z",
      ackedBy: [],
    });

    expect(received).toEqual([]);
  });

  it("delivers to an undefined-filter listener regardless of topic", () => {
    const subs = createSubscriptions();
    const received: PlaneMessage[] = [];
    subs.subscribe(undefined, (m) => received.push(m));

    subs.publish({
      id: "1",
      topic: "issue:1983",
      type: "handoff",
      subject: "context",
      sender: "orch-b",
      ts: "2026-07-16T00:00:00.000Z",
      ackedBy: [],
    });
    subs.publish({
      id: "2",
      topic: "events",
      type: "needs-harvest.new",
      subject: "1234",
      sender: "coord-service",
      ts: "2026-07-16T00:00:01.000Z",
      ackedBy: [],
    });

    expect(received).toHaveLength(2);
  });

  it("unsubscribe stops further delivery", () => {
    const subs = createSubscriptions();
    const received: PlaneMessage[] = [];
    const unsubscribe = subs.subscribe("issue:1983", (m) => received.push(m));

    unsubscribe();
    subs.publish({
      id: "1",
      topic: "issue:1983",
      type: "handoff",
      subject: "context",
      sender: "orch-b",
      ts: "2026-07-16T00:00:00.000Z",
      ackedBy: [],
    });

    expect(received).toEqual([]);
  });
});
