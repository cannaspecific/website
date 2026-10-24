import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { csvCell, submissionsToCsv } from "./csv";
import type { AdminSubmission } from "@shared/schema";

describe("csv", () => {
  it("quotes commas and neutralizes spreadsheet formulas", () => {
    assert.equal(csvCell('hello, "there"'), '"hello, ""there"""');
    assert.equal(csvCell("=cmd()"), `"'=cmd()"`);
    assert.equal(csvCell(true), '"true"');
    assert.equal(csvCell(null), '""');
  });

  it("writes a header and one data row", () => {
    const row: AdminSubmission = {
      id: "abc",
      source: "submission",
      kind: "waitlist",
      fullName: "Avery Quinn",
      email: "avery@example.com",
      role: "consumer",
      company: null,
      state: "FL",
      phone: null,
      message: "Hello, list",
      subscribeToUpdates: false,
      emailStatus: "skipped",
      emailError: null,
      notifyStatus: "skipped",
      notifyError: null,
      createdAt: "2026-10-24T00:00:00.000Z",
    };
    const csv = submissionsToCsv([row]);
    assert.match(csv, /full_name/);
    assert.match(csv, /avery@example.com/);
    assert.match(csv, /"Hello, list"/);
  });
});
