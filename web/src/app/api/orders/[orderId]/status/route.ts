import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { validateTransition } from "@/lib/order-status";
import { notifyForOrder } from "@/lib/notify";
import type { OrderStatus } from "@/generated/prisma/enums";

const VALID: OrderStatus[] = [
  "PENDING", "MODELING", "QA_REVIEW", "DELIVERED",
  "REVISION_REQUESTED", "ON_HOLD", "CANCELLED",
];

/** PATCH /api/orders/:orderId/status — estimator advances order status. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSessionWithRole("ESTIMATOR");
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  const body = await req.json().catch(() => null);
  const next = body?.status as OrderStatus | undefined;

  if (!next || !VALID.includes(next)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { roofModel: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const check = validateTransition(order.status, next, {
    hasModel: !!order.roofModel,
    isMock: order.roofModel?.isMock ?? false,
    aiDrafted: order.roofModel?.aiDrafted ?? false,
  });
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 422 });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: next,
      deliveredAt: next === "DELIVERED" ? new Date() : order.deliveredAt,
    },
  });

  // Lifecycle emails (best-effort).
  const EVENT: Partial<Record<typeof next, "in_production" | "delivered" | "revision_requested">> = {
    MODELING: "in_production",
    DELIVERED: "delivered",
    REVISION_REQUESTED: "revision_requested",
  };
  const event = EVENT[next];
  if (event) await notifyForOrder(orderId, event);

  return NextResponse.json({ order: updated });
}
