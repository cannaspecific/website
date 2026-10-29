import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { audienceFromHash, hashForAudience, signupEndpoint } from "./signup-audience";

describe("signup audience", () => {
  it("maps the pilot anchor to business mode and the waitlist anchor to individual mode", () => {
    assert.equal(audienceFromHash("#partner"), "business");
    assert.equal(audienceFromHash("#waitlist"), "individual");
    assert.equal(audienceFromHash("#signup"), "individual");
    assert.equal(audienceFromHash("#problem"), null);
    assert.equal(audienceFromHash(""), null);
  });

  it("points each mode at its existing API", () => {
    assert.equal(signupEndpoint("individual"), "/api/waitlist");
    assert.equal(signupEndpoint("business"), "/api/partner");
    assert.equal(hashForAudience("business"), "#partner");
    assert.equal(hashForAudience("individual"), "#waitlist");
  });
});
