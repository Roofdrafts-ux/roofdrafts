import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/stripe/payment-intent  { orderId }
 * Creates (or reuses) a PaymentIntent for the caller's own order. Amount and
 * description are derived SERVER-SIDE from the order — never trusted from the client.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const orderId = body?.orderId as string | undefined;
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Order is already paid." }, { status: 409 });
  }

  const amount = order.priceUsd ?? getPrice(order.reportType, order.turnaround);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    metadata: { orderId, userId: session.user.id },
    automatic_payment_methods: { enabled: true },
    description: `Roofdrafts report ${order.displayId} — ${order.reportType} / ${order.turnaround}`,
  });

  // Record consent + persist price + intent id.
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
  await prisma.order.update({
    where: { id: orderId },
    data: { priceUsd: amount, stripePaymentIntentId: intent.id },
  });

  return NextResponse.json({ clientSecret: intent.client_secret, amount });
}
