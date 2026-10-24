type Bucket = number[];

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export function createRateLimiter(options: { windowMs: number; max: number }) {
  const hits = new Map<string, Bucket>();

  function check(key: string, now = Date.now()): RateLimitResult {
    const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < options.windowMs);
    if (recent.length >= options.max) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((recent[0] + options.windowMs - now) / 1000),
      );
      hits.set(key, recent);
      return { ok: false, retryAfterSec };
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) {
      Array.from(hits.entries()).forEach(([bucketKey, stamps]) => {
        const fresh = stamps.filter((stamp) => now - stamp < options.windowMs);
        if (fresh.length === 0) hits.delete(bucketKey);
        else hits.set(bucketKey, fresh);
      });
    }
    return { ok: true };
  }

  function reset() {
    hits.clear();
  }

  return { check, reset };
}

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX ?? 8);

export const submissionRateLimit = createRateLimiter({
  windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 10 * 60 * 1000,
  max: Number.isFinite(max) && max > 0 ? max : 8,
});
