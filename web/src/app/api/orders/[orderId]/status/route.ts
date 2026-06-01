import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/enums";

const VALID: OrderStatus[] = [
  "PENDING", "MODELING", "QA_REVIEW", "DELIVERED",
  "REVISION_REQUESTED", "ON_HOLD", "CANCELLED",
];

/** Allowed forward transitions for an estimator. */
const ALLOWED: Record<string, OrderStatus[]> = {
  PENDING: ["MODELING", "ON_HOLD", "CANCELLED"],
  MODELING: ["QA_REVIEW", "ON_HOLD"],
  QA_REVIEW: ["DELIVERED", "MODELING", "REVISION_REQUESTED"],
  REVISION_REQUESTED: ["MODELING"],
  ON_HOLD: ["MODELING", "CANCELLED"],
  DELIVERED: ["REVISION_REQUESTED"],
  CANCELLED: [],
};

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

  if (!ALLOWED[order.status]?.includes(next)) {
    return NextResponse.json(
      { error: `Cannot move from ${order.status} to ${next}.` },
      { status: 422 }
    );
  }

  // Guardrail: cannot deliver a report whose model was traced over mock imagery.
  if (next === "DELIVERED" && order.roofModel?.isMock) {
    return NextResponse.json(
      { error: "Cannot deliver: roof model is flagged as mock (traced over mock imagery)." },
      { status: 422 }
    );
  }
  if (next === "QA_REVIEW" && !order.roofModel) {
    return NextResponse.json(
      { error: "Cannot send to QA: no roof model saved yet." },
      { status: 422 }
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: next,
      deliveredAt: next === "DELIVERED" ? new Date() : order.deliveredAt,
    },
  });

  return NextResponse.json({ order: updated });
}
