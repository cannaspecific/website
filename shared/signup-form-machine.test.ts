import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  initialSignupFormState,
  signupFormReducer,
  signupSubmitLabel,
  type SignupFormState,
  type SignupSubmission,
} from "./signup-form-machine";

function saved(audience: SignupSubmission["audience"], duplicate = false): SignupSubmission {
  return {
    audience,
    duplicate,
    emailSent: !duplicate,
    message: "saved",
  };
}

describe("signup form machine", () => {
  it("starts in editing for the given audience", () => {
    const state = initialSignupFormState("individual");
    assert.deepEqual(state, { status: "editing", audience: "individual" });
    assert.equal(signupSubmitLabel(state), "Join the list");
    assert.equal(signupSubmitLabel({ status: "editing", audience: "business" }), "Send the inquiry");
  });

  it("moves editing → submitting → success, then reset returns to editing", () => {
    const editing = initialSignupFormState("business");
    const submitting = signupFormReducer(editing, { type: "submit" });
    assert.equal(submitting.status, "submitting");
    assert.equal(signupSubmitLabel(submitting), "Saving…");

    const result = saved("business");
    const success = signupFormReducer(submitting, { type: "succeed", audience: "business", result });
    assert.deepEqual(success, { status: "success", audience: "business", result });

    const again = signupFormReducer(success, { type: "reset" });
    assert.deepEqual(again, { status: "editing", audience: "business" });
  });

  it("moves submitting → error and allows another submit", () => {
    const submitting = signupFormReducer(initialSignupFormState("individual"), { type: "submit" });
    const error = signupFormReducer(submitting, {
      type: "fail",
      audience: "individual",
      message: "We couldn't save your request.",
    });
    assert.deepEqual(error, {
      status: "error",
      audience: "individual",
      message: "We couldn't save your request.",
    });
    const retry = signupFormReducer(error, { type: "submit" });
    assert.deepEqual(retry, { status: "submitting", audience: "individual" });
  });

  it("ignores audience changes, a second submit, and reset while submitting", () => {
    const submitting = signupFormReducer(initialSignupFormState("individual"), { type: "submit" });
    assert.equal(
      signupFormReducer(submitting, { type: "selectAudience", audience: "business" }),
      submitting,
    );
    assert.equal(signupFormReducer(submitting, { type: "submit" }), submitting);
    assert.equal(signupFormReducer(submitting, { type: "reset" }), submitting);
  });

  it("applies the audience carried by succeed or fail when the request settles", () => {
    const submitting = signupFormReducer(initialSignupFormState("individual"), { type: "submit" });
    const result = saved("individual");
    const success = signupFormReducer(submitting, { type: "succeed", audience: "business", result });
    assert.equal(success.status, "success");
    if (success.status === "success") {
      assert.equal(success.audience, "business");
      assert.equal(success.result.audience, "individual");
    }
    const failed = signupFormReducer(submitting, {
      type: "fail",
      audience: "business",
      message: "down",
    });
    assert.deepEqual(failed, { status: "error", audience: "business", message: "down" });
  });

  it("clears a server error when the audience changes and keeps it when the audience does not", () => {
    const error = signupFormReducer(
      signupFormReducer(initialSignupFormState("individual"), { type: "submit" }),
      { type: "fail", audience: "individual", message: "down" },
    );
    assert.equal(signupFormReducer(error, { type: "selectAudience", audience: "individual" }), error);
    assert.deepEqual(signupFormReducer(error, { type: "selectAudience", audience: "business" }), {
      status: "editing",
      audience: "business",
    });
  });

  it("keeps the confirmation up while the next form's audience changes", () => {
    const result = saved("individual");
    const success = signupFormReducer(
      signupFormReducer(initialSignupFormState("individual"), { type: "submit" }),
      { type: "succeed", audience: "individual", result },
    );
    const switched = signupFormReducer(success, { type: "selectAudience", audience: "business" });
    assert.equal(switched.status, "success");
    if (switched.status === "success") {
      assert.equal(switched.audience, "business");
      assert.equal(switched.result, result);
    }
    assert.deepEqual(signupFormReducer(switched, { type: "reset" }), {
      status: "editing",
      audience: "business",
    });
  });

  it("ignores events that do not belong to the current state", () => {
    const editing = initialSignupFormState("individual");
    const ignored: SignupFormState[] = [
      signupFormReducer(editing, { type: "succeed", audience: "individual", result: saved("individual") }),
      signupFormReducer(editing, { type: "fail", audience: "individual", message: "nope" }),
      signupFormReducer(editing, { type: "reset" }),
    ];
    for (const state of ignored) assert.equal(state, editing);
  });
});
