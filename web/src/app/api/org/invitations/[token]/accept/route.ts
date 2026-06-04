import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit, ipFromHeaders } from "@/lib/audit";

/** POST /api/org/invitations/:token/accept — the invited user joins the org. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { token } = await params;
  const invite = await prisma.invitation.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING") {
    return NextResponse.json({ error: "This invitation is no longer valid." }, { status: 410 });
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    await prisma.invitation.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
  }
  if ((session.user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invitation is for ${invite.email}. Sign in with that email to accept.` },
      { status: 403 }
    );
  }

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: invite.organizationId, userId: session.user.id } },
    create: { organizationId: invite.organizationId, userId: session.user.id, role: invite.role },
    update: { role: invite.role },
  });
  await prisma.invitation.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });

  await writeAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "invite.accept",
    targetType: "organization",
    targetId: invite.organizationId,
    meta: { role: invite.role },
    ip: ipFromHeaders(req.headers),
  });

  return NextResponse.json({ ok: true, organizationId: invite.organizationId });
}
