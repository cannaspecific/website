import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "@shared/schema";

const CREATE_SUBMISSIONS = `
CREATE TABLE IF NOT EXISTS submissions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  role text,
  company text,
  state text,
  message text,
  subscribe_to_updates boolean NOT NULL DEFAULT false,
  age_confirmed boolean NOT NULL DEFAULT false,
  email_status text NOT NULL DEFAULT 'pending',
  email_error text,
  notify_status text NOT NULL DEFAULT 'pending',
  notify_error text,
  created_at timestamp NOT NULL DEFAULT now()
)`;

const CREATE_UNIQUE = `
CREATE UNIQUE INDEX IF NOT EXISTS submissions_kind_email_unique
  ON submissions (kind, lower(email))`;

const CREATE_CREATED_IDX = `
CREATE INDEX IF NOT EXISTS submissions_created_at_idx
  ON submissions (created_at DESC)`;

const CREATE_COA_RECORDS = `
CREATE TABLE IF NOT EXISTS coa_records (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  source_name text,
  sample_data boolean NOT NULL DEFAULT false,
  parsed jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
)`;

const CREATE_COA_IDX = `
CREATE INDEX IF NOT EXISTS coa_records_created_at_idx
  ON coa_records (created_at DESC)`;

let client: Sql | null = null;
let db: PostgresJsDatabase<typeof schema> | null = null;
let ready = false;
let coaReady = false;

export function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : undefined;
}

export function sslForDatabase(url: string): "require" | false {
  const flag = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (flag === "disable" || flag === "false" || flag === "off") return false;
  if (flag === "require" || flag === "true" || flag === "on") return "require";
  if (/localhost|127\.0\.0\.1/.test(url)) return false;
  return "require";
}

export function isDbReady(): boolean {
  return ready;
}

export function isCoaStoreReady(): boolean {
  return ready && coaReady;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!db) {
    throw new Error("Database is not available.");
  }
  return db;
}

export function getSql(): Sql {
  if (!client) {
    throw new Error("Database is not available.");
  }
  return client;
}

export async function initDb(): Promise<boolean> {
  const url = databaseUrl();
  if (!url) {
    ready = false;
    console.error(
      "DATABASE_URL is not set. The site will serve, but form submissions cannot be saved.",
    );
    return false;
  }

  if (!client) {
    client = postgres(url, {
      ssl: sslForDatabase(url),
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      onnotice: (notice) => {
        if (notice.code === "42P07") return;
        console.log(notice.message ?? notice);
      },
    });
    db = drizzle(client, { schema });
  }

  try {
    await client.unsafe(CREATE_SUBMISSIONS);
    await client.unsafe(CREATE_UNIQUE);
    await client.unsafe(CREATE_CREATED_IDX);
    ready = true;
    try {
      await client.unsafe(CREATE_COA_RECORDS);
      await client.unsafe(CREATE_COA_IDX);
      coaReady = true;
      console.log("Database schema ready (submissions and coa_records).");
    } catch (error) {
      coaReady = false;
      console.error("COA table initialization failed. Certificate saves are unavailable.", error);
      console.log("Database schema ready (submissions table).");
    }
    return true;
  } catch (error) {
    ready = false;
    console.error("Database initialization failed. Submissions cannot be saved.", error);
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
  }
  client = null;
  db = null;
  ready = false;
  coaReady = false;
}
