/** @fileoverview Claude PostToolUse event parser. */

export interface ProviderPathEvent {
  readonly path: string;
  readonly operation: "write" | "delete" | "move-from" | "move-to";
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("expected an event object");
  return value as Record<string, unknown>;
}

function path(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error("expected a file path");
  return value;
}

export function parseClaudePostToolUse(input: unknown): readonly ProviderPathEvent[] {
  const event = record(input);
  if (event.hook_event_name !== "PostToolUse") throw new Error("expected a PostToolUse event");
  const toolInput = record(event.tool_input);
  if (event.tool_name === "Write" || event.tool_name === "Edit") return [{ path: path(toolInput.file_path), operation: "write" }];
  if (event.tool_name !== "MultiEdit" || !Array.isArray(toolInput.edits)) throw new Error("expected Write, Edit, or MultiEdit");
  return toolInput.edits.map((edit) => ({ path: path(record(edit).file_path), operation: "write" }));
}
