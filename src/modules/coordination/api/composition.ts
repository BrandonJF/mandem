/** @fileoverview Composition of SQLite, Herdr and the local coordination server. */
import { mkdirSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { openCoordinationStores } from "../infrastructure/sqlite-stores";
import { createSubscriptions } from "../application/ports/message-store";
import { createPaneQueue } from "../application/ports/pane-queue";
import { createCoordServiceRequestHandler } from "../infrastructure/http-handler";
import { createStreamMonitor } from "../application/stream-monitor";
import { createHerdrPaneIo } from "../infrastructure/herdr-pane";
export { openCoordinationStores };
export * from "../infrastructure/coord-client";

export function defaultDatabasePath(): string {
  return process.env.MANDEM_COORD_DB ?? join(process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"), "mandem", "coordination.sqlite");
}

export interface CoordinationServerOptions {
  databasePath?: string;
  port?: number;
  now?: () => Date;
  herdr?: false | { parentPaneId: string; workspaceId: string; run?: (args: string[]) => unknown; runAsync?: (args: string[]) => Promise<unknown> };
}

export function startCoordinationServer(options: CoordinationServerOptions = {}) {
  const databasePath = options.databasePath ?? defaultDatabasePath();
  const port = options.port ?? Number(process.env.COORD_SERVICE_PORT ?? 8991);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Port must be an integer between 0 and 65535");
  mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
  const stores = openCoordinationStores(databasePath);
  chmodSync(databasePath, 0o600);
  const subscriptions = createSubscriptions();
  const herdrOptions = options.herdr === false ? undefined : options.herdr ?? (
    process.env.HERDR_ENV === "1" && process.env.HERDR_PANE_ID && process.env.HERDR_WORKSPACE_ID
      ? { parentPaneId: process.env.HERDR_PANE_ID, workspaceId: process.env.HERDR_WORKSPACE_ID } : undefined);
  const paneIo = herdrOptions ? createHerdrPaneIo(herdrOptions) : undefined;
  const paneQueue = paneIo ? createPaneQueue(paneIo) : undefined;
  let wakeFailures = 0;
  let lastWakeError: string | undefined;
  const wakes = new Set<Promise<void>>();
  subscriptions.subscribe(undefined, message => {
    if (!paneIo || !message.topic.startsWith("session:")) return;
    const session = message.topic.slice("session:".length);
    const wake = (async () => {
      // Let Bun return the persisted message ID before attempting advisory delivery.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      try {
        const registered = await stores.sessionStore.get(session);
        const paneId = registered?.data?.herdrPaneId ?? (await paneIo.readMapAsync())[session];
        if (typeof paneId === "string") await paneIo.wake(paneId, message.topic, message.id);
        else if (message.type === "stream.need") throw new Error("Stream owner has no registered or owned Herdr pane; register --pane before relying on wakes");
      } catch (error) {
        wakeFailures++;
        lastWakeError = `Message ${message.id} for ${session}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`mandem: Herdr wake failed; message remains in inbox. ${lastWakeError}`);
      }
    })();
    wakes.add(wake);
    void wake.finally(() => wakes.delete(wake));
  });
  const streamMonitor = createStreamMonitor({ sessions: stores.sessionStore, store: stores.streamStore, subscriptions, activity: paneIo ? { read: () => paneIo.readActivity() } : undefined, now: options.now });
  const handler = createCoordServiceRequestHandler({ ...stores, subscriptions, paneQueue, streamMonitor,
    paneReader: paneQueue ? () => paneQueue.snapshot() : undefined });
  let server: ReturnType<typeof Bun.serve>;
  try {
    server = Bun.serve({ hostname: "127.0.0.1", port, maxRequestBodySize: 64 * 1024,
      fetch: async request => {
        if (new URL(request.url).pathname === "/health" && request.method === "GET") {
          try {
            await stores.sessionStore.list();
            return Response.json({ ok: true, herdr: Boolean(paneIo), wakeFailures, ...(lastWakeError ? { lastWakeError } : {}) });
          } catch { return Response.json({ ok: false, error: "SQLite unavailable" }, { status: 503 }); }
        }
        return handler(request);
      },
    });
  } catch (error) { stores.close(); throw error; }
  return {
    url: server.url.toString().replace(/\/$/, ""),
    async stop() {
      await server.stop(true);
      await Promise.all(wakes);
      stores.close();
    },
  };
}
