import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminAuthorized, readProvidedAdminToken, tokensMatch } from "./admin-auth";

describe("admin token", () => {
  it("matches equal tokens and rejects lookalikes", () => {
    assert.equal(tokensMatch("correct-token", "correct-token"), true);
    assert.equal(tokensMatch("correct-token", "correct-tokem"), false);
    assert.equal(tokensMatch("short", "correct-token"), false);
  });

  it("reads the header or a bearer token", () => {
    assert.equal(readProvidedAdminToken("abc", undefined), "abc");
    assert.equal(readProvidedAdminToken(undefined, "Bearer secret-token"), "secret-token");
    assert.equal(readProvidedAdminToken("  ", "bearer secret-token"), "secret-token");
  });

  it("distinguishes a missing server token from a bad client token", () => {
    assert.equal(adminAuthorized("anything", ""), "disabled");
    assert.equal(adminAuthorized("", "expected"), "unauthorized");
    assert.equal(adminAuthorized("expected", "expected"), "ok");
  });
});
