/** @fileoverview Coordination CLI parsing and JSON output for local consumers. */
import { streamCommand, ackMessage, listSessions, postMessage, readMessages, registerSession, resolveDefaultCoordServiceUrl } from "./coord-client";

export const coordinationHelp = `mandem serve [--db PATH] [--port NUMBER]
mandem health
mandem msg send --topic TOPIC --sender SESSION --type TYPE --subject TEXT [--data JSON]
mandem msg inbox --topic TOPIC [--since ID]
mandem msg ack --id ID --session SESSION
mandem session register --session SESSION --role ROLE [--pane HERDR_PANE_ID] [--data JSON] [--stream STREAM --owner-role ROLE]
mandem session list
mandem session stop --id KEY --session SESSION --kind done|blocked|decision-needed [--waiting-on user|coordinator|session:NAME|external --need TEXT]
mandem streams [--idle-minutes N]
mandem stream claim --stream STREAM --session SESSION
mandem stream release --stream STREAM
Environment: MANDEM_COORD_URL, MANDEM_COORD_DB, COORD_SERVICE_PORT`;

export function parseFlags(args: string[], allowed: string[]): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i];
    const value = args[i + 1];
    if (!name?.startsWith("--") || !allowed.includes(name.slice(2)) || value === undefined || value.startsWith("--") || result[name.slice(2)] !== undefined)
      throw new Error(`Invalid option: ${name ?? "missing"}`);
    result[name.slice(2)] = value;
  }
  return result;
}
function required(flags: Record<string, string>, name: string): string {
  const value = flags[name];
  if (!value) throw new Error(`Missing --${name}`);
  return value;
}
function data(flags: Record<string,string>): Record<string,unknown> | undefined {
  if (flags.data === undefined) return undefined;
  const value: unknown = JSON.parse(flags.data);
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("--data must be a JSON object");
  return value as Record<string,unknown>;
}
export async function runCoordinationCommand(args: string[]): Promise<unknown> {
  const [group, action, ...rest] = args;
  if (group === "health" && args.length === 1) {
    const response = await fetch(`${resolveDefaultCoordServiceUrl()}/health`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`Health failed: HTTP ${response.status}`);
    return response.json();
  }
  if (group === "msg" && action === "send") {
    const flags = parseFlags(rest, ["topic", "sender", "type", "subject", "data"]);
    return postMessage({ topic: required(flags,"topic"), sender: required(flags,"sender"), type: required(flags,"type"), subject: required(flags,"subject"), data: data(flags) });
  }
  if (group === "msg" && action === "inbox") {
    const flags = parseFlags(rest, ["topic", "since"]);
    return readMessages(required(flags,"topic"), { since: flags.since });
  }
  if (group === "msg" && action === "ack") {
    const flags = parseFlags(rest, ["id", "session"]);
    await ackMessage(required(flags,"id"), required(flags,"session"));
    return { ok: true };
  }
  if (group === "session" && action === "register") {
    const flags = parseFlags(rest, ["session", "role", "data", "pane", "stream", "owner-role"]);
    if (flags["owner-role"] !== undefined && flags.stream === undefined) throw new Error("--owner-role requires --stream");
    const metadata = { ...data(flags), ...(flags.pane ? { herdrPaneId: flags.pane } : {}), ...(flags.stream !== undefined ? { stream: required(flags, "stream"), ownerRole: flags["owner-role"] ?? "orchestrator" } : {}) };
    await registerSession({ session: required(flags,"session"), role: required(flags,"role"), data: metadata });
    return { ok: true };
  }
  if (group === "session" && action === "stop") {
    const flags = parseFlags(rest, ["id", "session", "kind", "waiting-on", "need"]);
    return streamCommand("stop", { id: required(flags, "id"), session: required(flags, "session"), kind: required(flags, "kind"),
      ...(flags["waiting-on"] !== undefined ? { waiting_on: flags["waiting-on"] } : {}), ...(flags.need !== undefined ? { need: flags.need } : {}) });
  }
  if (group === "streams") {
    const flags = parseFlags(args.slice(1), ["idle-minutes"]);
    return streamCommand("check", { ...(flags["idle-minutes"] !== undefined ? { idleMinutes: Number(flags["idle-minutes"]) } : {}) });
  }
  if (group === "stream" && (action === "claim" || action === "release")) {
    const flags = parseFlags(rest, action === "claim" ? ["stream", "session"] : ["stream"]);
    return streamCommand("claim", { stream: required(flags, "stream"), session: action === "claim" ? required(flags, "session") : null });
  }
  if (group === "session" && action === "list" && rest.length === 0) return { sessions: await listSessions() };
  throw new Error("Unknown command. Run mandem --help");
}
