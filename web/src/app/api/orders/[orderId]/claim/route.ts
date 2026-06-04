import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { writeAudit, ipFromHeaders } from "@/lib/audit";

/** POST /api/orders/:orderId/claim — estimator claims an unassigned order. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSessionWithRole("ESTIMATOR");
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;

  // Atomic claim: only succeeds if currently unassigned (or already mine). Prevents two
  // estimators from claiming the same order (TOCTOU-safe via guarded updateMany).
  const claim = await prisma.order.updateMany({
    where: {
      id: orderId,
      OR: [{ assignedEstimatorId: null }, { assignedEstimatorId: session.user.id }],
    },
    data: { assignedEstimatorId: session.user.id, claimedAt: new Date() },
  });

  if (claim.count === 0) {
    const exists = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    return exists
      ? NextResponse.json({ error: "Order already claimed." }, { status: 409 })
      : NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Move PENDING → MODELING (guarded so we don't clobber a later status).
  await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "MODELING" },
  });

  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  await writeAudit({
    actorId: session.user.id, actorEmail: session.user.email, action: "order.claim",
    targetType: "order", targetId: orderId, ip: ipFromHeaders(req.headers),
  });
  return NextResponse.json({ order: updated });
}

/** DELETE /api/orders/:orderId/claim — release a claim (only the assignee). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSessionWithRole("ESTIMATOR");
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.assignedEstimatorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not your claim." }, { status: 403 });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { assignedEstimatorId: null, claimedAt: null },
  });

  return NextResponse.json({ order: updated });
}
