import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getRoofExtractor } from "@/lib/roof-extraction";
import { computeRoof } from "@/lib/roofcalc";

/**
 * POST /api/orders/:orderId/ai-draft
 * Estimator-only. Runs the active roof extractor on the order's address, computes geometry via
 * the deterministic engine, and upserts an AI-DRAFTED RoofModel (aiDrafted=true) for the
 * estimator to verify in the measure tool. Never delivers — the QA/DELIVERED guardrail blocks
 * unverified (aiDrafted) and mock models.
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
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  let extracted;
  try {
    extracted = await getRoofExtractor().extract(order.address);
  } catch (e) {
    return NextResponse.json(
      { error: `AI draft failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  // Derive all numbers from the drafted model via the audited engine.
  const computed = computeRoof(extracted.model);
  const data = {
    totalSqFt: computed.totalArea,
    squares: computed.squares,
    predominantPitch: computed.predominantPitch,
    pitchData: computed.facets.map((f) => ({
      id: f.id,
      pitch: f.pitch,
      planArea: f.planArea,
      area: f.area,
    })) as object,
    ridgeFt: computed.byType.ridge,
    hipFt: computed.byType.hip,
    valleyFt: computed.byType.valley,
    rakeFt: computed.byType.rake,
    eaveFt: computed.byType.eave,
    modelData: extracted.model as object,
    isMock: extracted.isMock,
    aiDrafted: true,
    confidence: extracted.confidence,
    source: extracted.source,
    // A fresh draft is unverified — clear any prior human sign-off.
    verifiedById: null,
    verifiedAt: null,
  };

  const roofModel = await prisma.roofModel.upsert({
    where: { orderId },
    create: { orderId, ...data },
    update: data,
  });

  return NextResponse.json({ roofModel });
}
