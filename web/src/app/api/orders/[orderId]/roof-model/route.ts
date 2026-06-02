import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/orders/:orderId/roof-model
 * Estimator saves the traced + computed roof model for an order.
 * Body: {
 *   totalSqFt, squares, predominantPitch,
 *   byType: { ridge, hip, valley, rake, eave },
 *   facets: [{ id, pitch, planArea, area }],
 *   modelData: <raw RoofModel vertices/edges/facets>,
 *   isMock: boolean   // true when traced over mock imagery — blocks delivery
 * }
 */
export async function PUT(
  req: NextRequest,
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

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const {
    totalSqFt, squares, predominantPitch, byType, facets, modelData, isMock,
  } = body as {
    totalSqFt?: number;
    squares?: number;
    predominantPitch?: string;
    byType?: { ridge: number; hip: number; valley: number; rake: number; eave: number };
    facets?: Array<{ id: string; pitch: number; planArea: number; area: number }>;
    modelData?: unknown;
    isMock?: boolean;
  };

  if (
    typeof totalSqFt !== "number" ||
    typeof squares !== "number" ||
    !predominantPitch ||
    !byType
  ) {
    return NextResponse.json({ error: "Missing geometry fields." }, { status: 400 });
  }

  const data = {
    totalSqFt,
    squares,
    predominantPitch,
    pitchData: (facets ?? []) as object,
    ridgeFt: byType.ridge ?? 0,
    hipFt: byType.hip ?? 0,
    valleyFt: byType.valley ?? 0,
    rakeFt: byType.rake ?? 0,
    eaveFt: byType.eave ?? 0,
    modelData: (modelData ?? null) as object,
    // Default to mock-safe: only false when the client explicitly says imagery is real.
    isMock: isMock !== false,
    // A manual save through the measure tool IS the human verification step:
    // clear the AI-draft flag and stamp the verifying estimator.
    aiDrafted: false,
    verifiedById: session.user.id,
    verifiedAt: new Date(),
  };

  const roofModel = await prisma.roofModel.upsert({
    where: { orderId },
    create: { orderId, ...data },
    update: data,
  });

  return NextResponse.json({ roofModel });
}
