/** @fileoverview Codex PostToolUse apply-patch event parser. */
import type { ProviderPathEvent } from "./claude-post-tool-use";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("expected an event object");
  return value as Record<string, unknown>;
}

function patchPath(value: string): string {
  const path = value.trim();
  if (path === "") throw new Error("expected a patch path");
  return path;
}

export function parseCodexPostToolUse(input: unknown): readonly ProviderPathEvent[] {
  const event = record(input);
  if (event.hook_event_name !== "PostToolUse" || event.tool_name !== "apply_patch") throw new Error("expected an apply_patch PostToolUse event");
  const command = record(event.tool_input).command;
  if (typeof command !== "string") throw new Error("expected an apply_patch command");
  const events: ProviderPathEvent[] = [];
  for (const match of command.matchAll(/^\*\*\* (Add File|Update File|Delete File|Move to): (.+)$/gm)) {
    const kind = match[1];
    const path = patchPath(match[2] ?? "");
    if (kind === "Add File") events.push({ path, operation: "write" });
    if (kind === "Update File") events.push({ path, operation: "write" });
    if (kind === "Delete File") events.push({ path, operation: "delete" });
    if (kind === "Move to") {
      const previous = events.at(-1);
      if (!previous || previous.operation !== "write") throw new Error("Move to requires a preceding Update File");
      events[events.length - 1] = { path: previous.path, operation: "move-from" };
      events.push({ path, operation: "move-to" });
    }
  }
  if (events.length === 0) throw new Error("apply_patch contains no supported file headers");
  return events;
}
