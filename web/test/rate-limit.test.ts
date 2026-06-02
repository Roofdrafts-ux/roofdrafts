import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, clientIp, __resetRateLimits } from "@/lib/rate-limit";

beforeEach(() => __resetRateLimits());

describe("rateLimit", () => {
  it("allows up to the limit, then blocks", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("k", 3, 1000, 0).ok).toBe(true);
    }
    const blocked = rateLimit("k", 3, 1000, 0);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    rateLimit("k", 1, 1000, 0);
    expect(rateLimit("k", 1, 1000, 500).ok).toBe(false);
    expect(rateLimit("k", 1, 1000, 1500).ok).toBe(true); // window passed
  });

  it("isolates keys", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("b", 1, 1000, 0).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers Netlify, then x-forwarded-for, then x-real-ip", () => {
    expect(clientIp(new Headers({ "x-nf-client-connection-ip": "1.1.1.1" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientIp(new Headers({ "x-real-ip": "4.4.4.4" }))).toBe("4.4.4.4");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
