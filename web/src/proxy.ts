/**
 * Proxy (Next.js 16 — renamed from "middleware"). Edge-safe: uses auth.config.ts
 * which has NO Node.js built-ins. The full auth.ts (PrismaAdapter) is only used
 * in API routes. Role-based route protection lives in authConfig.authorized().
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// A proxy file must export a single function as the default export (or named `proxy`).
export default auth;

export const config = {
  // /api is excluded at the matcher level: handlers enforce their own auth
  // (authorized() already returned true for /api), and letting the Auth.js
  // middleware wrap /api/auth/* makes it set a SECOND csrf cookie that
  // clobbers the route handler's — every credentials login then fails with
  // MissingCSRF in production.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
