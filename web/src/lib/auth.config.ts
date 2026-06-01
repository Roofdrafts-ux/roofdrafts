/**
 * Edge-safe auth config — NO database/Node.js-only imports.
 * Used by middleware.ts (Edge runtime) to validate JWT sessions.
 * The full auth.ts adds PrismaAdapter + providers for the API route.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [],  // providers are added in auth.ts only
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const PUBLIC = ["/", "/auth", "/pricing", "/how-it-works", "/unauthorized", "/api/auth"];
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
