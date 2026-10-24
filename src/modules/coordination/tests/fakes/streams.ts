/** @fileoverview Explicit stream fixtures for testing application decisions without infrastructure. */
import type { StreamDirectory, StreamStore } from "../../application/ports/stream-store";
import type { LiveAgent, StaffingClaim, StopRecord, StreamDelivery, StreamObservation, StreamSession } from "../../domain/streams";
import { parseLiveAgent, parseMessage, parseStoredStop, parseStreamSession } from "../../domain/stream-values";
import { createSubscriptions } from "../../application/ports/message-store";
import { createStreamMonitor } from "../../application/stream-monitor";

export function streamFixture() {
  let activityFailure = false;
  const time = "2026-10-23T00:10:00Z";
  const sessions: StreamSession[] = [];
  const agents: LiveAgent[] = [];
  const stops: StopRecord[] = [];
  const claims: StaffingClaim[] = [];
  const observations = new Map<string, StreamObservation>();
  const deliveries = new Map<string, StreamDelivery>();
  const store: StreamStore = {
    async saveStop() { throw new Error("Seed typed stops explicitly; persistence belongs to SQLite contract tests"); },
    async listStops() { return stops; },
    async observe(session, assignment, state) { return observations.get(session) ?? { assignment, state, generation: 0, stopBoundary: false }; },
    async claim(stream, session) { const index = claims.findIndex(claim => claim.stream === stream); if (index >= 0) claims.splice(index, 1); if (session !== null) claims.push({ stream, session }); },
    async claims() { return claims; },
    async delivery(key) { return deliveries.get(key); },
    async routeOnce(key, owner, input) {
      const existing = deliveries.get(key); if (existing) return { ...existing, created: false };
      const delivery: StreamDelivery = { version: 1, owner, message: parseMessage({ ...input, id: String(deliveries.size + 1), ackedBy: [] }) };
      deliveries.set(key, delivery); return { ...delivery, created: true };
    },
  };
  const directory: StreamDirectory = { async list() { return sessions; }, async get(id) { return sessions.find(session => session.session === id); } };
  const monitor = createStreamMonitor({ sessions: directory, store, subscriptions: createSubscriptions(), now: () => new Date(time), activity: { async read() { if (activityFailure) throw new Error("Herdr unavailable"); return agents; } } });
  function addSession(session: string, role = "engineer", stream?: string, state = "working") {
    const parsed = parseStreamSession({ session, role, data: { herdrPaneId: `w1:p-${session}`, ...(stream ? { stream, ownerRole: "orchestrator", streamAssignment: `run-${session}` } : {}) } });
    sessions.push(parsed); agents.push(parseLiveAgent({ name: session, paneId: `w1:p-${session}`, state }));
    return parsed;
  }
  function addStop(input: unknown) { const stop = parseStoredStop(input); stops.push(stop); return stop; }
  return { failActivity() { activityFailure = true; }, time, sessions, agents, stops, claims, observations, deliveries, store, monitor, addSession, addStop };
}
