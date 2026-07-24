/** @fileoverview Thin Mandem command-line presentation root. */
import { runtimeVersion } from "@/modules/runtime";
const argument = Bun.argv[2];
if (argument === "--version") console.log(runtimeVersion("mandem"));
else if (argument === "--help" || argument === undefined) console.log("mandem: --version | --help");
else { console.error("mandem: unknown argument"); process.exitCode = 1; }
