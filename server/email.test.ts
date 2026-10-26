import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Submission } from "@shared/schema";
import { DEFAULT_EMAIL_FROM, DEFAULT_NOTIFY, deliverSubmissionEmails, describeMailConfig, resolveMailConfig } from "./email";

const submission = {
  id: "sub-1",
  kind: "waitlist",
  fullName: "Avery Stone",
  email: "avery@example.com",
  role: "consumer",
  company: null,
  state: "FL",
  message: "Curious about the chemistry.",
  subscribeToUpdates: true,
  ageConfirmed: true,
  emailStatus: "pending",
  emailError: null,
  notifyStatus: "pending",
  notifyError: null,
  createdAt: new Date("2026-10-26T00:00:00Z"),
} satisfies Submission;

describe("mail config", () => {
  it("skips when neither Resend nor SendGrid is configured", () => {
    const config = resolveMailConfig({});
    assert.equal(config.ok, false);
    if (!config.ok) {
      assert.match(config.reason, /RESEND_API_KEY is not set and SENDGRID_API_KEY is not set/);
    }
  });

  it("prefers Resend and uses the default from-address and owner inbox", () => {
    const config = resolveMailConfig({ RESEND_API_KEY: "re_test" });
    assert.equal(config.ok, true);
    if (config.ok) {
      assert.equal(config.provider, "resend");
      assert.equal(config.from, DEFAULT_EMAIL_FROM);
      assert.equal(config.notify, DEFAULT_NOTIFY);
    }
    assert.match(describeMailConfig({ RESEND_API_KEY: "re_test" }), /via Resend/);
  });

  it("honors EMAIL_FROM and NOTIFY_EMAIL, and ignores SendGrid when Resend is set", () => {
    const env = {
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Canna Lab <hello@cannaspecific.com>",
      NOTIFY_EMAIL: "owner@cannaspecific.com",
      SENDGRID_API_KEY: "SG.test",
      SENDGRID_FROM_EMAIL: "hello@www.cannaspecific.com",
    };
    const config = resolveMailConfig(env);
    assert.equal(config.ok, true);
    if (config.ok) {
      assert.equal(config.provider, "resend");
      assert.equal(config.from, "Canna Lab <hello@cannaspecific.com>");
      assert.equal(config.notify, "owner@cannaspecific.com");
    }
    assert.match(describeMailConfig(env), /will not be used/);
  });

  it("does not fall back to SendGrid when EMAIL_FROM is unusable", () => {
    const config = resolveMailConfig({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "YOUR_VERIFIED_EMAIL@example.com",
      SENDGRID_API_KEY: "SG.test",
      SENDGRID_FROM_EMAIL: "hello@www.cannaspecific.com",
    });
    assert.equal(config.ok, false);
    if (!config.ok) assert.match(config.reason, /EMAIL_FROM/);
  });

  it("treats a blank EMAIL_FROM as the default", () => {
    const config = resolveMailConfig({ RESEND_API_KEY: "re_test", EMAIL_FROM: "   " });
    assert.equal(config.ok, true);
    if (config.ok) assert.equal(config.from, DEFAULT_EMAIL_FROM);
  });

  it("keeps SendGrid as the fallback when Resend is unset", () => {
    assert.equal(resolveMailConfig({ SENDGRID_API_KEY: "SG.test", SENDGRID_FROM_EMAIL: "" }).ok, false);
    const placeholder = resolveMailConfig({
      SENDGRID_API_KEY: "SG.test",
      SENDGRID_FROM_EMAIL: "YOUR_VERIFIED_EMAIL@example.com",
    });
    assert.equal(placeholder.ok, false);
    if (!placeholder.ok) assert.match(placeholder.reason, /authenticated domain/);

    const config = resolveMailConfig({
      SENDGRID_API_KEY: "SG.test",
      SENDGRID_FROM_EMAIL: "hello@www.cannaspecific.com",
    });
    assert.equal(config.ok, true);
    if (config.ok) {
      assert.equal(config.provider, "sendgrid");
      assert.equal(config.from, "hello@www.cannaspecific.com");
      assert.equal(config.notify, "cannaspecific@gmail.com");
    }
    assert.match(
      describeMailConfig({
        SENDGRID_API_KEY: "SG.test",
        SENDGRID_FROM_EMAIL: "hello@www.cannaspecific.com",
        NOTIFY_EMAIL: "owner@cannaspecific.com",
      }),
      /via SendGrid[\s\S]*www\.cannaspecific\.com/,
    );
  });
});

describe("resend delivery", () => {
  it("posts the confirmation and the owner notice with reply-to", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init: init ?? {} });
      return new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
    };

    const result = await deliverSubmissionEmails(
      submission,
      {},
      { RESEND_API_KEY: "re_test_key" },
      fetchImpl,
    );

    assert.equal(result.confirmation.status, "sent");
    assert.equal(result.notification.status, "sent");
    assert.equal(calls.length, 2);
    assert.deepEqual(
      calls.map((call) => call.url),
      ["https://api.resend.com/emails", "https://api.resend.com/emails"],
    );

    const bodies = calls.map((call) => JSON.parse(String(call.init.body)) as {
      from: string;
      to: string[];
      reply_to: string;
    });
    assert.equal(bodies[0].from, DEFAULT_EMAIL_FROM);
    assert.deepEqual(bodies[0].to, ["avery@example.com"]);
    assert.equal(bodies[0].reply_to, DEFAULT_NOTIFY);
    assert.deepEqual(bodies[1].to, [DEFAULT_NOTIFY]);
    assert.equal(bodies[1].reply_to, DEFAULT_NOTIFY);
    for (const call of calls) {
      const headers = call.init.headers as Record<string, string>;
      assert.equal(headers.Authorization, "Bearer re_test_key");
      assert.equal(headers["Content-Type"], "application/json");
    }
  });

  it("records a provider failure and does not throw or leak the key", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ message: "Maximum credits exceeded", name: "re_test_key" }), {
        status: 403,
      });

    const result = await deliverSubmissionEmails(
      submission,
      {},
      { RESEND_API_KEY: "re_test_key", EMAIL_FROM: "hello@cannaspecific.com", NOTIFY_EMAIL: "owner@cannaspecific.com" },
      fetchImpl,
    );

    assert.equal(result.confirmation.status, "failed");
    assert.equal(result.notification.status, "failed");
    assert.match(result.confirmation.error ?? "", /Resend 403/);
    assert.match(result.confirmation.error ?? "", /Maximum credits exceeded/);
    assert.equal((result.confirmation.error ?? "").includes("re_test_key"), false);
    assert.equal((result.notification.error ?? "").includes("re_test_key"), false);
  });

  it("records skipped when no provider is configured", async () => {
    let called = false;
    const fetchImpl: typeof fetch = async () => {
      called = true;
      return new Response("nope", { status: 500 });
    };
    const result = await deliverSubmissionEmails(submission, {}, {}, fetchImpl);
    assert.equal(called, false);
    assert.equal(result.confirmation.status, "skipped");
    assert.equal(result.notification.status, "skipped");
    assert.match(result.confirmation.error ?? "", /RESEND_API_KEY is not set/);
  });
});
