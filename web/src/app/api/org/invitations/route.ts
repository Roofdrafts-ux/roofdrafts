import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership, orgAtLeast } from "@/lib/org";
import { getEmailer } from "@/lib/email";
import { writeAudit, ipFromHeaders } from "@/lib/audit";
import type { OrgRole } from "@/generated/prisma/enums";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const INVITABLE: OrgRole[] = ["MEMBER", "ADMIN"];

async function sendInvite(to: string, orgName: string, token: string) {
  const url = `${APP_URL}/invite/${token}`;
  await getEmailer().send({
    to,
    subject: `You're invited to join ${orgName} on Roofdrafts`,
    html: `<div style="font-family:sans-serif"><h2>Join ${orgName} on Roofdrafts</h2>
      <p>You've been invited to collaborate on roof reports. Click below to accept:</p>
      <p><a href="${url}" style="background:#BE5630;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Accept invitation</a></p>
      <p style="color:#777;font-size:12px">Or paste this link: ${url}</p></div>`,
    text: `Join ${orgName} on Roofdrafts: ${url}`,
  });
}

/** GET /api/org/invitations — pending invites for the active org (admin+). */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const m = await getCurrentMembership(session.user.id);
  if (!m || !orgAtLeast(m.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const invitations = await prisma.invitation.findMany({
    where: { organizationId: m.organizationId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invitations });
}

/** POST /api/org/invitations — invite a teammate by email (admin+). */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const m = await getCurrentMembership(session.user.id);
  if (!m || !orgAtLeast(m.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = (body?.role as OrgRole) ?? "MEMBER";
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  if (!INVITABLE.includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });

  // Already a member?
  const existingMember = await prisma.organizationMember.findFirst({
    where: { organizationId: m.organizationId, user: { email } },
  });
  if (existingMember) return NextResponse.json({ error: "That person is already a member." }, { status: 409 });

  const token = globalThis.crypto.randomUUID();
  const invitation = await prisma.invitation.upsert({
    where: {
      // re-inviting the same email refreshes the pending invite
      token,
    },
    create: {
      organizationId: m.organizationId,
      email,
      role,
      token,
      invitedById: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    update: {},
  });

  // Clear any older pending invite for the same email in this org.
  await prisma.invitation.updateMany({
    where: { organizationId: m.organizationId, email, status: "PENDING", NOT: { id: invitation.id } },
    data: { status: "REVOKED" },
  });

  try {
    await sendInvite(email, m.orgName, token);
  } catch (e) {
    console.warn(`[invite] email failed: ${(e as Error).message}`);
  }

  await writeAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "member.invite",
    targetType: "organization",
    targetId: m.organizationId,
    meta: { email, role },
    ip: ipFromHeaders(req.headers),
  });

  return NextResponse.json({ ok: true, invitation }, { status: 201 });
}
