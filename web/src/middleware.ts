/**
 * Edge middleware — uses auth.config.ts (NO Node.js built-ins).
 * Full auth.ts (with PrismaAdapter) is only used in API routes.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
