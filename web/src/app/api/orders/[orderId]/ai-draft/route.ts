import { NextRequest, NextResponse } from "next/server";
import { getSessionWithRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getRoofExtractor } from "@/lib/roof-extraction";
import { computeRoof } from "@/lib/roofcalc";
import { generateReportSummary } from "@/lib/report-summary";

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

  // LLM-written summary (DeepSeek now / Gemini later; deterministic fallback if disabled).
  const summary = await generateReportSummary({
    displayId: order.displayId,
    address: order.address,
    reportType: order.reportType,
    totalSqFt: computed.totalArea,
    squares: computed.squares,
    predominantPitch: computed.predominantPitch,
    lengths: {
      ridge: computed.byType.ridge,
      hip: computed.byType.hip,
      valley: computed.byType.valley,
      rake: computed.byType.rake,
      eave: computed.byType.eave,
    },
    facetCount: computed.facetCount,
  });

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
    summary: summary.text,
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
