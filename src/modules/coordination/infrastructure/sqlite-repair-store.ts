/** @fileoverview Atomic repository-scoped repair designation reservations and restoration. */
import type { Database } from "bun:sqlite";
import type { RepairStore } from "../application/ports/repair-store";
import type { RepairEvent, RepairTransition } from "../domain/repairs";
import { emptyRepairState, transitionRepair } from "../domain/repair-policy";
import { parseRepairState } from "../domain/repair-values";
import { slotRepository } from "../domain/slot-values";
export function createSqliteRepairStore(db: Database): RepairStore {
  db.exec("CREATE TABLE IF NOT EXISTS repair_states (repository TEXT PRIMARY KEY, payload TEXT NOT NULL)");
  function read(repository: string) {
    const row = db.query<{ payload: string }, [string]>("SELECT payload FROM repair_states WHERE repository=?").get(repository);
    if (!row) return undefined; const state = parseRepairState(JSON.parse(row.payload));
    if (state.repository !== repository) throw new Error("Repair row repository changed"); return state;
  }
  const apply = db.transaction((repository: string, event: RepairEvent): RepairTransition => {
    const result = transitionRepair(read(repository) ?? emptyRepairState(repository), event); const state = parseRepairState(result.state);
    if (state.repository !== repository) throw new Error("Repair transition changed repository");
    db.query("INSERT INTO repair_states(repository,payload) VALUES (?,?) ON CONFLICT(repository) DO UPDATE SET payload=excluded.payload").run(repository, JSON.stringify(state));
    return { state, actions: result.actions };
  });
  return { async get(repository) { return read(slotRepository(repository)); }, async list() {
    return db.query<{ payload: string }, []>("SELECT payload FROM repair_states ORDER BY repository").all().map(row => parseRepairState(JSON.parse(row.payload)));
  }, async transition(repository, event) { return apply.immediate(slotRepository(repository), event); } };
}
