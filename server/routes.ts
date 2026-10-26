import type { Express, Request, Response } from "express";
import { ZodError } from "zod";
import type { Submission } from "@shared/schema";
import {
  partnerRequestSchema,
  waitlistRequestSchema,
  type PartnerRequest,
  type WaitlistRequest,
} from "@shared/requests";
import { adminAuthorized, readProvidedAdminToken } from "./admin-auth";
import { submissionsToCsv } from "./csv";
import { ROBOTS_TXT } from "./robots";
import { isDbReady } from "./db";
import { deliverSubmissionEmails } from "./email";
import { submissionRateLimit } from "./rate-limit";
import {
  createSubmission,
  listAdminSubmissions,
  updateDelivery,
  type NewSubmission,
} from "./storage";

function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function sendValidationError(res: Response, error: ZodError) {
  res.status(400).json({
    success: false,
    message: "Please check the form and try again.",
    errors: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

function honeypotTripped(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

const SAVE_FAILED = "We couldn't save your request. Nothing was stored. Please try again later.";

async function saveAndNotify(input: NewSubmission, res: Response) {
  if (!isDbReady()) {
    res.status(500).json({ success: false, message: SAVE_FAILED });
    return;
  }

  let submission: Submission;
  let duplicate: boolean;
  try {
    const created = await createSubmission(input);
    submission = created.submission;
    duplicate = created.duplicate;
  } catch (error) {
    console.error("Failed to save submission.", error);
    res.status(500).json({ success: false, message: SAVE_FAILED });
    return;
  }

  let current = submission;
  const sendConfirmation = current.emailStatus !== "sent";
  const sendNotification = current.notifyStatus !== "sent";
  if (sendConfirmation || sendNotification) {
    try {
      const delivery = await deliverSubmissionEmails(current, {
        confirmation: sendConfirmation,
        notification: sendNotification,
      });
      current = await updateDelivery(current.id, {
        emailStatus: delivery.confirmation.status,
        emailError: sendConfirmation ? delivery.confirmation.error : current.emailError,
        notifyStatus: delivery.notification.status,
        notifyError: sendNotification ? delivery.notification.error : current.notifyError,
      });
    } catch (error) {
      console.error(`Submission ${current.id} was saved, but email status was not recorded.`, error);
    }
  }

  const emailSent = current.emailStatus === "sent";
  const savedLine = duplicate
    ? input.kind === "partner"
      ? "We already have a pilot inquiry for this email."
      : "This email is already on the list."
    : input.kind === "partner"
      ? "Your pilot inquiry is saved."
      : "You're on the list.";
  const mailLine = emailSent
    ? " We sent a confirmation email."
    : " We saved it, but the confirmation email could not be sent.";

  res.status(duplicate ? 200 : 201).json({
    success: true,
    duplicate,
    emailSent,
    message: `${savedLine}${mailLine}`,
  });
}

function enforceRateLimit(req: Request, res: Response): boolean {
  const result = submissionRateLimit.check(`${clientIp(req)}:submissions`);
  if (result.ok) return true;
  res.set("Retry-After", String(result.retryAfterSec));
  res.status(429).json({
    success: false,
    message: "Too many requests from this network. Please wait a few minutes and try again.",
  });
  return false;
}

async function handleWaitlist(req: Request, res: Response) {
  if (!enforceRateLimit(req, res)) return;
  const parsed = waitlistRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  if (honeypotTripped(parsed.data.companyWebsite)) {
    // Bots get the same success shape as a real signup. Nothing is stored.
    console.warn(`Honeypot tripped on waitlist from ${clientIp(req)}.`);
    res.status(200).json({
      success: true,
      duplicate: false,
      emailSent: true,
      message: "You're on the list. We sent a confirmation email.",
    });
    return;
  }
  const data: WaitlistRequest = parsed.data;
  await saveAndNotify(
    {
      kind: "waitlist",
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      company: blankToNull(data.company),
      state: blankToNull(data.state),
      message: blankToNull(data.message),
      subscribeToUpdates: data.subscribeToUpdates,
      ageConfirmed: true,
    },
    res,
  );
}

async function handlePartner(req: Request, res: Response) {
  if (!enforceRateLimit(req, res)) return;
  const parsed = partnerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  if (honeypotTripped(parsed.data.companyWebsite)) {
    console.warn(`Honeypot tripped on partner inquiry from ${clientIp(req)}.`);
    res.status(200).json({
      success: true,
      duplicate: false,
      emailSent: true,
      message: "Your pilot inquiry is saved. We sent a confirmation email.",
    });
    return;
  }
  const data: PartnerRequest = parsed.data;
  await saveAndNotify(
    {
      kind: "partner",
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      company: data.company,
      state: blankToNull(data.state),
      message: data.message,
      subscribeToUpdates: false,
      ageConfirmed: true,
    },
    res,
  );
}

function requireAdmin(req: Request, res: Response): boolean {
  const provided = readProvidedAdminToken(
    req.get("x-admin-token"),
    req.get("authorization"),
  );
  const decision = adminAuthorized(provided);
  if (decision === "ok") return true;
  if (decision === "disabled") {
    res.status(503).json({
      success: false,
      message: "Admin access is not configured. Set ADMIN_TOKEN on the server.",
    });
    return false;
  }
  res.status(401).json({ success: false, message: "Unauthorized." });
  return false;
}

export function registerRoutes(app: Express): void {
  app.get("/robots.txt", (_req, res) => {
    res.set("Cache-Control", "public, max-age=0");
    res.type("text/plain; charset=utf-8").send(ROBOTS_TXT);
  });

  app.get("/api/health", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, db: isDbReady() });
  });

  app.post("/api/waitlist", (req, res, next) => {
    handleWaitlist(req, res).catch(next);
  });

  app.post("/api/partner", (req, res, next) => {
    handlePartner(req, res).catch(next);
  });

  app.get("/api/admin/submissions", (req, res, next) => {
    if (!requireAdmin(req, res)) return;
    if (!isDbReady()) {
      res.status(500).json({ success: false, message: "Database is not available." });
      return;
    }
    listAdminSubmissions()
      .then((data) => {
        res.set("Cache-Control", "no-store");
        res.json({ success: true, data });
      })
      .catch(next);
  });

  app.get("/api/admin/submissions.csv", (req, res, next) => {
    if (!requireAdmin(req, res)) return;
    if (!isDbReady()) {
      res.status(500).json({ success: false, message: "Database is not available." });
      return;
    }
    listAdminSubmissions()
      .then((data) => {
        res.set("Cache-Control", "no-store");
        res.set("Content-Type", "text/csv; charset=utf-8");
        res.set(
          "Content-Disposition",
          'attachment; filename="cannaspecific-submissions.csv"',
        );
        res.send(submissionsToCsv(data));
      })
      .catch(next);
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ success: false, message: "Not found." });
  });
}
