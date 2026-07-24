/** @fileoverview Canonical Bun runtime version preflight. */
import { assertBunVersion } from "@/modules/runtime";
try { assertBunVersion(Bun.version); } catch (error: unknown) { console.error(error instanceof Error ? error.message : "Bun version preflight failed."); process.exitCode = 2; }
