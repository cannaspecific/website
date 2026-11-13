import type { SignupAudience } from "./signup-audience";

/**
 * Homepage signup form.
 *
 *   editing    --submit-->          submitting
 *   editing    --selectAudience-->  editing
 *   submitting --succeed-->         success
 *   submitting --fail-->            error
 *   error      --submit-->          submitting
 *   error      --selectAudience-->  editing   (a different audience clears the error)
 *   success    --reset-->           editing
 *   success    --selectAudience-->  success   (the confirmation stays; the next form uses the new audience)
 *
 * `selectAudience` is ignored while submitting so the fields and button stay on
 * the request that is in flight. The caller passes the URL audience into
 * `succeed` or `fail` when that request settles.
 */

export type SignupSubmission = {
  /** Audience that was actually posted. The confirmation copy follows this. */
  audience: SignupAudience;
  duplicate: boolean;
  emailSent: boolean;
  message: string;
};

export type SignupFormState =
  | { status: "editing"; audience: SignupAudience }
  | { status: "submitting"; audience: SignupAudience }
  | { status: "success"; audience: SignupAudience; result: SignupSubmission }
  | { status: "error"; audience: SignupAudience; message: string };

export type SignupFormEvent =
  | { type: "selectAudience"; audience: SignupAudience }
  | { type: "submit" }
  | { type: "succeed"; audience: SignupAudience; result: SignupSubmission }
  | { type: "fail"; audience: SignupAudience; message: string }
  | { type: "reset" };

export function initialSignupFormState(audience: SignupAudience): SignupFormState {
  return { status: "editing", audience };
}

export function signupSubmitLabel(state: SignupFormState): string {
  if (state.status === "submitting") return "Saving…";
  if (state.audience === "business") return "Send the inquiry";
  return "Join the list";
}

export function signupFormReducer(state: SignupFormState, event: SignupFormEvent): SignupFormState {
  switch (state.status) {
    case "editing":
      switch (event.type) {
        case "selectAudience":
          return event.audience === state.audience ? state : { status: "editing", audience: event.audience };
        case "submit":
          return { status: "submitting", audience: state.audience };
        default:
          return state;
      }
    case "submitting":
      switch (event.type) {
        case "succeed":
          return { status: "success", audience: event.audience, result: event.result };
        case "fail":
          return { status: "error", audience: event.audience, message: event.message };
        default:
          return state;
      }
    case "error":
      switch (event.type) {
        case "selectAudience":
          return event.audience === state.audience
            ? state
            : { status: "editing", audience: event.audience };
        case "submit":
          return { status: "submitting", audience: state.audience };
        default:
          return state;
      }
    case "success":
      switch (event.type) {
        case "selectAudience":
          return event.audience === state.audience ? state : { ...state, audience: event.audience };
        case "reset":
          return { status: "editing", audience: state.audience };
        default:
          return state;
      }
    default:
      return state;
  }
}
