import { and, desc, eq, sql } from "drizzle-orm";
import {
  interests,
  submissions,
  type AdminSubmission,
  type Submission,
} from "@shared/schema";
import { getDb, getSql, isDbReady } from "./db";

export type NewSubmission = {
  kind: "waitlist" | "partner";
  fullName: string;
  email: string;
  role: string;
  company: string | null;
  state: string | null;
  message: string | null;
  subscribeToUpdates: boolean;
  ageConfirmed: boolean;
};

export type DeliveryUpdate = {
  emailStatus: "sent" | "failed" | "skipped";
  emailError: string | null;
  notifyStatus: "sent" | "failed" | "skipped";
  notifyError: string | null;
};

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function toIso(value: Date | string | null): string {
  if (!value) return new Date(0).toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

export async function findSubmission(
  kind: "waitlist" | "partner",
  email: string,
): Promise<Submission | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.kind, kind), sql`lower(${submissions.email}) = ${email}`))
    .limit(1);
  return rows[0];
}

export async function createSubmission(
  input: NewSubmission,
): Promise<{ submission: Submission; duplicate: boolean }> {
  const existing = await findSubmission(input.kind, input.email);
  if (existing) {
    return { submission: existing, duplicate: true };
  }

  const db = getDb();
  try {
    const inserted = await db
      .insert(submissions)
      .values({
        kind: input.kind,
        fullName: input.fullName,
        email: input.email,
        role: input.role,
        company: input.company,
        state: input.state,
        message: input.message,
        subscribeToUpdates: input.subscribeToUpdates,
        ageConfirmed: input.ageConfirmed,
        emailStatus: "pending",
        notifyStatus: "pending",
      })
      .returning();
    return { submission: inserted[0], duplicate: false };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const raced = await findSubmission(input.kind, input.email);
    if (!raced) throw error;
    return { submission: raced, duplicate: true };
  }
}

export async function updateDelivery(id: string, update: DeliveryUpdate): Promise<Submission> {
  const db = getDb();
  const rows = await db
    .update(submissions)
    .set({
      emailStatus: update.emailStatus,
      emailError: update.emailError,
      notifyStatus: update.notifyStatus,
      notifyError: update.notifyError,
    })
    .where(eq(submissions.id, id))
    .returning();
  if (!rows[0]) {
    throw new Error(`Submission ${id} disappeared before email status was saved.`);
  }
  return rows[0];
}

function mapSubmission(row: Submission): AdminSubmission {
  return {
    id: row.id,
    source: "submission",
    kind: row.kind,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    company: row.company,
    state: row.state,
    phone: null,
    message: row.message,
    subscribeToUpdates: row.subscribeToUpdates,
    emailStatus: row.emailStatus,
    emailError: row.emailError,
    notifyStatus: row.notifyStatus,
    notifyError: row.notifyError,
    createdAt: toIso(row.createdAt),
  };
}

async function legacyInterests(): Promise<AdminSubmission[]> {
  if (!isDbReady()) return [];
  try {
    const db = getDb();
    const rows = await db.select().from(interests).orderBy(desc(interests.createdAt));
    return rows.map((row) => ({
      id: row.id,
      source: "legacy_interest" as const,
      kind: row.interestType,
      fullName: row.fullName,
      email: row.email,
      role: row.interestType,
      company: null,
      state: null,
      phone: row.phone,
      message: row.message,
      subscribeToUpdates: row.subscribeToUpdates,
      emailStatus: null,
      emailError: "Legacy form did not record email delivery.",
      notifyStatus: null,
      notifyError: "Legacy form did not notify the owner.",
      createdAt: toIso(row.createdAt),
    }));
  } catch (error) {
    const missing = /does not exist|42P01/.test(String((error as { message?: string })?.message ?? error))
      || (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "42P01")
      || (typeof error === "object" && error !== null && "cause" in error && /42P01|does not exist/.test(String((error as { cause?: unknown }).cause)));
    if (!missing) console.error("Could not read legacy interests table.", error);
    return [];
  }
}

export async function listAdminSubmissions(): Promise<AdminSubmission[]> {
  const db = getDb();
  const current = await db.select().from(submissions).orderBy(desc(submissions.createdAt));
  const legacy = await legacyInterests();
  return [...current.map(mapSubmission), ...legacy].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export async function countSubmissions(): Promise<number> {
  const sqlClient = getSql();
  const rows = await sqlClient<{ count: string }[]>`
    SELECT count(*)::text AS count FROM submissions
  `;
  return Number(rows[0]?.count ?? 0);
}
