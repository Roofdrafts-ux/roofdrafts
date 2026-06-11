/**
 * Edge-safe auth config — NO database/Node.js-only imports.
 * Used by middleware.ts (Edge runtime) to validate JWT sessions.
 * The full auth.ts adds PrismaAdapter + providers for the API route.
 */
import type { NextAuthConfig } from "next-auth";
import type { Role } from "../generated/prisma/enums";

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
    // Edge-safe session mapping: surface id/role from the JWT so authorized()
    // below can role-gate. Without this the proxy sees auth.user.role as
    // undefined and treats every logged-in user as CUSTOMER (locking staff out
    // of /admin and /estimator). auth.ts overrides this with a version that
    // re-reads the role from the DB; this one only decodes what's in the token.
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role | undefined) ?? "CUSTOMER";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // API routes enforce their own auth in the handler and must return JSON
      // (401/403), not an HTML redirect — let them through the proxy.
      if (pathname.startsWith("/api")) return true;

      // "/" must match exactly — startsWith("/") is true for every path and
      // would mark the whole site public. Other prefixes match on a path
      // boundary so e.g. "/pricing-internal" doesn't ride along with "/pricing".
      // "/report/sample" is deliberately exact-ish: future /report/[orderId]
      // pages must NOT inherit public access by prefix.
      const PUBLIC = ["/auth", "/legal", "/pricing", "/how-it-works", "/unauthorized", "/invite", "/report/sample"];
      // Root-level metadata files (app/icon.svg, app/apple-icon.tsx, robots.ts,
      // sitemap.ts) are fetched by browsers/crawlers without a session.
      // Note: Next serves the apple icon at /apple-icon (no extension).
      const PUBLIC_FILES = ["/favicon.ico", "/icon.svg", "/apple-icon", "/apple-icon.png", "/robots.txt", "/sitemap.xml"];
      const isPublic =
        pathname === "/" ||
        PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
        PUBLIC_FILES.includes(pathname) ||
        pathname.startsWith("/_next");

      if (isPublic) return true;
      if (!isLoggedIn) return false; // middleware will redirect to signIn

      const role = (auth?.user as { role?: string })?.role ?? "CUSTOMER";

      if (pathname.startsWith("/admin") && role !== "ADMIN") return false;
      if (pathname.startsWith("/estimator") && role !== "ESTIMATOR" && role !== "ADMIN") return false;

      return true;
    },
  },
};
