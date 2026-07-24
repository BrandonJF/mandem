/** @fileoverview Thin Mandem server command presentation root. */
import { runtimeVersion } from "@/modules/runtime";
const argument = Bun.argv[2];
if (argument === "--version") console.log(runtimeVersion("mandem-server"));
else if (argument === "--help" || argument === undefined) console.log("mandem-server: --version | --help");
else { console.error("mandem-server: unknown argument"); process.exitCode = 1; }
