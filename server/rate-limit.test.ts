import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRateLimiter } from "./rate-limit";

describe("rate limiter", () => {
  it("allows a burst and then blocks until the window passes", () => {
    const limiter = createRateLimiter({ windowMs: 1_000, max: 2 });
    assert.equal(limiter.check("1.2.3.4", 0).ok, true);
    assert.equal(limiter.check("1.2.3.4", 10).ok, true);
    const blocked = limiter.check("1.2.3.4", 20);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.ok(blocked.retryAfterSec >= 1);
    assert.equal(limiter.check("5.6.7.8", 20).ok, true);
    assert.equal(limiter.check("1.2.3.4", 1_100).ok, true);
  });
});
