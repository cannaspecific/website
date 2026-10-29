import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubmissionKind } from "./requests";
import { submissionSuccessCopy, submissionSuccessMessage } from "./submission-message";

describe("submission success copy", () => {
  it("reassures a saved waitlist signup when the confirmation email did not send", () => {
    const copy = submissionSuccessCopy({ kind: "waitlist", duplicate: false, emailSent: false });
    assert.equal(copy.headline, "You're on the list!");
    assert.equal(copy.detail, "We saved your spot.");
    assert.equal(
      submissionSuccessMessage({ kind: "waitlist", duplicate: false, emailSent: false }),
      "You're on the list! We saved your spot.",
    );
  });

  it("does not mention an email failure for either form when mail did not send", () => {
    const kinds: SubmissionKind[] = ["waitlist", "partner"];
    for (const kind of kinds) {
      for (const duplicate of [false, true]) {
        const copy = submissionSuccessCopy({ kind, duplicate, emailSent: false });
        const text = `${copy.headline} ${copy.detail}`;
        assert.doesNotMatch(text, /could not be sent/i);
        assert.doesNotMatch(text, /email/i);
      }
    }
  });

  it("still mentions a confirmation when mail actually sent", () => {
    const message = submissionSuccessMessage({ kind: "waitlist", duplicate: false, emailSent: true });
    assert.match(message, /confirmation email/);
    const inquiry = submissionSuccessMessage({ kind: "partner", duplicate: false, emailSent: false });
    assert.match(inquiry, /saved your inquiry/i);
    assert.doesNotMatch(inquiry, /could not be sent/i);
  });
});
