import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, getPrice } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, reportType, turnaround } = body as {
    orderId?: string;
    reportType?: string;
    turnaround?: string;
  };

  if (!orderId || !reportType || !turnaround) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Verify the order belongs to this user
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const amount = getPrice(reportType, turnaround);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    metadata: {
      orderId,
      userId: session.user.id,
      reportType,
      turnaround,
    },
    automatic_payment_methods: { enabled: true },
    description: `Roofdrafts report — ${reportType} / ${turnaround}`,
  });

  // Record consent for the payment at intent creation time
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";

  await prisma.consentRecord.create({
    data: {
      userId: session.user.id,
      orderId,
      type: "stripe_payment_v1",
      ipAddress: ip,
      userAgent: ua,
    },
  });

  // Update order with price
  await prisma.order.update({
    where: { id: orderId },
    data: { priceUsd: amount },
  });

  return NextResponse.json({ clientSecret: intent.client_secret });
}
