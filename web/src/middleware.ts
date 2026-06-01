/**
 * Next.js middleware — protects routes by role.
 * Uses NextAuth v5 auth() as middleware. Runs on the edge.
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/auth",
  "/pricing",
  "/how-it-works",
  "/unauthorized",
  "/api/auth",
];

const ESTIMATOR_PATHS = ["/estimator"];
const ADMIN_PATHS = ["/admin"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth(function middleware(req: any) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  if (!user) {
    const signIn = new URL("/auth/signin", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  const role = user.role as string;

  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (
    ESTIMATOR_PATHS.some((p) => pathname.startsWith(p)) &&
    role !== "ESTIMATOR" &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
