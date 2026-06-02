// Lightweight fixed-window rate limiter.
//
// NOTE: this is an in-process Map — on serverless (Netlify functions) it is per-instance and
// resets on cold start, so treat it as best-effort abuse-dampening, NOT a hard guarantee. For
// strict limits across instances, back this with a shared store (Upstash/Redis) or use the
// platform's edge rate limiting. The interface stays the same when you swap the backend.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/** Allow `limit` requests per `windowMs` for `key` (e.g. an IP + route). */
export function rateLimit(key: string, limit = 10, windowMs = 60_000, now = Date.now()): RateLimitResult {
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfterSec: 0 };
}

/** Extract a best-effort client IP from request headers. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-nf-client-connection-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Test helper — clear all buckets. */
export function __resetRateLimits() {
  buckets.clear();
}
