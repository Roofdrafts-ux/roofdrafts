import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildReportData, generateArtifact } from "@/lib/deliverables";
import type { DeliverableKind } from "@/lib/deliverables";

const KIND_MAP: Record<string, DeliverableKind> = {
  pdf: "PDF",
  esx: "XACTIMATE_ESX",
  xml: "XML",
};

/** GET /api/orders/:id/deliverables/:kind — stream the generated artifact. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string; kind: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { orderId, kind } = await params;
  const mapped = KIND_MAP[kind];
  if (!mapped) {
    return NextResponse.json({ error: "Unknown deliverable kind." }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { roofModel: true, organization: true },
  });
  if (!order || !order.roofModel) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // RBAC: estimators/admins always. Customers: must belong to the order (owner OR same-org
  // member), it must be DELIVERED, and paid — individuals pay per report; companies are billed
  // by invoice, so their delivered orders are downloadable.
  const role = session.user.role;
  const isStaff = role === "ESTIMATOR" || role === "ADMIN";
  let allowed = isStaff;
  if (!allowed) {
    let belongs = order.userId === session.user.id;
    if (!belongs && order.organizationId) {
      const m = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: order.organizationId, userId: session.user.id } },
      });
      belongs = !!m;
    }
    const isCompany = order.organization?.type === "COMPANY";
    const paid = order.paymentStatus === "PAID" || isCompany;
    allowed = belongs && order.status === "DELIVERED" && paid;
  }
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = buildReportData(order, order.roofModel, new Date());
  const artifact = await generateArtifact(mapped, data);

  // Guardrail: a customer must never receive a mock artifact, even if owned.
  if (artifact.isMock && !isStaff) {
    return NextResponse.json(
      { error: "Deliverable is a mock draft and cannot be downloaded." },
      { status: 403 }
    );
  }

  return new NextResponse(Buffer.from(artifact.bytes), {
    status: 200,
    headers: {
      "Content-Type": artifact.mimeType,
      "Content-Disposition": `attachment; filename="${artifact.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
