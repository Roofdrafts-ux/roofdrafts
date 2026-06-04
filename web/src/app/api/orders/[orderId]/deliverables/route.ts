import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ALL_KINDS } from "@/lib/deliverables";
import type { DeliverableType } from "@/generated/prisma/enums";

const URL_KIND: Record<string, string> = {
  PDF: "pdf",
  XACTIMATE_ESX: "esx",
  XML: "xml",
};

/**
 * POST /api/orders/:id/deliverables
 * Estimator generates the PDF / ESX / XML deliverable set for an order.
 * Artifacts are produced on demand by the download route from the saved
 * RoofModel, so here we just (re)create the Deliverable index rows.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSessionWithRole("ESTIMATOR");
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { roofModel: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!order.roofModel) {
    return NextResponse.json(
      { error: "No roof model saved — trace and save the roof first." },
      { status: 422 }
    );
  }
  // Mirror the delivery guardrail: never build a real deliverable set from an unverified
  // AI draft or mock imagery.
  if (order.roofModel.aiDrafted) {
    return NextResponse.json(
      { error: "This roof model is an unverified AI draft — verify it before generating deliverables." },
      { status: 422 }
    );
  }
  if (order.roofModel.isMock) {
    return NextResponse.json(
      { error: "This roof model is traced over mock imagery and cannot produce real deliverables." },
      { status: 422 }
    );
  }

  // Reset + recreate the deliverable index for this order.
  await prisma.deliverable.deleteMany({ where: { orderId } });
  await prisma.deliverable.createMany({
    data: ALL_KINDS.map((kind) => ({
      orderId,
      type: kind as DeliverableType,
      url: `/api/orders/${orderId}/deliverables/${URL_KIND[kind]}`,
      storageKey: null,
    })),
  });

  const deliverables = await prisma.deliverable.findMany({ where: { orderId } });
  return NextResponse.json({
    deliverables,
    mock: order.roofModel.isMock,
  });
}
