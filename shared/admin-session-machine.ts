import type { AdminSubmission } from "./schema";

/**
 * Admin submissions page: load the list, then optionally export CSV.
 *
 *   idle      --load-->         loading (no rows yet)
 *   loading   --loadSuccess-->  ready
 *   loading   --loadFailure-->  error (keeps any rows already on screen)
 *   ready     --load-->         loading (keeps rows)
 *   ready     --export-->       exporting
 *   exporting --exportSuccess--> ready
 *   exporting --exportFailure--> error (keeps rows)
 *   error     --load-->         loading (keeps rows)
 *   error     --export-->       exporting, only when a list is already loaded
 *
 * A second load or export while one is in flight is ignored. A success or
 * failure event that arrives after the page has moved on is ignored, so a
 * slow response cannot overwrite a newer one.
 */

export type AdminSessionState =
  | { status: "idle" }
  | { status: "loading"; rows: AdminSubmission[] | null }
  | { status: "ready"; rows: AdminSubmission[] }
  | { status: "exporting"; rows: AdminSubmission[] }
  | { status: "error"; message: string; rows: AdminSubmission[] | null };

export type AdminSessionEvent =
  | { type: "load" }
  | { type: "loadSuccess"; rows: AdminSubmission[] }
  | { type: "loadFailure"; message: string }
  | { type: "export" }
  | { type: "exportSuccess" }
  | { type: "exportFailure"; message: string };

export const initialAdminSession: AdminSessionState = { status: "idle" };

export function adminSessionRows(state: AdminSessionState): AdminSubmission[] | null {
  if (state.status === "idle") return null;
  return state.rows;
}

export function adminSessionReducer(state: AdminSessionState, event: AdminSessionEvent): AdminSessionState {
  switch (state.status) {
    case "idle":
      if (event.type === "load") return { status: "loading", rows: null };
      return state;
    case "loading":
      switch (event.type) {
        case "loadSuccess":
          return { status: "ready", rows: event.rows };
        case "loadFailure":
          return { status: "error", message: event.message, rows: state.rows };
        default:
          return state;
      }
    case "ready":
      switch (event.type) {
        case "load":
          return { status: "loading", rows: state.rows };
        case "export":
          return { status: "exporting", rows: state.rows };
        default:
          return state;
      }
    case "exporting":
      switch (event.type) {
        case "exportSuccess":
          return { status: "ready", rows: state.rows };
        case "exportFailure":
          return { status: "error", message: event.message, rows: state.rows };
        default:
          return state;
      }
    case "error":
      switch (event.type) {
        case "load":
          return { status: "loading", rows: state.rows };
        case "export":
          return state.rows !== null ? { status: "exporting", rows: state.rows } : state;
        default:
          return state;
      }
    default:
      return state;
  }
}
