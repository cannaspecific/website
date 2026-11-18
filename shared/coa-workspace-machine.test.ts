import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCoaText, type CoaLibraryRecord } from "./coa";
import {
  COA_LIBRARY_LIMIT,
  coaWorkspaceRecords,
  coaWorkspaceReducer,
  initialCoaWorkspace,
} from "./coa-workspace-machine";

const parsed = parseCoaText("too short to be a certificate");

function record(id: string, serverId: string | null = null): CoaLibraryRecord {
  return { id, serverId, parsed };
}

describe("coa workspace machine", () => {
  it("starts closed, with nothing to compare", () => {
    assert.equal(initialCoaWorkspace.status, "closed");
    assert.equal(coaWorkspaceRecords(initialCoaWorkspace), null);
    assert.equal(coaWorkspaceReducer(initialCoaWorkspace, { type: "parse" }), initialCoaWorkspace);
  });

  it("opens into a library, including an empty one when the database is off", () => {
    const opening = coaWorkspaceReducer(initialCoaWorkspace, { type: "open" });
    assert.equal(opening.status, "opening");
    assert.equal(coaWorkspaceReducer(opening, { type: "open" }), opening);
    const idle = coaWorkspaceReducer(opening, {
      type: "openSuccess",
      records: [],
      db: false,
      notice: "This tab only.",
    });
    assert.deepEqual(idle, { status: "idle", records: [], db: false, notice: "This tab only." });
    assert.deepEqual(coaWorkspaceRecords(idle), []);
  });

  it("returns to the token form when the token is rejected, and ignores a late success", () => {
    const opening = coaWorkspaceReducer(initialCoaWorkspace, { type: "open" });
    const denied = coaWorkspaceReducer(opening, { type: "openFailure", message: "Unauthorized." });
    assert.deepEqual(denied, { status: "denied", message: "Unauthorized." });
    assert.equal(coaWorkspaceReducer(denied, {
      type: "openSuccess",
      records: [record("late")],
      db: true,
      notice: null,
    }), denied);
    assert.equal(coaWorkspaceReducer(denied, { type: "open" }).status, "opening");
  });

  it("reads one certificate at a time and keeps the library when the read fails", () => {
    const idle = coaWorkspaceReducer(
      coaWorkspaceReducer(initialCoaWorkspace, { type: "open" }),
      { type: "openSuccess", records: [record("kept")], db: true, notice: null },
    );
    const parsing = coaWorkspaceReducer(idle, { type: "parse" });
    assert.equal(parsing.status, "parsing");
    assert.equal(coaWorkspaceReducer(parsing, { type: "parse" }), parsing);
    assert.equal(coaWorkspaceReducer(parsing, { type: "add", record: record("nope") }), parsing);
    const failed = coaWorkspaceReducer(parsing, { type: "parseFailure", message: "Could not read it." });
    assert.deepEqual(failed, {
      status: "error",
      message: "Could not read it.",
      records: [record("kept")],
      db: true,
      notice: null,
    });
    const again = coaWorkspaceReducer(failed, { type: "parse" });
    assert.equal(again.status, "parsing");
    const done = coaWorkspaceReducer(again, { type: "parseSuccess", record: record("new") });
    assert.equal(done.status, "idle");
    if (done.status === "idle") assert.deepEqual(done.records.map((item) => item.id), ["new", "kept"]);
    assert.equal(coaWorkspaceReducer(done, { type: "parseSuccess", record: record("late") }), done);
  });

  it("adds and removes outside of a read, and caps the library", () => {
    let state = coaWorkspaceReducer(
      coaWorkspaceReducer(initialCoaWorkspace, { type: "open" }),
      { type: "openSuccess", records: [], db: true, notice: null },
    );
    for (let index = 0; index < COA_LIBRARY_LIMIT + 2; index += 1) {
      state = coaWorkspaceReducer(state, { type: "add", record: record(`r${index}`) });
    }
    assert.equal(state.status, "idle");
    if (state.status !== "idle") return;
    assert.equal(state.records.length, COA_LIBRARY_LIMIT);
    assert.equal(state.records[0]?.id, `r${COA_LIBRARY_LIMIT + 1}`);
    const removed = coaWorkspaceReducer(state, { type: "remove", id: state.records[0].id });
    if (removed.status === "idle") assert.equal(removed.records.some((item) => item.id === state.records[0]?.id), false);
    const error = coaWorkspaceReducer(
      coaWorkspaceReducer(state, { type: "parse" }),
      { type: "parseFailure", message: "No." },
    );
    const dismissed = coaWorkspaceReducer(error, { type: "dismiss" });
    assert.equal(dismissed.status, "idle");
    assert.equal(coaWorkspaceReducer(dismissed, { type: "dismiss" }), dismissed);
  });
});
