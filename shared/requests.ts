import { z } from "zod";

export const WAITLIST_ROLES = ["consumer", "dispensary", "cultivator", "researcher"] as const;
export const PARTNER_ROLES = ["dispensary", "cultivator", "researcher", "other"] as const;

const optionalText = (max: number) =>
  z.string().trim().max(max, "That field is too long.").optional().default("");

const emailField = z
  .string({ required_error: "Email is required." })
  .trim()
  .min(3, "Enter a valid email address.")
  .max(254, "Email is too long.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

const nameField = z
  .string({ required_error: "Name is required." })
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(120, "Name is too long.");

const ageField = z.boolean().refine((value) => value === true, {
  message: "Confirm that you are 21 or older.",
});

const honeypotField = z.string().max(500).optional().default("");

export const waitlistRequestSchema = z.object({
  fullName: nameField,
  email: emailField,
  role: z.enum(WAITLIST_ROLES, {
    required_error: "Select the role that fits you best.",
    invalid_type_error: "Select the role that fits you best.",
  }),
  company: optionalText(160),
  state: optionalText(40),
  message: optionalText(2000),
  subscribeToUpdates: z.boolean().optional().default(false),
  ageConfirmed: ageField,
  companyWebsite: honeypotField,
});

export const partnerRequestSchema = z.object({
  fullName: nameField,
  email: emailField,
  role: z.enum(PARTNER_ROLES, {
    required_error: "Select a business type.",
    invalid_type_error: "Select a business type.",
  }),
  company: z
    .string({ required_error: "Company is required." })
    .trim()
    .min(2, "Company must be at least 2 characters.")
    .max(160, "Company is too long."),
  state: optionalText(40),
  message: z
    .string({ required_error: "Tell us a little about the pilot." })
    .trim()
    .min(10, "Please share at least a sentence (10 characters).")
    .max(5000, "Message is too long."),
  ageConfirmed: ageField,
  companyWebsite: honeypotField,
});

export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>;
export type PartnerRequest = z.infer<typeof partnerRequestSchema>;
export type SubmissionKind = "waitlist" | "partner";
