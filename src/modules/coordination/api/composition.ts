/** @fileoverview Composition of SQLite, Herdr and the local coordination server. */
import { mkdirSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { openCoordinationStores } from "../infrastructure/sqlite-stores";
import { createSubscriptions } from "../application/ports/message-store";
import { createPaneQueue } from "../application/ports/pane-queue";
import { createCoordServiceRequestHandler } from "../infrastructure/http-handler";
import { parseStreamSession } from "../domain/stream-values";
import { createRepairDispatcher } from "../application/repair-dispatch";
import type { RepairConsumer } from "../application/ports/repair-store";
import { loadRepairConfiguration } from "../infrastructure/repair-command-consumer";
import { createSlotDispatcher } from "../application/slot-dispatch";
import type { SlotConsumer } from "../application/ports/slot-store";
import type { SlotTemplate } from "../domain/slots";
import { loadSlotConfiguration } from "../infrastructure/slot-command-consumer";
import { createReviewDispatcher } from "../application/review-dispatch";
import type { ReviewEffects } from "../application/ports/review-effects";
import type { ReviewPolicy } from "../domain/reviews";
import { loadReviewConfiguration } from "../infrastructure/review-command-effects";
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
  repairConfigPath?: string;
  repairs?: { repository: string; consumer: RepairConsumer };
  slotConfigPath?: string;
  slots?: { repository: string; template: SlotTemplate; consumer: SlotConsumer };
  reviewConfigPath?: string;
  reviews?: { policy: ReviewPolicy; effects: ReviewEffects };
  herdr?: false | { parentPaneId: string; workspaceId: string; run?: (args: string[]) => unknown; runAsync?: (args: string[]) => Promise<unknown> };
}

export function startCoordinationServer(options: CoordinationServerOptions = {}) {
  if (options.reviewConfigPath && options.reviews) throw new Error("Choose a review config file or injected review adapters");
  if (options.slotConfigPath && options.slots) throw new Error("Choose a slot config file or injected slot consumer");
  if (options.repairConfigPath && options.repairs) throw new Error("Choose a repair config file or injected repair consumer");
  const repairOptions = options.repairConfigPath ? loadRepairConfiguration(options.repairConfigPath) : options.repairs;
  const slotOptions = options.slotConfigPath ? loadSlotConfiguration(options.slotConfigPath) : options.slots;
  const reviewOptions = options.reviewConfigPath ? loadReviewConfiguration(options.reviewConfigPath) : options.reviews;
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
  const repairDispatcher = repairOptions ? createRepairDispatcher({ ...repairOptions, store: stores.repairStore, now: options.now }) : undefined;
  const slotDispatcher = slotOptions ? createSlotDispatcher({ ...slotOptions, store: stores.slotStore, now: options.now }) : undefined;
  let slotFailures = 0; let lastSlotError: string | undefined;
  const slotChecks = new Set<Promise<void>>();
  const streamMonitor = createStreamMonitor({ sessions: {
    async list() { return (await stores.sessionStore.list()).map(parseStreamSession); },
    async get(session) { const value = await stores.sessionStore.get(session); return value ? parseStreamSession(value) : undefined; },
  }, store: stores.streamStore, subscriptions, activity: paneIo ? { read: () => paneIo.readActivity() } : undefined, now: options.now, onStop: slotDispatcher ? async () => {
    const check = (async () => { try { await slotDispatcher.check(); } catch (error) { slotFailures++; lastSlotError = error instanceof Error ? error.message : String(error); console.error(`mandem: stop persisted but slot refill failed: ${lastSlotError}`); } })();
    slotChecks.add(check); void check.finally(() => slotChecks.delete(check));
  } : undefined });
  const reviewDispatcher = reviewOptions ? createReviewDispatcher({ store: stores.reviewStore, ...reviewOptions }) : undefined;
  const handler = createCoordServiceRequestHandler({ ...stores, subscriptions, paneQueue, streamMonitor, reviewDispatcher, slotDispatcher, repairDispatcher,
    paneReader: paneQueue ? () => paneQueue.snapshot() : undefined });
  let server: ReturnType<typeof Bun.serve>;
  try {
    server = Bun.serve({ hostname: "127.0.0.1", port, maxRequestBodySize: 64 * 1024,
      fetch: async (request, activeServer) => {
        if (["/slots/check", "/repairs/check"].includes(new URL(request.url).pathname)) activeServer.timeout(request, 0);
        if (new URL(request.url).pathname === "/health" && request.method === "GET") {
          try {
            await stores.sessionStore.list();
            return Response.json({ ok: true, herdr: Boolean(paneIo), wakeFailures, ...(slotDispatcher ? { slotFailures, ...(lastSlotError ? { lastSlotError } : {}) } : {}), ...(lastWakeError ? { lastWakeError } : {}) });
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
      await reviewDispatcher?.drain();
      await Promise.all(slotChecks);
      await slotDispatcher?.drain();
      await repairDispatcher?.drain();
      stores.close();
    },
  };
}
