/**
 * @fileoverview Unit tests for `merge-lock-store.ts` (issue #2409 — the TTL'd advisory
 * merge-lock's port + in-memory fake). Mirrors `session-store.test.ts`'s port+fake
 * testing posture.
 *
 * The load-bearing cases are: contention (a second holder must NOT acquire while the
 * first holder's lock is still valid) and TTL-expiry-steal (an abandoned lock — the
 * crash-recovery mechanism — must become acquirable again once its TTL elapses).
 */

import { describe, expect, it } from "vitest";
import { createInMemoryMergeLockStore } from "../application/ports/merge-lock-store";

const LOCK_NAME = "merge";
const TTL_SECONDS = 900;

describe("createInMemoryMergeLockStore", () => {
  it("acquires a free lock", async () => {
    const store = createInMemoryMergeLockStore();

    const result = await store.acquire(LOCK_NAME, "holder-a", TTL_SECONDS);

    expect(result.acquired).toBe(true);
    expect(result.view.holder).toBe("holder-a");
    expect(result.view.name).toBe(LOCK_NAME);
    expect(result.view.ttlSeconds).toBe(TTL_SECONDS);
    expect(result.view.expired).toBe(false);
  });

  it("a different holder cannot acquire a still-valid lock — returns the current holder's view", async () => {
    const store = createInMemoryMergeLockStore();
    await store.acquire(LOCK_NAME, "holder-a", TTL_SECONDS);

    const result = await store.acquire(LOCK_NAME, "holder-b", TTL_SECONDS);

    expect(result.acquired).toBe(false);
    expect(result.view.holder).toBe("holder-a");
  });

  it("the SAME holder re-acquiring refreshes the lock (idempotent)", async () => {
    const store = createInMemoryMergeLockStore();
    const now = new Date("2026-07-20T00:00:00.000Z");
    await store.acquire(LOCK_NAME, "holder-a", TTL_SECONDS, now);

    const later = new Date("2026-07-20T00:05:00.000Z");
    const result = await store.acquire(LOCK_NAME, "holder-a", TTL_SECONDS, later);

    expect(result.acquired).toBe(true);
    expect(result.view.holder).toBe("holder-a");
    expect(result.view.acquiredAt).toBe(later.toISOString());
  });

  it("an EXPIRED lock can be stolen by a new holder", async () => {
    const store = createInMemoryMergeLockStore();
    const acquiredAt = new Date("2026-07-20T00:00:00.000Z");
    await store.acquire(LOCK_NAME, "holder-a", 60, acquiredAt);

    const pastExpiry = new Date("2026-07-20T00:02:00.000Z"); // 120s later, TTL was 60s
    const result = await store.acquire(LOCK_NAME, "holder-b", TTL_SECONDS, pastExpiry);

    expect(result.acquired).toBe(true);
    expect(result.view.holder).toBe("holder-b");
  });

  it("a lock still within its TTL is NOT stealable", async () => {
    const store = createInMemoryMergeLockStore();
    const acquiredAt = new Date("2026-07-20T00:00:00.000Z");
    await store.acquire(LOCK_NAME, "holder-a", TTL_SECONDS, acquiredAt);

    const stillValid = new Date("2026-07-20T00:01:00.000Z"); // 60s later, TTL is 900s
    const result = await store.acquire(LOCK_NAME, "holder-b", TTL_SECONDS, stillValid);

    expect(result.acquired).toBe(false);
    expect(result.view.holder).toBe("holder-a");
  });

  it("releases the lock when called by the current holder", async () => {
    const store = createInMemoryMergeLockStore();
    await store.acquire(LOCK_NAME, "holder-a", TTL_SECONDS);

    const result = await store.release(LOCK_NAME, "holder-a");

    expect(result.released).toBe(true);
    expect((await store.status(LOCK_NAME)).held).toBe(false);
  });

  it("releasing by a non-holder is a no-op — the lock is unchanged", async () => {
    const store = createInMemoryMergeLockStore();
    await store.acquire(LOCK_NAME, "holder-a", TTL_SECONDS);

    const result = await store.release(LOCK_NAME, "holder-b");

    expect(result.released).toBe(false);
    const status = await store.status(LOCK_NAME);
    expect(status.held).toBe(true);
    expect(status.view?.holder).toBe("holder-a");
  });

  it("releasing an already-released lock is idempotent (no-op, no throw)", async () => {
    const store = createInMemoryMergeLockStore();
    await store.acquire(LOCK_NAME, "holder-a", TTL_SECONDS);
    await store.release(LOCK_NAME, "holder-a");

    const result = await store.release(LOCK_NAME, "holder-a");

    expect(result.released).toBe(false);
  });

  it("status reports free when no lock has ever been acquired", async () => {
    const store = createInMemoryMergeLockStore();

    const status = await store.status(LOCK_NAME);

    expect(status).toEqual({ held: false });
  });

  it("status reports held with a non-expired view", async () => {
    const store = createInMemoryMergeLockStore();
    const acquiredAt = new Date("2026-07-20T00:00:00.000Z");
    await store.acquire(LOCK_NAME, "holder-a", TTL_SECONDS, acquiredAt);

    const status = await store.status(LOCK_NAME, new Date("2026-07-20T00:01:00.000Z"));

    expect(status.held).toBe(true);
    expect(status.view?.holder).toBe("holder-a");
    expect(status.view?.expired).toBe(false);
    expect(status.view?.expiresAt).toBe(
      new Date(acquiredAt.getTime() + TTL_SECONDS * 1000).toISOString(),
    );
  });

  it("status flags an abandoned (expired) lock as NOT held, but keeps its view for diagnosis", async () => {
    const store = createInMemoryMergeLockStore();
    const acquiredAt = new Date("2026-07-20T00:00:00.000Z");
    await store.acquire(LOCK_NAME, "holder-a", 60, acquiredAt);

    const status = await store.status(LOCK_NAME, new Date("2026-07-20T00:05:00.000Z"));

    expect(status.held).toBe(false);
    expect(status.view?.holder).toBe("holder-a");
    expect(status.view?.expired).toBe(true);
  });
});
