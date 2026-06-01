/**
 * Server-side RBAC helpers.
 * Always enforce roles server-side — never rely on client-side checks alone.
 */
import { auth } from "./auth";
import { redirect } from "next/navigation";
import type { Role } from "../generated/prisma/client";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireAuth();
  const hierarchy: Role[] = ["CUSTOMER", "ESTIMATOR", "ADMIN"];
  if (hierarchy.indexOf(session.user.role) < hierarchy.indexOf(role)) {
    redirect("/unauthorized");
  }
  return session;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
