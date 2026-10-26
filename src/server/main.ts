/** @fileoverview Thin Mandem server command presentation root. */
import { runtimeVersion } from "@/modules/runtime";
import { parseFlags, startCoordinationServer } from "@/modules/coordination";
const args = Bun.argv.slice(2);
try {
  if (args[0] === "--version") console.log(runtimeVersion("mandem-server"));
  else if (args[0] === "--help" || args.length === 0) console.log("mandem-server: --version | --help | serve [--db PATH] [--port NUMBER] [--review-config PATH] [--slot-config PATH] [--repair-config PATH]");
  else if (args[0] === "serve") {
    const flags = parseFlags(args.slice(1), ["db", "port", "review-config", "slot-config", "repair-config"]);
    const service = startCoordinationServer({ databasePath: flags.db, repairConfigPath: flags["repair-config"], slotConfigPath: flags["slot-config"], reviewConfigPath: flags["review-config"], port: flags.port === undefined ? undefined : Number(flags.port) });
    console.log(`mandem-server: listening on ${service.url}`);
    for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => { void service.stop().then(() => process.exit(0)); });
  } else throw new Error("unknown argument");
} catch (error) { console.error(`mandem-server: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
