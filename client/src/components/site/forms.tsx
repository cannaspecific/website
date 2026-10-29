import { useEffect, useRef, useState } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PARTNER_ROLES,
  WAITLIST_ROLES,
  partnerRequestSchema,
  waitlistRequestSchema,
  type PartnerRequest,
  type WaitlistRequest,
} from "@shared/requests";
import {
  audienceFromHash,
  hashForAudience,
  signupEndpoint,
  type SignupAudience,
} from "@shared/signup-audience";
import { submissionSuccessCopy } from "@shared/submission-message";
import { US_STATES } from "@/lib/us-states";

type SubmissionResult = {
  success: boolean;
  duplicate?: boolean;
  emailSent?: boolean;
  message: string;
  audience: SignupAudience;
};

type SignupValues = {
  fullName: string;
  email: string;
  role: WaitlistRequest["role"] | PartnerRequest["role"];
  company: string;
  state: string;
  message: string;
  subscribeToUpdates: boolean;
  ageConfirmed: boolean;
  companyWebsite: string;
};

const fieldClass =
  "mt-2 w-full rounded-md border border-[#cfc6b6] bg-white px-3 py-3 text-base text-[#14211c] shadow-sm";

const BUSINESS_HINT = "For dispensaries, cultivators & researchers";

function blankValues(audience: SignupAudience): SignupValues {
  return {
    fullName: "",
    email: "",
    role: audience === "business" ? "dispensary" : "consumer",
    company: "",
    state: audience === "business" ? "FL" : "",
    message: "",
    subscribeToUpdates: false,
    ageConfirmed: false,
    companyWebsite: "",
  };
}

function readInitialAudience(initialAudience?: SignupAudience): SignupAudience {
  if (initialAudience) return initialAudience;
  if (typeof window === "undefined") return "individual";
  return audienceFromHash(window.location.hash) ?? "individual";
}

function isPartnerRole(role: string): role is PartnerRequest["role"] {
  return (PARTNER_ROLES as readonly string[]).includes(role);
}

function isWaitlistRole(role: string): role is WaitlistRequest["role"] {
  return (WAITLIST_ROLES as readonly string[]).includes(role);
}

async function postForm(url: string, data: unknown): Promise<SubmissionResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("We couldn't reach the server. Nothing was saved. Check your connection and try again.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    const details = Array.isArray(body?.errors)
      ? body.errors.map((issue: { message?: string }) => issue.message).filter(Boolean).join(" ")
      : "";
    throw new Error(
      [body?.message, details].filter(Boolean).join(" ") ||
        "We couldn't save your request. Nothing was stored. Please try again.",
    );
  }
  return body as SubmissionResult;
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-[#7a2e24]">
      {message}
    </p>
  );
}

function SuccessNote({ result, onReset }: { result: SubmissionResult; onReset: () => void }) {
  const copy = submissionSuccessCopy({
    kind: result.audience === "business" ? "partner" : "waitlist",
    duplicate: Boolean(result.duplicate),
    emailSent: result.emailSent === true,
  });
  return (
    <div role="status" className="rounded-2xl border border-[#cfc6b6] bg-[#f7f4ec] p-8 text-[#14211c]">
      <p className="kicker text-[#0f4d3a]">Saved</p>
      <h3 className="mt-3 font-heading text-3xl">{copy.headline}</h3>
      <p className="mt-4 text-lg leading-relaxed text-[#24312c]">{copy.detail}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 text-sm font-semibold underline underline-offset-4"
      >
        Submit another response
      </button>
    </div>
  );
}

function Honeypot({ register }: { register: UseFormRegister<SignupValues> }) {
  return (
    <div className="hp-field" aria-hidden="true">
      <label htmlFor="companyWebsite">Leave this field empty</label>
      <input
        id="companyWebsite"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        {...register("companyWebsite")}
      />
    </div>
  );
}

function AudienceSwitch({
  audience,
  onChange,
}: {
  audience: SignupAudience;
  onChange: (next: SignupAudience) => void;
}) {
  return (
    <div>
      <div
        role="radiogroup"
        aria-label="How are you signing up?"
        className="audience-control"
      >
        {(
          [
            ["individual", "I'm an individual"],
            ["business", "I'm a business"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="audience-option">
            <input
              type="radio"
              name="signup-audience"
              value={value}
              className="sr-only"
              checked={audience === value}
              aria-describedby={value === "business" ? "signup-business-hint" : undefined}
              onChange={() => onChange(value)}
            />
            {label}
          </label>
        ))}
      </div>
      <p id="signup-business-hint" className="mt-2 text-sm text-[#3d4a44] sm:text-right">
        {BUSINESS_HINT}
      </p>
    </div>
  );
}

type SignupFormProps = {
  initialAudience?: SignupAudience;
};

export function SignupForm({ initialAudience }: SignupFormProps) {
  const [audience, setAudience] = useState<SignupAudience>(() => readInitialAudience(initialAudience));
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const audienceRef = useRef(audience);
  audienceRef.current = audience;
  const selectAudienceRef = useRef<(next: SignupAudience) => void>(() => {});

  const form = useForm<SignupValues>({
    resolver: async (values, context, options) => {
      const schema = audienceRef.current === "business" ? partnerRequestSchema : waitlistRequestSchema;
      return zodResolver(schema)(values, context, options);
    },
    defaultValues: blankValues(audience),
  });
  const { register, handleSubmit, formState, reset, setValue, getValues, clearErrors } = form;

  const selectAudience = (next: SignupAudience) => {
    if (audienceRef.current !== next) {
      const role = getValues("role");
      if (next === "business") {
        if (!isPartnerRole(role)) setValue("role", "dispensary");
        if (!getValues("state")) setValue("state", "FL");
      } else if (!isWaitlistRole(role)) {
        setValue("role", "consumer");
      }
      clearErrors();
      audienceRef.current = next;
      setAudience(next);
    }
    if (typeof window === "undefined" || window.location.pathname !== "/") return;
    if (audienceFromHash(window.location.hash) === next) return;
    const hash = hashForAudience(next);
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  };
  selectAudienceRef.current = selectAudience;

  useEffect(() => {
    const onHash = () => {
      const next = audienceFromHash(window.location.hash);
      if (!next) return;
      selectAudienceRef.current(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const mode = audienceRef.current;
    try {
      const saved = await postForm(signupEndpoint(mode), values);
      setResult({ ...saved, audience: mode });
      reset(blankValues(mode));
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "We couldn't save your request.");
    }
  });

  const business = audience === "business";

  return (
    <section id="signup" className="relative scroll-mt-24 band-ink" aria-labelledby="signup-heading" data-signup-audience={audience}>
      <div id="waitlist" className="pointer-events-none absolute inset-x-0 top-0 scroll-mt-24" aria-hidden="true" />
      <div id="partner" className="pointer-events-none absolute inset-x-0 top-0 scroll-mt-24" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="kicker text-[#d7f25c]">Sign up</p>
          <h2 id="signup-heading" className="mt-3 font-heading text-4xl leading-tight md:text-5xl">Join by the work you do.</h2>
          <p className="ink-muted mt-5 text-lg leading-relaxed">
            Individuals join the list. Dispensaries, cultivators, and researchers can ask about a pilot from this same form.
          </p>
          <p className="ink-muted mt-4 text-sm leading-relaxed">
            Adults 21 and older. Joining the list is not a purchase and not a medical consult. A business inquiry is not a signed engagement.
          </p>
        </div>
        <div className="lg:col-span-7">
          {result ? (
            <SuccessNote result={result} onReset={() => setResult(null)} />
          ) : (
            <form onSubmit={onSubmit} className="relative rounded-2xl bg-[#f7f4ec] p-6 text-[#14211c] md:p-8" noValidate>
              <Honeypot register={register} />
              <AudienceSwitch audience={audience} onChange={selectAudience} />

              {business && (
                <p className="mt-5">
                  <span className="inline-flex items-center rounded-full bg-[#101714] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#d7f25c]">
                    Business pilot inquiry
                  </span>
                </p>
              )}

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="signup-name" className="text-sm font-semibold">
                    {business ? "Your name" : "Full name"}
                  </label>
                  <input
                    id="signup-name"
                    autoComplete="name"
                    className={fieldClass}
                    aria-invalid={Boolean(formState.errors.fullName)}
                    aria-describedby={formState.errors.fullName ? "signup-name-error" : undefined}
                    {...register("fullName")}
                  />
                  <ErrorText id="signup-name-error" message={formState.errors.fullName?.message} />
                </div>
                <div>
                  <label htmlFor="signup-email" className="text-sm font-semibold">
                    {business ? "Work email" : "Email"}
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    className={fieldClass}
                    aria-invalid={Boolean(formState.errors.email)}
                    aria-describedby={formState.errors.email ? "signup-email-error" : undefined}
                    {...register("email")}
                  />
                  <ErrorText id="signup-email-error" message={formState.errors.email?.message} />
                </div>
              </div>

              {business ? (
                <>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="signup-company" className="text-sm font-semibold">Company</label>
                      <input
                        id="signup-company"
                        autoComplete="organization"
                        className={fieldClass}
                        aria-invalid={Boolean(formState.errors.company)}
                        aria-describedby={formState.errors.company ? "signup-company-error" : undefined}
                        {...register("company")}
                      />
                      <ErrorText id="signup-company-error" message={formState.errors.company?.message} />
                    </div>
                    <div>
                      <label htmlFor="signup-state" className="text-sm font-semibold">
                        State <span className="font-normal text-[#3d4a44]">(optional)</span>
                      </label>
                      <select id="signup-state" className={fieldClass} autoComplete="address-level1" {...register("state")}>
                        <option value="">Select</option>
                        {US_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <fieldset className="mt-6" aria-describedby={formState.errors.role ? "signup-role-error" : undefined}>
                    <legend className="text-sm font-semibold">Business type</legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["dispensary", "Dispensary"],
                          ["cultivator", "Cultivator"],
                          ["researcher", "Research group"],
                          ["other", "Other business"],
                        ] as const
                      ).map(([value, label]) => (
                        <label key={value} className="role-card flex cursor-pointer items-center gap-3 rounded-xl border border-[#ddd4c4] bg-white px-3 py-3">
                          <input type="radio" value={value} {...register("role")} />
                          <span className="font-semibold">{label}</span>
                        </label>
                      ))}
                    </div>
                    <ErrorText id="signup-role-error" message={formState.errors.role?.message} />
                  </fieldset>

                  <div className="mt-5">
                    <label htmlFor="signup-message" className="text-sm font-semibold">What do you want to try?</label>
                    <textarea
                      id="signup-message"
                      rows={5}
                      className={fieldClass}
                      aria-invalid={Boolean(formState.errors.message)}
                      aria-describedby={formState.errors.message ? "signup-message-error" : undefined}
                      {...register("message")}
                    />
                    <ErrorText id="signup-message-error" message={formState.errors.message?.message} />
                  </div>
                </>
              ) : (
                <>
                  <fieldset className="mt-6" aria-describedby={formState.errors.role ? "signup-role-error" : undefined}>
                    <legend className="text-sm font-semibold">I am a</legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["consumer", "Consumer", "I buy or use legal cannabis and care what is in it."],
                          ["dispensary", "Dispensary", "I work a menu, a counter, or a retail team."],
                          ["cultivator", "Cultivator", "I grow, process, or package product."],
                          ["researcher", "Researcher", "I study chemistry, markets, or reported experience."],
                        ] as const
                      ).map(([value, label, hint]) => (
                        <label key={value} className="role-card flex cursor-pointer gap-3 rounded-xl border border-[#ddd4c4] bg-white p-3">
                          <input type="radio" value={value} className="mt-1" {...register("role")} />
                          <span>
                            <span className="block font-semibold">{label}</span>
                            <span className="mt-1 block text-sm text-[#3d4a44]">{hint}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <ErrorText id="signup-role-error" message={formState.errors.role?.message} />
                  </fieldset>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="signup-company" className="text-sm font-semibold">
                        Company <span className="font-normal text-[#3d4a44]">(optional)</span>
                      </label>
                      <input id="signup-company" autoComplete="organization" className={fieldClass} {...register("company")} />
                      <ErrorText id="signup-company-error" message={formState.errors.company?.message} />
                    </div>
                    <div>
                      <label htmlFor="signup-state" className="text-sm font-semibold">
                        State <span className="font-normal text-[#3d4a44]">(optional)</span>
                      </label>
                      <select id="signup-state" className={fieldClass} autoComplete="address-level1" {...register("state")}>
                        <option value="">Select</option>
                        {US_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label htmlFor="signup-message" className="text-sm font-semibold">
                      Note <span className="font-normal text-[#3d4a44]">(optional)</span>
                    </label>
                    <textarea id="signup-message" rows={4} className={fieldClass} {...register("message")} />
                    <ErrorText id="signup-message-error" message={formState.errors.message?.message} />
                  </div>

                  <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
                    <input type="checkbox" className="mt-1 h-4 w-4" {...register("subscribeToUpdates")} />
                    <span>Send me occasional product updates. You can ask us to stop at any time.</span>
                  </label>
                </>
              )}

              <div className="mt-5">
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    aria-invalid={Boolean(formState.errors.ageConfirmed)}
                    aria-describedby={formState.errors.ageConfirmed ? "signup-age-error" : undefined}
                    {...register("ageConfirmed")}
                  />
                  <span>
                    {business
                      ? "I confirm I am 21 or older and I am asking on behalf of a business, not requesting medical advice."
                      : "I confirm I am 21 or older."}
                  </span>
                </label>
                <ErrorText id="signup-age-error" message={formState.errors.ageConfirmed?.message} />
              </div>

              {serverError && (
                <p role="alert" className="mt-5 rounded-md border border-[#e4c7c1] bg-[#fbf1ef] px-3 py-3 text-sm text-[#7a2e24]">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={formState.isSubmitting}
                aria-busy={formState.isSubmitting}
                className={`mt-6 w-full rounded-full px-5 py-3 text-base font-semibold text-[#f7f4ec] disabled:opacity-60 ${business ? "bg-[#101714]" : "bg-[#0f4d3a]"}`}
              >
                {formState.isSubmitting ? "Saving…" : business ? "Send the inquiry" : "Join the list"}
              </button>
              <p className="mt-4 text-sm leading-relaxed text-[#3d4a44]">
                {business
                  ? "This is an inquiry, not a signed engagement. We read it and reply when we can."
                  : "We store this in our database. Your spot is saved even if a confirmation email is delayed."}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
