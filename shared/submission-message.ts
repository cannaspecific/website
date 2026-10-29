import type { SubmissionKind } from "./requests";

export type SubmissionSuccessCopy = {
  headline: string;
  detail: string;
};

export function submissionSuccessCopy(input: {
  kind: SubmissionKind;
  duplicate: boolean;
  emailSent: boolean;
}): SubmissionSuccessCopy {
  if (input.kind === "partner") {
    if (!input.emailSent) {
      return input.duplicate
        ? { headline: "We already have your inquiry.", detail: "We saved it." }
        : { headline: "We saved your inquiry.", detail: "We'll read it and reply when we can." };
    }
    return input.duplicate
      ? { headline: "We already have your inquiry.", detail: "We sent a confirmation email." }
      : { headline: "We saved your inquiry.", detail: "We sent a confirmation email." };
  }

  if (!input.emailSent) {
    return input.duplicate
      ? { headline: "You're already on the list.", detail: "We saved your spot." }
      : { headline: "You're on the list!", detail: "We saved your spot." };
  }
  return input.duplicate
    ? { headline: "You're already on the list.", detail: "We sent a confirmation email." }
    : { headline: "You're on the list!", detail: "We saved your spot and sent a confirmation email." };
}

export function submissionSuccessMessage(input: {
  kind: SubmissionKind;
  duplicate: boolean;
  emailSent: boolean;
}): string {
  const copy = submissionSuccessCopy(input);
  return `${copy.headline} ${copy.detail}`;
}
