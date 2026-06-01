import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

/** POST /api/orders/:orderId/claim — estimator claims an unassigned order. */
export async function POST(
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

  // Already claimed by someone else?
  if (order.assignedEstimatorId && order.assignedEstimatorId !== session.user.id) {
    return NextResponse.json({ error: "Order already claimed." }, { status: 409 });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      assignedEstimatorId: session.user.id,
      claimedAt: new Date(),
      status: order.status === "PENDING" ? "MODELING" : order.status,
    },
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
