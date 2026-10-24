-- CannaSpecific submissions (waitlist + pilot inquiries).
-- The server also applies these statements on boot (CREATE IF NOT EXISTS)
-- so a Render free-tier deploy does not depend on an interactive drizzle-kit push.
-- The legacy `interests` table is left in place.

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
);

CREATE UNIQUE INDEX IF NOT EXISTS submissions_kind_email_unique
  ON submissions (kind, lower(email));

CREATE INDEX IF NOT EXISTS submissions_created_at_idx
  ON submissions (created_at DESC);
