/** @fileoverview Runtime validation for provider event objects. */

export function eventRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("expected an event object");
  return value as Record<string, unknown>;
}
