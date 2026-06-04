import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { writeAudit, ipFromHeaders } from "@/lib/audit";

/** PATCH /api/admin/orders/:orderId/assign  body: { estimatorId | null } — assign/reassign work. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSessionWithRole("ADMIN");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { orderId } = await params;
  const estimatorId = (await req.json().catch(() => ({})))?.estimatorId as string | null | undefined;

  // null/"" → unassign. Otherwise the target must be staff (ESTIMATOR or ADMIN).
  let assignTo: string | null = null;
  if (estimatorId) {
    const target = await prisma.user.findUnique({ where: { id: estimatorId }, select: { id: true, role: true } });
    if (!target || (target.role !== "ESTIMATOR" && target.role !== "ADMIN")) {
      return NextResponse.json({ error: "Assignee must be an estimator or admin." }, { status: 422 });
    }
    assignTo = target.id;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      assignedEstimatorId: assignTo,
      claimedAt: assignTo ? new Date() : null,
      // Pull a fresh assignment into MODELING so it leaves the unclaimed pool.
      status: assignTo && order.status === "PENDING" ? "MODELING" : undefined,
    },
    select: { id: true, assignedEstimatorId: true, status: true },
  });

  await writeAudit({
    actorId: session.user.id, actorEmail: session.user.email, action: "order.assign",
    targetType: "order", targetId: orderId, meta: { estimatorId: assignTo }, ip: ipFromHeaders(req.headers),
  });

  return NextResponse.json({ ok: true, order: updated });
}
