import sgMail from "@sendgrid/mail";
import type { Submission } from "@shared/schema";

export type DeliveryState = {
  status: "sent" | "failed" | "skipped";
  error: string | null;
};

export type MailConfig =
  | { ok: true; apiKey: string; from: string; fromName: string; notify: string }
  | { ok: false; reason: string; notify: string };

const DEFAULT_NOTIFY = "cannaspecific@gmail.com";
let configuredKey: string | null = null;

export function resolveMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const notify = env.NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY;
  const apiKey = env.SENDGRID_API_KEY?.trim() ?? "";
  const from = env.SENDGRID_FROM_EMAIL?.trim() ?? "";
  const fromName = env.SENDGRID_FROM_NAME?.trim() || "CannaSpecific";

  if (!apiKey) {
    return { ok: false, notify, reason: "SENDGRID_API_KEY is not set." };
  }
  if (!from) {
    return {
      ok: false,
      notify,
      reason: "SENDGRID_FROM_EMAIL is not set. Refusing to send from a placeholder address.",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from) || /YOUR_VERIFIED|example\.(com|org|net)$/i.test(from)) {
    return {
      ok: false,
      notify,
      reason: `SENDGRID_FROM_EMAIL (${from}) is not a usable sender. Use an address on the SendGrid-authenticated domain.`,
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notify)) {
    return { ok: false, notify, reason: `NOTIFY_EMAIL (${notify}) is not a valid email address.` };
  }
  return { ok: true, apiKey, from, fromName, notify };
}

export function describeMailConfig(env: NodeJS.ProcessEnv = process.env): string {
  const config = resolveMailConfig(env);
  if (!config.ok) return `Email disabled: ${config.reason} Owner notices would go to ${config.notify}.`;
  const domain = config.from.split("@")[1];
  return `Email enabled. From ${config.from} (${domain}). Owner notices to ${config.notify}.`;
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

async function sendOne(
  config: Extract<MailConfig, { ok: true }>,
  message: { to: string; subject: string; text: string; html: string },
): Promise<DeliveryState> {
  if (configuredKey !== config.apiKey) {
    sgMail.setApiKey(config.apiKey);
    configuredKey = config.apiKey;
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
    const detail = errorText(error);
    console.error(`Email to ${message.to} failed: ${detail}`);
    return { status: "failed", error: detail };
  }
}

export async function deliverSubmissionEmails(
  submission: Submission,
  which: { confirmation?: boolean; notification?: boolean } = {},
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

  const config = resolveMailConfig();
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
    ? await sendOne(config, {
        to: submission.email,
        ...confirmationCopy(submission),
      })
    : untouched(submission.emailStatus);
  const notification = sendNotification
    ? await sendOne(config, {
        to: config.notify,
        ...notificationCopy(submission),
      })
    : untouched(submission.notifyStatus);

  if (confirmation.status === "sent") {
    console.log(`Confirmation email sent for submission ${submission.id}.`);
  }
  if (notification.status === "sent") {
    console.log(`Owner notification sent for submission ${submission.id}.`);
  }

  return { confirmation, notification };
}
