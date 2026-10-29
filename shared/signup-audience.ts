export const SIGNUP_AUDIENCES = ["individual", "business"] as const;
export type SignupAudience = (typeof SIGNUP_AUDIENCES)[number];

const HASH_AUDIENCE: Record<string, SignupAudience> = {
  // Older pilot links keep working and open the shared form in business mode.
  partner: "business",
  waitlist: "individual",
  signup: "individual",
};

export function audienceFromHash(hash: string): SignupAudience | null {
  const id = hash.trim().replace(/^#/, "").split(/[?&]/)[0];
  if (!id) return null;
  return HASH_AUDIENCE[id] ?? null;
}

export function hashForAudience(audience: SignupAudience): "#partner" | "#waitlist" {
  return audience === "business" ? "#partner" : "#waitlist";
}

export function signupEndpoint(audience: SignupAudience): "/api/waitlist" | "/api/partner" {
  return audience === "business" ? "/api/partner" : "/api/waitlist";
}
