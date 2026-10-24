import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { partnerRequestSchema, waitlistRequestSchema } from "./requests";

const waitlist = {
  fullName: "Avery Quinn",
  email: "Avery@Example.com",
  role: "consumer",
  company: "",
  state: "FL",
  message: "",
  subscribeToUpdates: true,
  ageConfirmed: true,
  companyWebsite: "",
};

describe("waitlist validation", () => {
  it("accepts a complete signup and normalizes email", () => {
    const parsed = waitlistRequestSchema.parse(waitlist);
    assert.equal(parsed.email, "avery@example.com");
    assert.equal(parsed.role, "consumer");
    assert.equal(parsed.subscribeToUpdates, true);
  });

  it("rejects a bad email, a short name, and a missing age confirmation", () => {
    const parsed = waitlistRequestSchema.safeParse({
      ...waitlist,
      fullName: "A",
      email: "not-an-email",
      ageConfirmed: false,
      role: "patient",
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const fields = parsed.error.issues.map((issue) => issue.path[0]);
      assert.ok(fields.includes("fullName"));
      assert.ok(fields.includes("email"));
      assert.ok(fields.includes("ageConfirmed"));
      assert.ok(fields.includes("role"));
    }
  });
});

describe("partner validation", () => {
  it("requires a company and a real note", () => {
    const parsed = partnerRequestSchema.safeParse({
      fullName: "Riley Chen",
      email: "riley@dispensary.test",
      role: "dispensary",
      company: "Q",
      state: "",
      message: "too short",
      ageConfirmed: true,
      companyWebsite: "",
    });
    assert.equal(parsed.success, false);
  });

  it("accepts a pilot inquiry", () => {
    const parsed = partnerRequestSchema.parse({
      fullName: "Riley Chen",
      email: "riley@dispensary.test",
      role: "cultivator",
      company: "North Field",
      state: "Florida",
      message: "We want to compare batch certificates across two rooms.",
      ageConfirmed: true,
    });
    assert.equal(parsed.company, "North Field");
    assert.equal(parsed.companyWebsite, "");
  });
});
