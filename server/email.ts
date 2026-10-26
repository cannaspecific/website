import sgMail from "@sendgrid/mail";
import type { Submission } from "@shared/schema";

export type DeliveryState = {
  status: "sent" | "failed" | "skipped";
  error: string | null;
};

export type MailConfig =
  | { ok: true; provider: "resend"; apiKey: string; from: string; notify: string }
  | { ok: true; provider: "sendgrid"; apiKey: string; from: string; fromName: string; notify: string }
  | { ok: false; reason: string; notify: string };

export const DEFAULT_EMAIL_FROM = "CannaSpecific <hello@cannaspecific.com>";
export const DEFAULT_NOTIFY = "cannaspecific@gmail.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER_RE = /YOUR_VERIFIED|example\.(com|org|net)$/i;

let configuredSendGridKey: string | null = null;

function isUsableEmail(value: string): boolean {
  return EMAIL_RE.test(value) && !PLACEHOLDER_RE.test(value);
}

function parseFromAddress(
  value: string,
): { ok: true; display: string } | { ok: false; reason: string } {
  const trimmed = value.trim();
  const named = trimmed.match(/^(.+?)\s*<([^<>]+)>$/);
  const email = named ? named[2].trim() : trimmed;
  const name = named ? named[1].trim().replace(/^"|"$/g, "") : "";
  if (!isUsableEmail(email)) {
    return { ok: false, reason: `EMAIL_FROM (${trimmed}) is not a usable sender.` };
  }
  return { ok: true, display: name ? `${name} <${email}>` : email };
}

export function resolveMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const notify = env.NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY;
  if (!EMAIL_RE.test(notify)) {
    return { ok: false, notify, reason: `NOTIFY_EMAIL (${notify}) is not a valid email address.` };
  }

  const resendKey = env.RESEND_API_KEY?.trim() ?? "";
  if (resendKey) {
    const fromSource = env.EMAIL_FROM?.trim() ? env.EMAIL_FROM : DEFAULT_EMAIL_FROM;
    const parsed = parseFromAddress(fromSource);
    if (!parsed.ok) return { ok: false, notify, reason: parsed.reason };
    return { ok: true, provider: "resend", apiKey: resendKey, from: parsed.display, notify };
  }

  const apiKey = env.SENDGRID_API_KEY?.trim() ?? "";
  const from = env.SENDGRID_FROM_EMAIL?.trim() ?? "";
  const fromName = env.SENDGRID_FROM_NAME?.trim() || "CannaSpecific";
  if (!apiKey) {
    return {
      ok: false,
      notify,
      reason: "RESEND_API_KEY is not set and SENDGRID_API_KEY is not set.",
    };
  }
  if (!from) {
    return {
      ok: false,
      notify,
      reason: "SENDGRID_FROM_EMAIL is not set. Refusing to send from a placeholder address.",
    };
  }
  if (!isUsableEmail(from)) {
    return {
      ok: false,
      notify,
      reason: `SENDGRID_FROM_EMAIL (${from}) is not a usable sender. Use an address on the SendGrid-authenticated domain.`,
    };
  }
  return { ok: true, provider: "sendgrid", apiKey, from, fromName, notify };
}

export function describeMailConfig(env: NodeJS.ProcessEnv = process.env): string {
  const config = resolveMailConfig(env);
  if (!config.ok) return `Email disabled: ${config.reason} Owner notices would go to ${config.notify}.`;
  if (config.provider === "resend") {
    const sendgridAlsoSet = Boolean(env.SENDGRID_API_KEY?.trim());
    const unused = sendgridAlsoSet ? " SENDGRID_API_KEY is also set and will not be used." : "";
    return `Email enabled via Resend. From ${config.from}. Owner notices to ${config.notify}.${unused}`;
  }
  const domain = config.from.split("@")[1];
  return `Email enabled via SendGrid. From ${config.from} (${domain}). Owner notices to ${config.notify}.`;
}

function errorText(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { statusCode?: number; body?: unknown } }).response;
    const detail = response?.body ? JSON.stringify(response.body) : "";
    return `SendGrid ${response?.statusCode ?? ""} ${detail}`.trim().slice(0, 2000);
  }
  if (error instanceof Error) return error.message.slice(0, 2000);
  return "Unknown email error";
}

function redact(detail: string, secret: string): string {
  if (!secret) return detail.slice(0, 2000);
  return detail.split(secret).join("[redacted]").slice(0, 2000);
}

function roleLabel(role: string | null): string {
  if (!role) return "unspecified";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function confirmationCopy(submission: Submission): { subject: string; text: string; html: string } {
  const name = submission.fullName;
  const partner = submission.kind === "partner";
  const subject = partner
    ? "We received your CannaSpecific pilot inquiry"
    : "You're on the CannaSpecific list";
  const lead = partner
    ? "Thanks for the pilot inquiry. We saved it and will reply from this project when we can."
    : "Thanks for joining the CannaSpecific list. We saved your request.";
  const text = [
    `Hi ${name},`,
    "",
    lead,
    "",
    "CannaSpecific is an early-stage Florida company building software that relates cannabis lab certificates (COAs) to real-world reviews. The product tiers are not on sale yet.",
    "",
    "This note is a confirmation that we received your form. It is not medical advice, not a health claim, and not an offer to sell cannabis.",
    "",
    "For adults 21 and older.",
    "",
    "CannaSpecific",
    "cannaspecific.com",
  ].join("\n");
  const html = `
    <div style="font-family: Georgia, serif; color: #14211c; line-height: 1.5;">
      <p>Hi ${escapeHtml(name)},</p>
      <p>${escapeHtml(lead)}</p>
      <p>CannaSpecific is an early-stage Florida company building software that relates cannabis lab certificates (COAs) to real-world reviews. The product tiers are not on sale yet.</p>
      <p>This note is a confirmation that we received your form. It is not medical advice, not a health claim, and not an offer to sell cannabis.</p>
      <p>For adults 21 and older.</p>
      <p>CannaSpecific<br/>cannaspecific.com</p>
    </div>
  `.trim();
  return { subject, text, html };
}

function notificationCopy(submission: Submission): { subject: string; text: string; html: string } {
  const label = submission.kind === "partner" ? "Pilot inquiry" : "Waitlist";
  const subject = `${label}: ${submission.fullName} (${roleLabel(submission.role)})`;
  const lines = [
    `${label} saved.`,
    "",
    `Name: ${submission.fullName}`,
    `Email: ${submission.email}`,
    `Role: ${submission.role ?? ""}`,
    `Company: ${submission.company ?? ""}`,
    `State: ${submission.state ?? ""}`,
    `Updates: ${submission.subscribeToUpdates ? "yes" : "no"}`,
    `Id: ${submission.id}`,
    "",
    submission.message ? `Message:\n${submission.message}` : "Message: (none)",
  ];
  const text = lines.join("\n");
  const html = `<pre style="font-family: ui-monospace, monospace; white-space: pre-wrap;">${escapeHtml(text)}</pre>`;
  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendViaResend(
  config: Extract<MailConfig, { ok: true; provider: "resend" }>,
  message: { to: string; subject: string; text: string; html: string },
  fetchImpl: typeof fetch,
): Promise<DeliveryState> {
  try {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        reply_to: config.notify,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      const detail = redact(`Resend ${response.status} ${body}`.trim(), config.apiKey);
      console.error(`Email to ${message.to} failed: ${detail}`);
      return { status: "failed", error: detail };
    }
    return { status: "sent", error: null };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown email error";
    const detail = redact(`Resend ${messageText}`, config.apiKey);
    console.error(`Email to ${message.to} failed: ${detail}`);
    return { status: "failed", error: detail };
  }
}

async function sendViaSendGrid(
  config: Extract<MailConfig, { ok: true; provider: "sendgrid" }>,
  message: { to: string; subject: string; text: string; html: string },
): Promise<DeliveryState> {
  if (configuredSendGridKey !== config.apiKey) {
    sgMail.setApiKey(config.apiKey);
    configuredSendGridKey = config.apiKey;
  }
  try {
    await sgMail.send({
      to: message.to,
      from: { email: config.from, name: config.fromName },
      replyTo: config.notify,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { status: "sent", error: null };
  } catch (error) {
    const detail = redact(errorText(error), config.apiKey);
    console.error(`Email to ${message.to} failed: ${detail}`);
    return { status: "failed", error: detail };
  }
}

export async function deliverSubmissionEmails(
  submission: Submission,
  which: { confirmation?: boolean; notification?: boolean } = {},
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<{
  confirmation: DeliveryState;
  notification: DeliveryState;
}> {
  const sendConfirmation = which.confirmation !== false;
  const sendNotification = which.notification !== false;
  const untouched = (status: Submission["emailStatus"]): DeliveryState => ({
    status: status === "sent" || status === "failed" || status === "skipped" ? status : "skipped",
    error: null,
  });

  const config = resolveMailConfig(env);
  if (!config.ok) {
    console.error(`Email skipped for submission ${submission.id}: ${config.reason}`);
    return {
      confirmation: sendConfirmation
        ? { status: "skipped", error: config.reason }
        : untouched(submission.emailStatus),
      notification: sendNotification
        ? { status: "skipped", error: config.reason }
        : untouched(submission.notifyStatus),
    };
  }

  const confirmation = sendConfirmation
    ? await (config.provider === "resend"
        ? sendViaResend(config, { to: submission.email, ...confirmationCopy(submission) }, fetchImpl)
        : sendViaSendGrid(config, { to: submission.email, ...confirmationCopy(submission) }))
    : untouched(submission.emailStatus);
  const notification = sendNotification
    ? await (config.provider === "resend"
        ? sendViaResend(config, { to: config.notify, ...notificationCopy(submission) }, fetchImpl)
        : sendViaSendGrid(config, { to: config.notify, ...notificationCopy(submission) }))
    : untouched(submission.notifyStatus);

  if (confirmation.status === "sent") {
    console.log(`Confirmation email sent for submission ${submission.id}.`);
  }
  if (notification.status === "sent") {
    console.log(`Owner notification sent for submission ${submission.id}.`);
  }

  return { confirmation, notification };
}
