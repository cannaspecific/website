import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://canna:canna@127.0.0.1:5432/cannaspecific";
process.env.DATABASE_SSL = "disable";
process.env.NODE_ENV = "test";
process.env.ADMIN_TOKEN = "test-admin-token";
delete process.env.SENDGRID_API_KEY;
delete process.env.SENDGRID_FROM_EMAIL;

const { initDb, closeDb, getSql } = await import("./db");
const { createExpressApp, attachErrorHandler } = await import("./app");
const { registerRoutes } = await import("./routes");
const { submissionRateLimit } = await import("./rate-limit");

let server: Server;
let base = "";

async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const waitlistBody = {
  fullName: "Test Avery",
  email: "test-avery@example.com",
  role: "researcher",
  company: "Lab Notes",
  state: "FL",
  message: "Comparing certificates.",
  subscribeToUpdates: true,
  ageConfirmed: true,
  companyWebsite: "",
};

before(async () => {
  const ready = await initDb();
  assert.equal(ready, true, "local Postgres should accept the test database");
  const sql = getSql();
  await sql`DELETE FROM submissions WHERE email LIKE 'test-%@example.com'`;
  const app = createExpressApp();
  registerRoutes(app);
  attachErrorHandler(app);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address() as AddressInfo;
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  const sql = getSql();
  await sql`DELETE FROM submissions WHERE email LIKE 'test-%@example.com'`;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await closeDb();
});

describe("submission flow", { concurrency: 1 }, () => {
  it("saves a waitlist row when email is not configured and does not pretend mail sent", async () => {
    submissionRateLimit.reset();
    const response = await post("/api/waitlist", waitlistBody);
    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.duplicate, false);
    assert.equal(response.body.emailSent, false);
    assert.match(response.body.message, /could not be sent/);

    const sql = getSql();
    const rows = await sql<
      { email: string; role: string; email_status: string; notify_status: string; company: string }[]
    >`SELECT email, role, email_status, notify_status, company FROM submissions WHERE email = 'test-avery@example.com'`;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].role, "researcher");
    assert.equal(rows[0].company, "Lab Notes");
    assert.equal(rows[0].email_status, "skipped");
    assert.equal(rows[0].notify_status, "skipped");
    assert.match(String(rows[0].email_status), /skipped/);
  });

  it("dedupes a second waitlist signup for the same email", async () => {
    submissionRateLimit.reset();
    const response = await post("/api/waitlist", { ...waitlistBody, fullName: "Someone Else" });
    assert.equal(response.status, 200);
    assert.equal(response.body.duplicate, true);
    const sql = getSql();
    const rows = await sql`SELECT id FROM submissions WHERE email = 'test-avery@example.com' AND kind = 'waitlist'`;
    assert.equal(rows.length, 1);
  });

  it("rejects an invalid email and does not write a row", async () => {
    submissionRateLimit.reset();
    const response = await post("/api/waitlist", { ...waitlistBody, email: "nope" });
    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    const sql = getSql();
    const rows = await sql`SELECT id FROM submissions WHERE email = 'nope'`;
    assert.equal(rows.length, 0);
  });

  it("drops honeypot submissions without writing", async () => {
    submissionRateLimit.reset();
    const response = await post("/api/partner", {
      fullName: "Bot Buyer",
      email: "test-bot@example.com",
      role: "dispensary",
      company: "Spam Co",
      state: "FL",
      message: "Buy cheap links for your site today please.",
      ageConfirmed: true,
      companyWebsite: "https://spam.example",
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    const sql = getSql();
    const rows = await sql`SELECT id FROM submissions WHERE email = 'test-bot@example.com'`;
    assert.equal(rows.length, 0);
  });

  it("saves a distinct partner inquiry for an email that is already on the waitlist", async () => {
    submissionRateLimit.reset();
    const response = await post("/api/partner", {
      fullName: "Test Avery",
      email: "test-avery@example.com",
      role: "cultivator",
      company: "North Field",
      state: "Florida",
      message: "We want a pilot across two flower rooms.",
      ageConfirmed: true,
      companyWebsite: "",
    });
    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    const sql = getSql();
    const rows = await sql`SELECT kind FROM submissions WHERE email = 'test-avery@example.com' ORDER BY kind`;
    assert.deepEqual(rows.map((row) => row.kind), ["partner", "waitlist"]);
  });

  it("hides submissions until the admin token is presented, then exports CSV", async () => {
    const open = await fetch(`${base}/api/admin/submissions`);
    assert.equal(open.status, 401);
    const legacy = await fetch(`${base}/api/interests`);
    assert.equal(legacy.status, 404);

    const allowed = await fetch(`${base}/api/admin/submissions`, {
      headers: { "x-admin-token": "test-admin-token" },
    });
    assert.equal(allowed.status, 200);
    const payload = await allowed.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.some((row: { email: string }) => row.email === "test-avery@example.com"));

    const csv = await fetch(`${base}/api/admin/submissions.csv`, {
      headers: { authorization: "Bearer test-admin-token" },
    });
    assert.equal(csv.status, 200);
    const text = await csv.text();
    assert.match(text, /test-avery@example.com/);
    assert.match(csv.headers.get("content-type") ?? "", /text\/csv/);
  });

  it("rate limits a burst of posts", async () => {
    submissionRateLimit.reset();
    let blocked = 0;
    for (let i = 0; i < 9; i += 1) {
      const response = await post("/api/waitlist", {
        ...waitlistBody,
        email: `test-rate-${i}@example.com`,
      });
      if (response.status === 429) blocked += 1;
    }
    assert.equal(blocked, 1);
    const sql = getSql();
    const rows = await sql`SELECT count(*)::int AS count FROM submissions WHERE email LIKE 'test-rate-%@example.com'`;
    assert.equal(rows[0].count, 8);
  });
});
