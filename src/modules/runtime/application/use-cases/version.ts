/** @fileoverview Bounded version result use case. */
import type { RuntimeIdentity } from "../../domain/types";
export function versionResult(identity: RuntimeIdentity): string { return `${identity.executable} ${identity.version}`; }
