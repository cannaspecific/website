import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeDeliveryUpdate,
  needsDelivery,
  nextDeliveryRecord,
  readDeliveryStatus,
  recordedOutcome,
} from "./delivery-status";

describe("delivery status machine", () => {
  it("reads known statuses and treats anything else as pending", () => {
    assert.equal(readDeliveryStatus("sent"), "sent");
    assert.equal(readDeliveryStatus("failed"), "failed");
    assert.equal(readDeliveryStatus("skipped"), "skipped");
    assert.equal(readDeliveryStatus("pending"), "pending");
    assert.equal(readDeliveryStatus(null), "pending");
    assert.equal(readDeliveryStatus("SENT"), "pending");
    assert.equal(recordedOutcome("pending"), "failed");
    assert.equal(recordedOutcome("sent"), "sent");
  });

  it("sends again only when the stored status is not sent", () => {
    assert.equal(needsDelivery("pending"), true);
    assert.equal(needsDelivery("failed"), true);
    assert.equal(needsDelivery("skipped"), true);
    assert.equal(needsDelivery(null), true);
    assert.equal(needsDelivery("sent"), false);
  });

  it("moves pending, failed, and skipped to the attempt outcome", () => {
    assert.deepEqual(
      nextDeliveryRecord(
        { status: "pending", error: null },
        { attempted: true, outcome: "skipped", error: "no provider" },
      ),
      { status: "skipped", error: "no provider" },
    );
    assert.deepEqual(
      nextDeliveryRecord(
        { status: "failed", error: "old" },
        { attempted: true, outcome: "sent", error: "ignored" },
      ),
      { status: "sent", error: null },
    );
    assert.deepEqual(
      nextDeliveryRecord(
        { status: "skipped", error: "no provider" },
        { attempted: true, outcome: "failed", error: "Resend 403" },
      ),
      { status: "failed", error: "Resend 403" },
    );
  });

  it("keeps pending when the channel is not attempted", () => {
    assert.deepEqual(
      nextDeliveryRecord({ status: "pending", error: null }, { attempted: false }),
      { status: "pending", error: null },
    );
    assert.deepEqual(
      nextDeliveryRecord({ status: "failed", error: "old" }, { attempted: false }),
      { status: "failed", error: "old" },
    );
  });

  it("does not let a later attempt downgrade sent", () => {
    const sent = { status: "sent", error: null };
    assert.deepEqual(
      nextDeliveryRecord(sent, { attempted: true, outcome: "failed", error: "late" }),
      sent,
    );
    assert.deepEqual(nextDeliveryRecord(sent, { attempted: false }), sent);
    assert.deepEqual(
      mergeDeliveryUpdate(sent, { status: "failed", error: "late" }),
      sent,
    );
    assert.deepEqual(
      mergeDeliveryUpdate({ status: "sent", error: "kept" }, { status: "skipped", error: "new" }),
      { status: "sent", error: "kept" },
    );
  });

  it("treats a pending proposal as leave-it-alone and still applies a real outcome", () => {
    assert.deepEqual(
      mergeDeliveryUpdate({ status: "failed", error: "old" }, { status: "pending", error: null }),
      { status: "failed", error: "old" },
    );
    assert.deepEqual(
      mergeDeliveryUpdate({ status: "pending", error: null }, { status: "sent", error: "nope" }),
      { status: "sent", error: null },
    );
  });
});
