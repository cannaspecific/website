import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  partnerRequestSchema,
  waitlistRequestSchema,
  type PartnerRequest,
  type WaitlistRequest,
} from "@shared/requests";
import { US_STATES } from "@/lib/us-states";

type SubmissionResult = {
  success: boolean;
  duplicate?: boolean;
  emailSent?: boolean;
  message: string;
};

const fieldClass =
  "mt-2 w-full rounded-md border border-[#cfc6b6] bg-white px-3 py-3 text-base text-[#14211c] shadow-sm";

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
  return (
    <div role="status" className="rounded-2xl border border-[#cfc6b6] bg-[#f7f4ec] p-8 text-[#14211c]">
      <p className="kicker text-[#0f4d3a]">Saved</p>
      <h3 className="mt-3 font-heading text-3xl">We have your request.</h3>
      <p className="mt-4 text-lg leading-relaxed text-[#24312c]">{result.message}</p>
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

function Honeypot({ register }: { register: ReturnType<typeof useForm<WaitlistRequest>>["register"] }) {
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

export function WaitlistForm() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<WaitlistRequest>({
    resolver: zodResolver(waitlistRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "consumer",
      company: "",
      state: "",
      message: "",
      subscribeToUpdates: false,
      ageConfirmed: false,
      companyWebsite: "",
    },
  });
  const { register, handleSubmit, formState, reset } = form;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const saved = await postForm("/api/waitlist", values);
      setResult(saved);
      reset();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "We couldn't save your request.");
    }
  });

  return (
    <section id="waitlist" className="scroll-mt-24 band-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="kicker text-[#d7f25c]">Waitlist</p>
          <h2 className="mt-3 font-heading text-4xl leading-tight md:text-5xl">Join by the work you do.</h2>
          <p className="ink-muted mt-5 text-lg leading-relaxed">
            Consumers, dispensaries, cultivators, and researchers can leave an email. We store every signup. A confirmation goes out when email delivery is configured.
          </p>
          <p className="ink-muted mt-4 text-sm leading-relaxed">
            Adults 21 and older. Joining the list is not a purchase and not a medical consult.
          </p>
        </div>
        <div className="lg:col-span-7">
          {result ? (
            <SuccessNote result={result} onReset={() => setResult(null)} />
          ) : (
            <form onSubmit={onSubmit} className="relative rounded-2xl bg-[#f7f4ec] p-6 text-[#14211c] md:p-8" noValidate>
              <Honeypot register={register} />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label htmlFor="waitlist-name" className="text-sm font-semibold">Full name</label>
                  <input id="waitlist-name" autoComplete="name" className={fieldClass} aria-invalid={Boolean(formState.errors.fullName)} aria-describedby={formState.errors.fullName ? "waitlist-name-error" : undefined} {...register("fullName")} />
                  <ErrorText id="waitlist-name-error" message={formState.errors.fullName?.message} />
                </div>
                <div>
                  <label htmlFor="waitlist-email" className="text-sm font-semibold">Email</label>
                  <input id="waitlist-email" type="email" autoComplete="email" className={fieldClass} aria-invalid={Boolean(formState.errors.email)} aria-describedby={formState.errors.email ? "waitlist-email-error" : undefined} {...register("email")} />
                  <ErrorText id="waitlist-email-error" message={formState.errors.email?.message} />
                </div>
              </div>

              <fieldset className="mt-6">
                <legend className="text-sm font-semibold">I am a</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    ["consumer", "Consumer", "I buy or use legal cannabis and care what is in it."],
                    ["dispensary", "Dispensary", "I work a menu, a counter, or a retail team."],
                    ["cultivator", "Cultivator", "I grow, process, or package product."],
                    ["researcher", "Researcher", "I study chemistry, markets, or reported experience."],
                  ].map(([value, label, hint]) => (
                    <label key={value} className="role-card flex cursor-pointer gap-3 rounded-xl border border-[#ddd4c4] bg-white p-3">
                      <input type="radio" value={value} className="mt-1" {...register("role")} />
                      <span>
                        <span className="block font-semibold">{label}</span>
                        <span className="mt-1 block text-sm text-[#3d4a44]">{hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <ErrorText id="waitlist-role-error" message={formState.errors.role?.message} />
              </fieldset>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="waitlist-company" className="text-sm font-semibold">Company <span className="font-normal text-[#3d4a44]">(optional)</span></label>
                  <input id="waitlist-company" autoComplete="organization" className={fieldClass} {...register("company")} />
                </div>
                <div>
                  <label htmlFor="waitlist-state" className="text-sm font-semibold">State <span className="font-normal text-[#3d4a44]">(optional)</span></label>
                  <select id="waitlist-state" className={fieldClass} autoComplete="address-level1" {...register("state")}>
                    <option value="">Select</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="waitlist-note" className="text-sm font-semibold">Note <span className="font-normal text-[#3d4a44]">(optional)</span></label>
                <textarea id="waitlist-note" rows={4} className={fieldClass} {...register("message")} />
                <ErrorText id="waitlist-note-error" message={formState.errors.message?.message} />
              </div>

              <div className="mt-5 space-y-3">
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input type="checkbox" className="mt-1 h-4 w-4" {...register("subscribeToUpdates")} />
                  <span>Send me occasional product updates. You can ask us to stop at any time.</span>
                </label>
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input type="checkbox" className="mt-1 h-4 w-4" aria-invalid={Boolean(formState.errors.ageConfirmed)} aria-describedby={formState.errors.ageConfirmed ? "waitlist-age-error" : undefined} {...register("ageConfirmed")} />
                  <span>I confirm I am 21 or older.</span>
                </label>
                <ErrorText id="waitlist-age-error" message={formState.errors.ageConfirmed?.message} />
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
                className="mt-6 w-full rounded-full bg-[#0f4d3a] px-5 py-3 text-base font-semibold text-[#f7f4ec] disabled:opacity-60"
              >
                {formState.isSubmitting ? "Saving…" : "Join the list"}
              </button>
              <p className="mt-4 text-sm leading-relaxed text-[#3d4a44]">
                We store this in our database. If the confirmation email fails, your signup still stands and this page will say so.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export function PartnerForm() {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<PartnerRequest>({
    resolver: zodResolver(partnerRequestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "dispensary",
      company: "",
      state: "FL",
      message: "",
      ageConfirmed: false,
      companyWebsite: "",
    },
  });
  const { register, handleSubmit, formState, reset } = form;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const saved = await postForm("/api/partner", values);
      setResult(saved);
      reset();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "We couldn't save your request.");
    }
  });

  return (
    <section id="partner" className="scroll-mt-24 border-t border-white/10 band-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="kicker text-[#d7f25c]">Pilots</p>
          <h2 className="mt-3 font-heading text-4xl leading-tight md:text-5xl">A separate door for businesses.</h2>
          <p className="ink-muted mt-5 text-lg leading-relaxed">
            Dispensaries, cultivators, and research groups can describe a pilot. This is an inquiry, not a signed engagement. We read it and reply when we can.
          </p>
        </div>
        <div className="lg:col-span-7">
          {result ? (
            <SuccessNote result={result} onReset={() => setResult(null)} />
          ) : (
            <form onSubmit={onSubmit} className="relative rounded-2xl bg-[#f7f4ec] p-6 text-[#14211c] md:p-8" noValidate>
              <div className="hp-field" aria-hidden="true">
                <label htmlFor="partner-website">Leave this field empty</label>
                <input id="partner-website" type="text" tabIndex={-1} autoComplete="off" {...register("companyWebsite")} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="partner-name" className="text-sm font-semibold">Your name</label>
                  <input id="partner-name" autoComplete="name" className={fieldClass} aria-invalid={Boolean(formState.errors.fullName)} {...register("fullName")} />
                  <ErrorText id="partner-name-error" message={formState.errors.fullName?.message} />
                </div>
                <div>
                  <label htmlFor="partner-email" className="text-sm font-semibold">Work email</label>
                  <input id="partner-email" type="email" autoComplete="email" className={fieldClass} aria-invalid={Boolean(formState.errors.email)} {...register("email")} />
                  <ErrorText id="partner-email-error" message={formState.errors.email?.message} />
                </div>
                <div>
                  <label htmlFor="partner-company" className="text-sm font-semibold">Company</label>
                  <input id="partner-company" autoComplete="organization" className={fieldClass} aria-invalid={Boolean(formState.errors.company)} {...register("company")} />
                  <ErrorText id="partner-company-error" message={formState.errors.company?.message} />
                </div>
                <div>
                  <label htmlFor="partner-state" className="text-sm font-semibold">State <span className="font-normal text-[#3d4a44]">(optional)</span></label>
                  <select id="partner-state" className={fieldClass} {...register("state")}>
                    <option value="">Select</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset className="mt-6">
                <legend className="text-sm font-semibold">Business type</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    ["dispensary", "Dispensary"],
                    ["cultivator", "Cultivator"],
                    ["researcher", "Research group"],
                    ["other", "Other business"],
                  ].map(([value, label]) => (
                    <label key={value} className="role-card flex cursor-pointer items-center gap-3 rounded-xl border border-[#ddd4c4] bg-white px-3 py-3">
                      <input type="radio" value={value} {...register("role")} />
                      <span className="font-semibold">{label}</span>
                    </label>
                  ))}
                </div>
                <ErrorText id="partner-role-error" message={formState.errors.role?.message} />
              </fieldset>

              <div className="mt-5">
                <label htmlFor="partner-message" className="text-sm font-semibold">What do you want to try?</label>
                <textarea id="partner-message" rows={5} className={fieldClass} aria-invalid={Boolean(formState.errors.message)} {...register("message")} />
                <ErrorText id="partner-message-error" message={formState.errors.message?.message} />
              </div>

              <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
                <input type="checkbox" className="mt-1 h-4 w-4" {...register("ageConfirmed")} />
                <span>I confirm I am 21 or older and I am asking on behalf of a business, not requesting medical advice.</span>
              </label>
              <ErrorText id="partner-age-error" message={formState.errors.ageConfirmed?.message} />

              {serverError && (
                <p role="alert" className="mt-5 rounded-md border border-[#e4c7c1] bg-[#fbf1ef] px-3 py-3 text-sm text-[#7a2e24]">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={formState.isSubmitting}
                className="mt-6 w-full rounded-full bg-[#101714] px-5 py-3 text-base font-semibold text-[#f7f4ec] disabled:opacity-60"
              >
                {formState.isSubmitting ? "Saving…" : "Send the inquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
