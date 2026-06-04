import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireAuth } from "./auth-helpers";
import type { OrgRole, OrgType } from "@/generated/prisma/enums";

const ORG_RANK: Record<OrgRole, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };
export function orgAtLeast(role: OrgRole, min: OrgRole): boolean {
  return ORG_RANK[role] >= ORG_RANK[min];
}

export const ORG_COOKIE = "org_id";

export interface CurrentMembership {
  membershipId: string;
  organizationId: string;
  orgName: string;
  orgType: OrgType;
  role: OrgRole;
}

/** All orgs a user belongs to (oldest first). */
export async function getMemberships(userId: string) {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Resolve the user's active org: the `org_id` cookie if it points to a real
 * membership, else their OWNER org, else their first membership.
 */
export async function getCurrentMembership(userId: string): Promise<CurrentMembership | null> {
  const memberships = await getMemberships(userId);
  if (memberships.length === 0) return null;
  const wanted = (await cookies()).get(ORG_COOKIE)?.value;
  const chosen =
    (wanted && memberships.find((m) => m.organizationId === wanted)) ||
    memberships.find((m) => m.role === "OWNER") ||
    memberships[0];
  return {
    membershipId: chosen.id,
    organizationId: chosen.organizationId,
    orgName: chosen.organization.name,
    orgType: chosen.organization.type,
    role: chosen.role,
  };
}

/** Page guard: require an active org membership at >= `min` role. */
export async function requireOrg(min: OrgRole = "MEMBER") {
  const session = await requireAuth();
  const membership = await getCurrentMembership(session.user.id);
  if (!membership) redirect("/dashboard");
  if (!orgAtLeast(membership.role, min)) redirect("/unauthorized");
  return { session, membership };
}

/** Create an organization and make `userId` its OWNER. Used at signup. */
export async function createOrgForUser(
  userId: string,
  name: string,
  type: OrgType,
  role: OrgRole = "OWNER"
) {
  return prisma.organization.create({
    data: { name, type, members: { create: { userId, role } } },
  });
}
