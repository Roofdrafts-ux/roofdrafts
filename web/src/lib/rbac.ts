import "server-only";
import { auth } from "./auth";
import type { Role } from "../generated/prisma/enums";

const HIERARCHY: Role[] = ["CUSTOMER", "ESTIMATOR", "ADMIN"];

/** Returns the session if the user has at least `role`, else null. For API routes. */
export async function getSessionWithRole(role: Role) {
  const session = await auth();
  if (!session?.user) return null;
  if (HIERARCHY.indexOf(session.user.role) < HIERARCHY.indexOf(role)) return null;
  return session;
}
