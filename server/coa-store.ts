import { desc, eq } from "drizzle-orm";
import {
  coaRecordLabel,
  parsedCoaSchema,
  type CoaLibraryRecord,
  type ParsedCoa,
} from "@shared/coa";
import { coaRecords } from "@shared/schema";
import { getDb } from "./db";

function toRecord(row: { id: string; parsed: unknown }): CoaLibraryRecord | null {
  const parsed = parsedCoaSchema.safeParse(row.parsed);
  if (!parsed.success) return null;
  return { id: row.id, serverId: row.id, parsed: parsed.data };
}

export async function listCoaRecords(limit = 50): Promise<CoaLibraryRecord[]> {
  const db = getDb();
  const rows = await db.select().from(coaRecords).orderBy(desc(coaRecords.createdAt)).limit(limit);
  return rows.flatMap((row) => {
    const record = toRecord(row);
    return record ? [record] : [];
  });
}

export async function insertCoaRecord(parsed: ParsedCoa): Promise<CoaLibraryRecord> {
  const db = getDb();
  const inserted = await db
    .insert(coaRecords)
    .values({
      label: coaRecordLabel(parsed).slice(0, 180),
      sourceName: parsed.sourceName,
      sampleData: parsed.sampleData,
      parsed,
    })
    .returning();
  const row = inserted[0];
  if (!row) throw new Error("Certificate was not stored.");
  const record = toRecord(row);
  if (!record) throw new Error("Stored certificate could not be read back.");
  return record;
}

export async function deleteCoaRecord(id: string): Promise<boolean> {
  const db = getDb();
  const removed = await db.delete(coaRecords).where(eq(coaRecords.id, id)).returning({ id: coaRecords.id });
  return removed.length > 0;
}
