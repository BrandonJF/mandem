/** @fileoverview Runtime composition for package entrypoints. */
import { versionResult } from "../application/use-cases/version";
export function runtimeVersion(executable: "mandem" | "mandem-server"): string { return versionResult({ executable, version: "0.1.0" }); }
