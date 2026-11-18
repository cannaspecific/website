-- Parsed cannabis certificates for the private /coa beta.
-- The server also applies these statements on boot (CREATE IF NOT EXISTS).
-- The PDF file is not stored. `parsed` holds the structured read.

CREATE TABLE IF NOT EXISTS coa_records (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  source_name text,
  sample_data boolean NOT NULL DEFAULT false,
  parsed jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coa_records_created_at_idx
  ON coa_records (created_at DESC);
