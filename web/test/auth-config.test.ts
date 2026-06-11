import { describe, it, expect } from "vitest";
import { authConfig } from "@/lib/auth.config";

type Role = "CUSTOMER" | "ESTIMATOR" | "ADMIN";

// Invoke the proxy's authorized() callback the way NextAuth does:
// true = let the request through; false = redirect to signIn (or 401 for APIs).
function authorized(pathname: string, role?: Role | null) {
  const cb = authConfig.callbacks!.authorized!;
  return cb({
    auth: role ? ({ user: { role } } as never) : null,
    request: { nextUrl: new URL(`https://roofdrafts.com${pathname}`) } as never,
  });
}

describe("proxy authorized() route protection", () => {
  describe("public routes (no session)", () => {
    it.each([
      "/",
      "/auth/signin",
      "/auth/signup",
      "/legal/privacy",
      "/legal/terms",
      "/pricing",
      "/how-it-works",
      "/unauthorized",
      "/invite/some-token",
      "/report/sample",
      "/icon.svg",
      "/apple-icon",
      "/apple-icon.png",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
      "/_next/static/chunk.js",
    ])("allows %s", (path) => {
      expect(authorized(path, null)).toBe(true);
    });
  });

  describe("API passthrough (handlers do their own auth and must return JSON)", () => {
    it("lets /api/* through even without a session", () => {
      expect(authorized("/api/orders", null)).toBe(true);
      expect(authorized("/api/auth/session", null)).toBe(true);
    });
  });

  describe("protected routes without a session", () => {
    it.each(["/dashboard", "/dashboard/billing", "/admin", "/estimator", "/measure", "/go"])(
      "blocks %s (proxy redirects to signin)",
      (path) => {
        expect(authorized(path, null)).toBe(false);
      },
    );
  });

  describe("role gates", () => {
    it("blocks CUSTOMER from /admin and /estimator", () => {
      expect(authorized("/admin", "CUSTOMER")).toBe(false);
      expect(authorized("/admin/users", "CUSTOMER")).toBe(false);
      expect(authorized("/estimator", "CUSTOMER")).toBe(false);
    });

    it("blocks ESTIMATOR from /admin but allows /estimator", () => {
      expect(authorized("/admin", "ESTIMATOR")).toBe(false);
      expect(authorized("/estimator", "ESTIMATOR")).toBe(true);
    });

    it("allows ADMIN everywhere", () => {
      expect(authorized("/admin/settings", "ADMIN")).toBe(true);
      expect(authorized("/estimator", "ADMIN")).toBe(true);
      expect(authorized("/dashboard", "ADMIN")).toBe(true);
    });

    it("allows any logged-in role on /dashboard", () => {
      expect(authorized("/dashboard", "CUSTOMER")).toBe(true);
    });
  });

  describe("prefix-matching regressions", () => {
    it('does not treat every path as public via the "/" prefix', () => {
      // The original bug: PUBLIC included "/" matched with startsWith, so
      // every pathname was public and the role gates below were dead code.
      expect(authorized("/dashboard", null)).toBe(false);
      expect(authorized("/admin", "CUSTOMER")).toBe(false);
    });

    it("matches public prefixes only on a path boundary", () => {
      expect(authorized("/pricing-internal", null)).toBe(false);
      expect(authorized("/authoring", null)).toBe(false);
      expect(authorized("/legalese", null)).toBe(false);
    });
  });
});
