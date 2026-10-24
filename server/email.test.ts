import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describeMailConfig, resolveMailConfig } from "./email";

describe("mail config", () => {
  it("refuses to send when the API key or from-address is missing or placeholder", () => {
    assert.equal(resolveMailConfig({}).ok, false);
    assert.equal(
      resolveMailConfig({ SENDGRID_API_KEY: "SG.test", SENDGRID_FROM_EMAIL: "" }).ok,
      false,
    );
    const placeholder = resolveMailConfig({
      SENDGRID_API_KEY: "SG.test",
      SENDGRID_FROM_EMAIL: "YOUR_VERIFIED_EMAIL@example.com",
    });
    assert.equal(placeholder.ok, false);
    if (!placeholder.ok) {
      assert.match(placeholder.reason, /authenticated domain/);
    }
  });

  it("accepts a real from-address and defaults the owner inbox", () => {
    const config = resolveMailConfig({
      SENDGRID_API_KEY: "SG.test",
      SENDGRID_FROM_EMAIL: "hello@www.cannaspecific.com",
    });
    assert.equal(config.ok, true);
    if (config.ok) {
      assert.equal(config.from, "hello@www.cannaspecific.com");
      assert.equal(config.notify, "cannaspecific@gmail.com");
    }
    assert.match(
      describeMailConfig({
        SENDGRID_API_KEY: "SG.test",
        SENDGRID_FROM_EMAIL: "hello@www.cannaspecific.com",
        NOTIFY_EMAIL: "owner@cannaspecific.com",
      }),
      /www.cannaspecific.com/,
    );
  });
});
