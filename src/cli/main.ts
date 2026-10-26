/** @fileoverview Thin Mandem command-line presentation root. */
import { runtimeVersion } from "@/modules/runtime";
import { coordinationHelp, parseFlags, runCoordinationCommand, startCoordinationServer } from "@/modules/coordination";

const args = Bun.argv.slice(2);
try {
  if (args[0] === "--version") console.log(runtimeVersion("mandem"));
  else if (args[0] === "--help" || args.length === 0) console.log(`mandem: --version | --help\n${coordinationHelp}`);
  else if (args[0] === "serve") {
    const flags = parseFlags(args.slice(1), ["db", "port", "review-config", "slot-config", "repair-config"]);
    const service = startCoordinationServer({ databasePath: flags.db, repairConfigPath: flags["repair-config"], slotConfigPath: flags["slot-config"], reviewConfigPath: flags["review-config"], port: flags.port === undefined ? undefined : Number(flags.port) });
    console.log(`mandem: coordination service listening on ${service.url}`);
    for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => { void service.stop().then(() => process.exit(0)); });
  } else console.log(JSON.stringify(await runCoordinationCommand(args)));
} catch (error) {
  console.error(`mandem: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
