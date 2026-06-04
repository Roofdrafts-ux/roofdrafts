import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership, orgAtLeast } from "@/lib/org";
import { writeAudit, ipFromHeaders } from "@/lib/audit";
import type { OrgRole } from "@/generated/prisma/enums";

const ROLES: OrgRole[] = ["OWNER", "ADMIN", "MEMBER"];

async function ownerCount(orgId: string): Promise<number> {
  return prisma.organizationMember.count({ where: { organizationId: orgId, role: "OWNER" } });
}

/** PATCH /api/org/members/:memberId — change a member's role (OWNER only). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const me = await getCurrentMembership(session.user.id);
  if (!me || me.role !== "OWNER") return NextResponse.json({ error: "Only owners can change roles." }, { status: 403 });

  const { memberId } = await params;
  const role = (await req.json().catch(() => ({})))?.role as OrgRole;
  if (!ROLES.includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });

  const target = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!target || target.organizationId !== me.organizationId) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  if (target.role === "OWNER" && role !== "OWNER" && (await ownerCount(me.organizationId)) <= 1) {
    return NextResponse.json({ error: "An organization must keep at least one owner." }, { status: 422 });
  }

  const updated = await prisma.organizationMember.update({ where: { id: memberId }, data: { role } });
  await writeAudit({
    actorId: session.user.id, actorEmail: session.user.email, action: "member.role.update",
    targetType: "organization_member", targetId: memberId,
    meta: { from: target.role, to: role }, ip: ipFromHeaders(req.headers),
  });
  return NextResponse.json({ ok: true, member: updated });
}

/** DELETE /api/org/members/:memberId — remove a member (admin+; owners only by owners). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const me = await getCurrentMembership(session.user.id);
  if (!me || !orgAtLeast(me.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { memberId } = await params;
  const target = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!target || target.organizationId !== me.organizationId) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  if (target.role === "OWNER" && me.role !== "OWNER") {
    return NextResponse.json({ error: "Only an owner can remove an owner." }, { status: 403 });
  }
  if (target.role === "OWNER" && (await ownerCount(me.organizationId)) <= 1) {
    return NextResponse.json({ error: "An organization must keep at least one owner." }, { status: 422 });
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });
  await writeAudit({
    actorId: session.user.id, actorEmail: session.user.email, action: "member.remove",
    targetType: "organization_member", targetId: memberId,
    meta: { removedUserId: target.userId, role: target.role }, ip: ipFromHeaders(req.headers),
  });
  return NextResponse.json({ ok: true });
}
