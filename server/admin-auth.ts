import { timingSafeEqual } from "crypto";

export function tokensMatch(provided: string, expected: string): boolean {
  const actual = Buffer.from(provided);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) {
    timingSafeEqual(wanted, wanted);
    return false;
  }
  return timingSafeEqual(actual, wanted);
}

export function readProvidedAdminToken(header: string | undefined, authorization: string | undefined): string {
  if (header?.trim()) return header.trim();
  if (!authorization) return "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

export function adminAuthorized(
  provided: string,
  expected = process.env.ADMIN_TOKEN,
): "ok" | "disabled" | "unauthorized" {
  const token = expected?.trim();
  if (!token) return "disabled";
  if (!provided || !tokensMatch(provided, token)) return "unauthorized";
  return "ok";
}
