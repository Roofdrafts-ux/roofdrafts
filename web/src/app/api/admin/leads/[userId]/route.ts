import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { writeAudit, ipFromHeaders } from "@/lib/audit";
import type { LeadStatus } from "@/generated/prisma/enums";

const VALID: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];

/** PATCH /api/admin/leads/:userId — update a lead's stage and/or notes. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getSessionWithRole("ADMIN");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  const body = (await req.json().catch(() => ({}))) as { leadStatus?: LeadStatus; leadNotes?: string };

  const data: { leadStatus?: LeadStatus; leadStatusAt?: Date; leadNotes?: string } = {};
  if (body.leadStatus !== undefined) {
    if (!VALID.includes(body.leadStatus)) return NextResponse.json({ error: "Invalid stage." }, { status: 400 });
    data.leadStatus = body.leadStatus;
    data.leadStatusAt = new Date();
  }
  if (body.leadNotes !== undefined) data.leadNotes = String(body.leadNotes).slice(0, 2000);
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { leadStatus: true, email: true } });
  if (!existing) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, leadStatus: true, leadNotes: true, leadStatusAt: true },
  });

  await writeAudit({
    actorId: session.user.id, actorEmail: session.user.email, action: "lead.update",
    targetType: "user", targetId: userId,
    meta: { from: existing.leadStatus, to: data.leadStatus ?? existing.leadStatus, email: existing.email, notesEdited: body.leadNotes !== undefined },
    ip: ipFromHeaders(req.headers),
  });

  return NextResponse.json({ ok: true, user });
}
