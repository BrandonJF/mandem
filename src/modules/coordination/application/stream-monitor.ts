/** @fileoverview Deterministic per-stream stall checks and accountable owner routing. */
import type { DeliveryStatus, LiveAgent, SessionState, StopInput, StreamBinding, StreamReport, StreamSession, StopRecord, WaitingOn } from "../domain/streams";
import { ownerReference } from "../domain/stream-values";
import type { Subscriptions } from "./ports/message-store";
import type { StreamActivity, StreamDirectory, StreamStore } from "./ports/stream-store";

export function createStreamMonitor(options: { sessions: StreamDirectory; store: StreamStore; subscriptions: Subscriptions; activity?: StreamActivity; now?: () => Date; onStop?: (stop: StopRecord) => Promise<void> }) {
  const now = options.now ?? (() => new Date());
  async function recordStop(input: StopInput) {
    const session = await options.sessions.get(input.session);
    if (!session?.binding) throw new Error("Register the session with a stream before recording a stop");
    const stop = await options.store.saveStop({ ...session.binding, ...input, ts: now().toISOString() });
    if (stop.kind === "done" || stop.kind === "blocked") await options.onStop?.(stop);
    return stop;
  }
  async function check(idleMinutes = 3): Promise<StreamReport> {
    if (!Number.isFinite(idleMinutes) || idleMinutes < 0 || idleMinutes > 1440) throw new Error("idleMinutes must be between 0 and 1440");
    const date = now(); const checkedAt = date.toISOString();
    const report: StreamReport = { checkedAt, stalled: [], needs: [], claims: [], diagnostics: [] };
    const sessions = await options.sessions.list();
    const stops = await options.store.listStops();
    let agents: LiveAgent[] = [];
    try {
      if (!options.activity) throw new Error("Herdr activity is unavailable; enable Herdr in the server pane");
      agents = await options.activity.read();
    } catch (error) { report.diagnostics.push(error instanceof Error ? error.message : String(error)); }
    function state(session: StreamSession): SessionState {
      const candidates = agents.filter(agent => session.paneId ? agent.paneId === session.paneId : agent.name === session.session);
      if (candidates.length > 1) return { kind: "ambiguous" };
      const [agent] = candidates;
      if (!agent) return { kind: "missing" };
      if (agent.name && agent.name !== session.session) return { kind: "identity-mismatch" };
      return agent.state;
    }
    function owner(waiting: WaitingOn, binding: StreamBinding): string | undefined {
      const target = ownerReference(waiting, binding.ownerRole);
      const candidates = sessions.filter(row => target.kind === "session" ? row.session === target.session : row.role.name === target.name);
      const [candidate] = candidates;
      if (candidates.length === 1 && candidate) return candidate.session;
      report.diagnostics.push(`Owner ${target.kind === "role" ? target.name : target.session} has ${candidates.length} registered sessions; no route selected`);
      return undefined;
    }
    async function route(key: string, binding: StreamBinding, need: string, waiting: WaitingOn): Promise<DeliveryStatus> {
      let delivery = await options.store.delivery(key);
      if (!delivery) {
        const recipient = owner(waiting, binding);
        if (recipient) {
          const result = await options.store.routeOnce(key, recipient, { topic: `session:${recipient}`, sender: "mandem-streams", type: "stream.need", subject: binding.stream, ts: checkedAt,
            data: { stream: binding.stream, session: binding.session, assignment: binding.assignment, need, waiting_on: waiting, routeKey: key } });
          delivery = result;
          if (result.created) options.subscriptions.publish(result.message);
        }
      }
      return delivery ? { delivery: "routed", owner: delivery.owner, messageId: delivery.message.id, acknowledged: delivery.message.ackedBy.includes(delivery.owner) } : { delivery: "unresolved" };
    }
    for (const session of sessions) {
      const binding = session.binding;
      if (!binding) continue;
      const live = state(session);
      if (live.kind !== "working" && live.kind !== "idle" && live.kind !== "done") {
        report.diagnostics.push(`${binding.stream}/${binding.session}: Herdr state ${live.kind}${live.kind === "unknown" ? ` (${live.raw})` : ""}`); continue;
      }
      const observation = await options.store.observe(binding.session, binding.assignment, live.kind, checkedAt);
      const recorded = stops.some(stop => stop.session === binding.session && stop.assignment === binding.assignment && stop.generation === observation.generation);
      const idleSince = observation.idleSince;
      if (idleSince && !recorded && date.getTime() - Date.parse(idleSince) >= idleMinutes * 60_000) {
        const need = `Session ${binding.session} is ${live.kind} without a typed stop record`;
        report.stalled.push({ source: "idle", stream: binding.stream, session: binding.session, idleSince, need,
          ...await route(`stall:${binding.session}:${binding.assignment}:${observation.generation}:${idleSince}`, binding, need, { kind: "external" }) });
      }
    }
    for (const stop of stops) {
      if (stop.kind === "done") continue;
      const routed = await route(`stop:${stop.id}`, stop, stop.need, stop.waiting_on);
      if (routed.delivery === "unresolved" || !routed.acknowledged) report.needs.push({ source: "stop", stream: stop.stream, session: stop.session, need: stop.need, stopId: stop.id, ...routed });
    }
    for (const claim of await options.store.claims()) {
      const session = sessions.find(row => row.session === claim.session);
      const live: SessionState = session ? state(session) : { kind: "unregistered" };
      if (session?.binding?.stream !== claim.stream || live.kind !== "working") report.claims.push({ ...claim, state: live.kind,
        reason: session?.binding?.stream !== claim.stream ? "Claim does not match registered stream" : "Claimed session is not live and working" });
    }
    return report;
  }
  return { recordStop, check, async claim(input: { stream: string; session: string | null }) {
    await options.store.claim(input.stream, input.session); return { ok: true };
  } };
}
export type StreamMonitor = ReturnType<typeof createStreamMonitor>;
