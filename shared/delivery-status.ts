/**
 * Lifecycle of one outbound email on a submission (confirmation or owner notice).
 *
 *   pending  --attempt sent|failed|skipped-->  sent | failed | skipped
 *   failed   --attempt sent|failed|skipped-->  sent | failed | skipped
 *   skipped  --attempt sent|failed|skipped-->  sent | failed | skipped
 *   sent     --any-->                          sent
 *
 * `sent` is terminal: a later failure must not wipe a delivery that already
 * succeeded. `pending` is only the initial state. Not attempting a send keeps
 * the current status (including `pending`).
 */

export const DELIVERY_STATUSES = ["pending", "sent", "failed", "skipped"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const DELIVERY_OUTCOMES = ["sent", "failed", "skipped"] as const;
export type DeliveryOutcome = (typeof DELIVERY_OUTCOMES)[number];

export type DeliveryRecord = {
  status: DeliveryStatus;
  error: string | null;
};

export type DeliveryAttempt =
  | { attempted: false }
  | { attempted: true; outcome: DeliveryOutcome; error: string | null };

export function readDeliveryStatus(value: string | null | undefined): DeliveryStatus {
  if (value === "sent" || value === "failed" || value === "skipped" || value === "pending") {
    return value;
  }
  return "pending";
}

export function needsDelivery(status: string | null | undefined): boolean {
  return readDeliveryStatus(status) !== "sent";
}

/** Map a provider result onto an outcome. An unexpected status is a failure. */
export function recordedOutcome(status: string | null | undefined): DeliveryOutcome {
  if (status === "sent" || status === "failed" || status === "skipped") return status;
  return "failed";
}

export function nextDeliveryRecord(
  current: { status: string | null | undefined; error: string | null },
  attempt: DeliveryAttempt,
): DeliveryRecord {
  const status = readDeliveryStatus(current.status);
  const error = current.error ?? null;
  if (status === "sent" || !attempt.attempted) {
    return { status, error };
  }
  if (attempt.outcome === "sent") return { status: "sent", error: null };
  return { status: attempt.outcome, error: attempt.error };
}

/**
 * Fold a proposed write into the row that is actually stored.
 * A proposal of `pending` means "leave it alone".
 * Once the stored status is `sent`, a later proposal cannot change it.
 */
export function mergeDeliveryUpdate(
  current: { status: string | null | undefined; error: string | null },
  proposed: { status: DeliveryStatus; error: string | null },
): DeliveryRecord {
  if (proposed.status === "pending") {
    return nextDeliveryRecord(current, { attempted: false });
  }
  return nextDeliveryRecord(current, {
    attempted: true,
    outcome: proposed.status,
    error: proposed.error,
  });
}
