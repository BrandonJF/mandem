/** @fileoverview Deterministic per-stream stall checks and accountable owner routing. */
import type { SessionRecord } from "../domain/types";
import type { LiveAgent, StopRecord, StreamBinding, StreamReport } from "../domain/streams";
import type { SessionStore } from "./ports/session-store";
import type { Subscriptions } from "./ports/message-store";
import type { StreamActivity, StreamStore } from "./ports/stream-store";

function line(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 512 || /[\r\n]/.test(value)) throw new Error(`${name} must be a nonempty single line of at most 512 characters`);
  return value;
}
export function streamBinding(record: SessionRecord): StreamBinding | undefined {
  if (record.data?.stream === undefined) return undefined;
  return { session: record.session, stream: line(record.data.stream, "stream"), ownerRole: line(record.data.ownerRole ?? "orchestrator", "ownerRole"), assignment: line(record.data.streamAssignment ?? record.ts, "assignment") };
}
export function createStreamMonitor(options: { sessions: SessionStore; store: StreamStore; subscriptions: Subscriptions; activity?: StreamActivity; now?: () => Date }) {
  const now = options.now ?? (() => new Date());
  async function recordStop(input: Record<string, unknown>) {
    const id = line(input.id, "id"); const session = line(input.session, "session");
    const record = await options.sessions.get(session);
    const binding = record && streamBinding(record);
    if (!binding) throw new Error("Register the session with a stream before recording a stop");
    if (!["done", "blocked", "decision-needed"].includes(String(input.kind))) throw new Error("kind must be done, blocked or decision-needed");
    const kind = input.kind as StopRecord["kind"];
    const stop: StopRecord = { ...binding, id, kind, ts: now().toISOString() };
    if (kind === "done") {
      if (input.waiting_on !== undefined || input.need !== undefined) throw new Error("done carries no open need; use blocked or decision-needed");
    } else {
      stop.waiting_on = line(input.waiting_on, "waiting_on"); stop.need = line(input.need, "need");
      if (!["user", "coordinator", "external"].includes(stop.waiting_on) && !/^session:[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(stop.waiting_on)) throw new Error("waiting_on must be user, coordinator, external or session:NAME");
    }
    return options.store.saveStop(stop);
  }
  async function check(idleMinutes = 3): Promise<StreamReport> {
    if (!Number.isFinite(idleMinutes) || idleMinutes < 0 || idleMinutes > 1440) throw new Error("idleMinutes must be between 0 and 1440");
    const date = now(); const checkedAt = date.toISOString();
    const report: StreamReport = { checkedAt, stalled: [], needs: [], claims: [], diagnostics: [] };
    const sessions = await options.sessions.list();
    const bindings = sessions.map(streamBinding).filter((binding): binding is StreamBinding => Boolean(binding));
    const stops = await options.store.listStops();
    let agents: LiveAgent[] = [];
    try {
      if (!options.activity) throw new Error("Herdr activity is unavailable; enable Herdr in the server pane");
      agents = await options.activity.read();
    } catch (error) { report.diagnostics.push(error instanceof Error ? error.message : String(error)); }
    function state(session: SessionRecord): string {
      const pane = session.data?.herdrPaneId;
      const candidates = agents.filter(agent => typeof pane === "string" ? agent.paneId === pane : agent.name === session.session);
      return candidates.length === 1 ? candidates[0]!.state : candidates.length > 1 ? "ambiguous" : "missing";
    }
    function owner(waiting: string, role: string): string | undefined {
      const target = waiting === "user" ? "communicator" : waiting === "coordinator" ? "orchestrator" : role;
      const candidates = waiting.startsWith("session:") ? sessions.filter(row => row.session === waiting.slice(8)) : sessions.filter(row => row.role === target);
      if (candidates.length === 1) return candidates[0]!.session;
      report.diagnostics.push(`Owner ${waiting.startsWith("session:") ? waiting : target} has ${candidates.length} registered sessions; no route selected`);
      return undefined;
    }
    async function route(key: string, binding: StreamBinding, need: string, waiting: string) {
      let delivery = await options.store.delivery(key);
      if (!delivery) {
        const recipient = owner(waiting, binding.ownerRole);
        if (recipient) {
          const result = await options.store.routeOnce(key, recipient, { topic: `session:${recipient}`, sender: "mandem-streams", type: "stream.need", subject: binding.stream, ts: checkedAt,
            data: { stream: binding.stream, session: binding.session, assignment: binding.assignment, need, waiting_on: waiting, routeKey: key } });
          delivery = result;
          if (result.created) options.subscriptions.publish(result.message);
        }
      }
      return delivery ? { owner: delivery.owner, messageId: delivery.message.id, acknowledged: delivery.message.ackedBy.includes(delivery.owner) } : {};
    }
    for (const binding of bindings) {
      const session = sessions.find(row => row.session === binding.session)!;
      const live = state(session);
      if (!["working", "idle", "done"].includes(live)) {
        report.diagnostics.push(`${binding.stream}/${binding.session}: Herdr state ${live}`); continue;
      }
      const observation = await options.store.observe(binding.session, binding.assignment, live, checkedAt);
      const recorded = stops.some(stop => stop.session === binding.session && stop.assignment === binding.assignment && (stop.generation ?? 0) === observation.generation);
      const idleSince = observation.idleSince;
      if (idleSince && !recorded && date.getTime() - Date.parse(idleSince) >= idleMinutes * 60_000) {
        const need = `Session ${binding.session} is ${live} without a typed stop record`;
        report.stalled.push({ ...binding, idleSince, need, ...await route(`stall:${binding.session}:${binding.assignment}:${observation.generation}:${idleSince}`, binding, need, "external") });
      }
    }
    for (const stop of stops) {
      if (stop.kind === "done") continue;
      const routed = await route(`stop:${stop.id}`, stop, stop.need!, stop.waiting_on!);
      if (!routed.acknowledged) report.needs.push({ stream: stop.stream, session: stop.session, need: stop.need!, stopId: stop.id, ...routed });
    }
    for (const claim of await options.store.claims()) {
      const session = sessions.find(row => row.session === claim.session);
      const binding = bindings.find(row => row.session === claim.session);
      const live = session ? state(session) : "unregistered";
      if (binding?.stream !== claim.stream || live !== "working") report.claims.push({ ...claim, state: live, reason: binding?.stream !== claim.stream ? "Claim does not match registered stream" : "Claimed session is not live and working" });
    }
    return report;
  }
  return { recordStop, check, async claim(input: Record<string, unknown>) {
    const stream = line(input.stream, "stream"); const session = input.session === null ? null : line(input.session, "session");
    await options.store.claim(stream, session); return { ok: true };
  } };
}
export type StreamMonitor = ReturnType<typeof createStreamMonitor>;
