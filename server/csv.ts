import type { AdminSubmission } from "@shared/schema";

const COLUMNS: { key: keyof AdminSubmission; header: string }[] = [
  { key: "createdAt", header: "created_at" },
  { key: "source", header: "source" },
  { key: "kind", header: "kind" },
  { key: "fullName", header: "full_name" },
  { key: "email", header: "email" },
  { key: "role", header: "role" },
  { key: "company", header: "company" },
  { key: "state", header: "state" },
  { key: "phone", header: "phone" },
  { key: "message", header: "message" },
  { key: "subscribeToUpdates", header: "subscribe_to_updates" },
  { key: "emailStatus", header: "email_status" },
  { key: "emailError", header: "email_error" },
  { key: "notifyStatus", header: "notify_status" },
  { key: "notifyError", header: "notify_error" },
  { key: "id", header: "id" },
];

export function csvCell(value: unknown): string {
  const raw =
    value === null || value === undefined
      ? ""
      : typeof value === "boolean"
        ? value ? "true" : "false"
        : String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function submissionsToCsv(rows: AdminSubmission[]): string {
  const header = COLUMNS.map((column) => csvCell(column.header)).join(",");
  const lines = rows.map((row) =>
    COLUMNS.map((column) => csvCell(row[column.key])).join(","),
  );
  return `\uFEFF${header}\n${lines.join("\n")}\n`;
}
