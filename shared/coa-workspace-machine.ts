import type { CoaLibraryRecord } from "./coa";

/**
 * Private certificate beta: unlock with the admin token, then read one
 * certificate at a time into a library of at most 24.
 *
 *   closed   --open-->        opening
 *   opening  --openSuccess--> idle
 *   opening  --openFailure--> denied
 *   denied   --open-->        opening
 *   idle     --parse-->       parsing
 *   parsing  --parseSuccess--> idle, with the new record first
 *   parsing  --parseFailure--> error, library unchanged
 *   error    --parse-->       parsing
 *   error    --dismiss-->     idle
 *
 * add and remove edit the library from idle or error. They are ignored while
 * a read is in flight. A second open or parse while one is in flight is ignored.
 * openSuccess and openFailure are ignored unless the state is opening, so a
 * slow token check cannot overwrite a library that is already open.
 */

export const COA_LIBRARY_LIMIT = 24;

type OpenFields = {
  records: CoaLibraryRecord[];
  db: boolean;
  notice: string | null;
};

export type CoaWorkspaceState =
  | { status: "closed" }
  | { status: "opening" }
  | { status: "denied"; message: string }
  | ({ status: "idle" } & OpenFields)
  | ({ status: "parsing" } & OpenFields)
  | ({ status: "error"; message: string } & OpenFields);

export type CoaWorkspaceEvent =
  | { type: "open" }
  | { type: "openSuccess"; records: CoaLibraryRecord[]; db: boolean; notice: string | null }
  | { type: "openFailure"; message: string }
  | { type: "parse" }
  | { type: "parseSuccess"; record: CoaLibraryRecord }
  | { type: "parseFailure"; message: string }
  | { type: "add"; record: CoaLibraryRecord }
  | { type: "remove"; id: string }
  | { type: "dismiss" };

export const initialCoaWorkspace: CoaWorkspaceState = { status: "closed" };

export function coaWorkspaceRecords(state: CoaWorkspaceState): CoaLibraryRecord[] | null {
  if (state.status === "idle" || state.status === "parsing" || state.status === "error") return state.records;
  return null;
}

export function coaWorkspaceReducer(state: CoaWorkspaceState, event: CoaWorkspaceEvent): CoaWorkspaceState {
  switch (state.status) {
    case "closed":
      if (event.type === "open") return { status: "opening" };
      return state;
    case "opening":
      if (event.type === "openSuccess") {
        return {
          status: "idle",
          records: event.records.slice(0, COA_LIBRARY_LIMIT),
          db: event.db,
          notice: event.notice,
        };
      }
      if (event.type === "openFailure") return { status: "denied", message: event.message };
      return state;
    case "denied":
      if (event.type === "open") return { status: "opening" };
      return state;
    case "idle":
      if (event.type === "parse") return { ...state, status: "parsing" };
      if (event.type === "add") return { ...state, records: addRecord(state.records, event.record) };
      if (event.type === "remove") return { ...state, records: state.records.filter((record) => record.id !== event.id) };
      return state;
    case "parsing":
      if (event.type === "parseSuccess") {
        return { ...state, status: "idle", records: addRecord(state.records, event.record) };
      }
      if (event.type === "parseFailure") return { ...state, status: "error", message: event.message };
      return state;
    case "error":
      if (event.type === "parse") return { status: "parsing", records: state.records, db: state.db, notice: state.notice };
      if (event.type === "dismiss") return { status: "idle", records: state.records, db: state.db, notice: state.notice };
      if (event.type === "add") return { ...state, records: addRecord(state.records, event.record) };
      if (event.type === "remove") return { ...state, records: state.records.filter((record) => record.id !== event.id) };
      return state;
  }
}

function addRecord(records: CoaLibraryRecord[], record: CoaLibraryRecord): CoaLibraryRecord[] {
  return [record, ...records.filter((item) => item.id !== record.id)].slice(0, COA_LIBRARY_LIMIT);
}
