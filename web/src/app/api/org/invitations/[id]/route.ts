import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership, orgAtLeast } from "@/lib/org";
import { writeAudit, ipFromHeaders } from "@/lib/audit";

/** DELETE /api/org/invitations/:id — revoke a pending invitation (admin+). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const me = await getCurrentMembership(session.user.id);
  if (!me || !orgAtLeast(me.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const invite = await prisma.invitation.findUnique({ where: { id } });
  if (!invite || invite.organizationId !== me.organizationId) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  }

  await prisma.invitation.update({ where: { id }, data: { status: "REVOKED" } });
  await writeAudit({
    actorId: session.user.id, actorEmail: session.user.email, action: "invite.revoke",
    targetType: "invitation", targetId: id, meta: { email: invite.email }, ip: ipFromHeaders(req.headers),
  });
  return NextResponse.json({ ok: true });
}
