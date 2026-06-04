/**
 * Edge-safe auth config — NO database/Node.js-only imports.
 * Used by middleware.ts (Edge runtime) to validate JWT sessions.
 * The full auth.ts adds PrismaAdapter + providers for the API route.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  // Required behind a hosting proxy (Netlify/Vercel) — without it NextAuth v5
  // rejects requests with "UntrustedHost" in production.
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [],  // providers are added in auth.ts only
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // API routes enforce their own auth in the handler and must return JSON
      // (401/403), not an HTML redirect — let them through the proxy.
      if (pathname.startsWith("/api")) return true;

      const PUBLIC = ["/", "/auth", "/legal", "/pricing", "/how-it-works", "/unauthorized", "/invite"];
      const isPublic = PUBLIC.some((p) => pathname.startsWith(p)) ||
        pathname.startsWith("/_next") || pathname.startsWith("/favicon");

      if (isPublic) return true;
      if (!isLoggedIn) return false; // middleware will redirect to signIn

      const role = (auth?.user as { role?: string })?.role ?? "CUSTOMER";

      if (pathname.startsWith("/admin") && role !== "ADMIN") return false;
      if (pathname.startsWith("/estimator") && role !== "ESTIMATOR" && role !== "ADMIN") return false;

      return true;
    },
  },
};
