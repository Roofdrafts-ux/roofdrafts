import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmails } from "@/lib/settings";
import { getEmailer } from "@/lib/email";
import { writeAudit, ipFromHeaders } from "@/lib/audit";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

/** POST /api/orders/:orderId/revision — a customer requests a revision on a delivered report. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Authorize: owner or same-org member.
  let belongs = order.userId === session.user.id;
  if (!belongs && order.organizationId) {
    const m = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: order.organizationId, userId: session.user.id } },
    });
    belongs = !!m;
  }
  if (!belongs) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "DELIVERED") {
    return NextResponse.json({ error: "Only delivered reports can be sent back for revision." }, { status: 422 });
  }

  const reason = String((await req.json().catch(() => ({})))?.reason ?? "").trim().slice(0, 1000);
  const note = `[Revision requested ${new Date().toISOString()}] ${reason || "(no reason given)"}`;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "REVISION_REQUESTED", notes: order.notes ? `${order.notes}\n${note}` : note },
  });

  await writeAudit({
    actorId: session.user.id, actorEmail: session.user.email, action: "order.revision_request",
    targetType: "order", targetId: orderId, meta: { displayId: order.displayId, reason }, ip: ipFromHeaders(req.headers),
  });

  // Alert the team (best-effort).
  try {
    const recipients = await getEmails("lead_alert_emails");
    if (recipients.length) {
      await Promise.all(recipients.map((to) => getEmailer().send({
        to,
        subject: `Revision requested: ${order.displayId}`,
        html: `<div style="font-family:sans-serif"><h2>Revision requested — ${order.displayId}</h2>
          <p>${session.user.email} asked for a revision on <b>${order.address}</b>.</p>
          <p>Reason: ${reason || "(none)"}</p>
          <p><a href="${APP_URL}/estimator/${orderId}">Open in estimator console</a></p></div>`,
        text: `Revision requested on ${order.displayId} by ${session.user.email}. Reason: ${reason || "(none)"}`,
      })));
    }
  } catch (e) {
    console.warn(`[revision] alert failed: ${(e as Error).message}`);
  }

  return NextResponse.json({ ok: true });
}
