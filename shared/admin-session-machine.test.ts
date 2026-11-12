import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AdminSubmission } from "./schema";
import {
  adminSessionReducer,
  adminSessionRows,
  initialAdminSession,
} from "./admin-session-machine";

function row(id: string): AdminSubmission {
  return {
    id,
    source: "submission",
    kind: "waitlist",
    fullName: "Avery Stone",
    email: "avery@example.com",
    role: "consumer",
    company: null,
    state: "FL",
    phone: null,
    message: null,
    subscribeToUpdates: false,
    emailStatus: "skipped",
    emailError: null,
    notifyStatus: "skipped",
    notifyError: null,
    createdAt: "2026-11-12T00:00:00.000Z",
  };
}

describe("admin session machine", () => {
  it("starts idle, with no list to show", () => {
    assert.equal(initialAdminSession.status, "idle");
    assert.equal(adminSessionRows(initialAdminSession), null);
  });

  it("loads into a ready list, including an empty one", () => {
    const loading = adminSessionReducer(initialAdminSession, { type: "load" });
    assert.deepEqual(loading, { status: "loading", rows: null });
    assert.equal(adminSessionRows(loading), null);

    const ready = adminSessionReducer(loading, { type: "loadSuccess", rows: [] });
    assert.deepEqual(ready, { status: "ready", rows: [] });
    assert.deepEqual(adminSessionRows(ready), []);
  });

  it("records a first-load failure without inventing an empty list", () => {
    const loading = adminSessionReducer(initialAdminSession, { type: "load" });
    const error = adminSessionReducer(loading, { type: "loadFailure", message: "Unauthorized." });
    assert.deepEqual(error, { status: "error", message: "Unauthorized.", rows: null });
    assert.equal(adminSessionRows(error), null);
    assert.equal(adminSessionReducer(error, { type: "export" }), error);
  });

  it("keeps the current list when a refresh fails", () => {
    const rows = [row("1")];
    const ready = adminSessionReducer(
      adminSessionReducer(initialAdminSession, { type: "load" }),
      { type: "loadSuccess", rows },
    );
    const refreshing = adminSessionReducer(ready, { type: "load" });
    assert.deepEqual(refreshing, { status: "loading", rows });
    const error = adminSessionReducer(refreshing, { type: "loadFailure", message: "Could not reach the server." });
    assert.deepEqual(error, { status: "error", message: "Could not reach the server.", rows });
    const retried = adminSessionReducer(error, { type: "load" });
    assert.deepEqual(retried, { status: "loading", rows });
  });

  it("exports from a loaded list and returns to that list", () => {
    const rows = [row("1")];
    const ready = { status: "ready" as const, rows };
    const exporting = adminSessionReducer(ready, { type: "export" });
    assert.deepEqual(exporting, { status: "exporting", rows });
    assert.deepEqual(adminSessionReducer(exporting, { type: "exportSuccess" }), ready);
  });

  it("keeps the list when export fails, including after an empty load", () => {
    const rows = [row("1")];
    const failed = adminSessionReducer(
      { status: "exporting", rows },
      { type: "exportFailure", message: "Could not export CSV." },
    );
    assert.deepEqual(failed, { status: "error", message: "Could not export CSV.", rows });
    assert.deepEqual(adminSessionReducer(failed, { type: "export" }), { status: "exporting", rows });

    const emptyError = adminSessionReducer(
      { status: "exporting", rows: [] },
      { type: "exportFailure", message: "Could not export CSV." },
    );
    assert.equal(emptyError.status, "error");
    if (emptyError.status === "error") assert.deepEqual(emptyError.rows, []);
    assert.equal(adminSessionReducer(emptyError, { type: "export" }).status, "exporting");
  });

  it("ignores overlapping loads, exports, and stale responses", () => {
    const rows = [row("1")];
    const loading = adminSessionReducer({ status: "ready", rows }, { type: "load" });
    assert.equal(adminSessionReducer(loading, { type: "load" }), loading);
    assert.equal(adminSessionReducer(loading, { type: "export" }), loading);

    const exporting = adminSessionReducer({ status: "ready", rows }, { type: "export" });
    assert.equal(adminSessionReducer(exporting, { type: "load" }), exporting);
    assert.equal(adminSessionReducer(exporting, { type: "export" }), exporting);

    const ready = { status: "ready" as const, rows };
    assert.equal(adminSessionReducer(ready, { type: "loadSuccess", rows: [] }), ready);
    assert.equal(adminSessionReducer(ready, { type: "loadFailure", message: "late" }), ready);
    assert.equal(adminSessionReducer(ready, { type: "exportSuccess" }), ready);
    assert.equal(adminSessionReducer(initialAdminSession, { type: "loadSuccess", rows }), initialAdminSession);
    assert.equal(
      adminSessionReducer(initialAdminSession, { type: "exportFailure", message: "nope" }),
      initialAdminSession,
    );
  });
});
