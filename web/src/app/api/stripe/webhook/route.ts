import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { notifyForOrder } from "@/lib/notify";
import type Stripe from "stripe";

/**
 * POST /api/stripe/webhook — Stripe event sink.
 * Verifies the signature against STRIPE_WEBHOOK_SECRET, then marks the order paid
 * on payment_intent.succeeded. Requires the raw request body for verification.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: `Signature verification failed: ${(e as Error).message}` },
      { status: 400 }
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      // Idempotent: only act if not already paid.
      if (order && order.paymentStatus !== "PAID") {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
            stripePaymentIntentId: intent.id,
          },
        });
        await notifyForOrder(orderId, "payment_received");
      }
    }
  }

  return NextResponse.json({ received: true });
}
