import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeReportType, normalizeTurnaround, computeSlaDueAt, makeDisplayId } from "@/lib/orders";
import { getPrice } from "@/lib/pricing";
import { notifyForOrder } from "@/lib/notify";
import { getCurrentMembership } from "@/lib/org";

/** GET /api/orders — list the active org's orders (newest first). */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const membership = await getCurrentMembership(session.user.id);
  const orders = await prisma.order.findMany({
    where: membership
      ? { organizationId: membership.organizationId }
      : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { deliverables: true },
  });

  return NextResponse.json({ orders });
}

/** POST /api/orders — create a new order for the signed-in user. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    address,
    city,
    unit,
    rtype,
    turnaround,
    notes,
  } = body as Record<string, string | undefined>;

  if (!address || address.trim().length < 4) {
    return NextResponse.json({ error: "A valid street address is required." }, { status: 400 });
  }

  const reportType = normalizeReportType(rtype ?? "residential");
  const turn = normalizeTurnaround(turnaround ?? "standard");
  const now = new Date();

  const fullAddress = [address.trim(), unit?.trim(), city?.trim()]
    .filter(Boolean)
    .join(", ");

  const membership = await getCurrentMembership(session.user.id);

  const data = {
    userId: session.user.id,
    organizationId: membership?.organizationId ?? null,
    status: "PENDING" as const,
    address: fullAddress,
    reportType,
    turnaround: turn,
    notes: notes?.trim() || null,
    slaDueAt: computeSlaDueAt(turn, now),
    priceUsd: getPrice(reportType, turn),
  };

  // Customer-facing RD-##### number; retry the rare collision (unique
  // constraint on displayId), then fall back to the schema default (cuid).
  let order = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await prisma.order.create({ data: { ...data, displayId: makeDisplayId() } });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!order) order = await prisma.order.create({ data });

  // Best-effort "order received" email (never blocks the response).
  await notifyForOrder(order.id, "received");

  return NextResponse.json({ order }, { status: 201 });
}
