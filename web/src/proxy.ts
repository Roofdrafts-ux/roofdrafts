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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
