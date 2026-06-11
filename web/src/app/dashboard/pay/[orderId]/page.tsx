import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getPrice, formatUsd } from "@/lib/pricing";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import "../../dashboard.css";
import "../pay.css";
import { RoofMark } from "@/components/primitives";

export const metadata = { title: "Pay — Roofdrafts" };

export default async function PayPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await requireAuth();
  const { orderId } = await params;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) notFound();
  if (order.paymentStatus === "PAID") redirect("/dashboard");

  const amount = order.priceUsd ?? getPrice(order.reportType, order.turnaround);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  return (
    <div className="rd-dash">
      <header className="rd-dash-header">
        <div className="rd-dash-header-inner">
          <Link href="/dashboard" className="rd-dash-brand">
            <RoofMark size={24} />
            <span className="rd-dash-brand-roof">roof</span>
            <span className="rd-dash-brand-drafts">drafts</span>
          </Link>
          <Link href="/dashboard" className="rd-pay-back">← Back to orders</Link>
        </div>
      </header>

      <main className="rd-pay-main">
        <div className="rd-pay-card">
          <h1 className="rd-pay-h1">Pay for {order.displayId}</h1>
          <div className="rd-pay-summary">
            <div className="rd-pay-row">
              <span>{order.address}</span>
            </div>
            <div className="rd-pay-row rd-pay-total">
              <span>Total</span>
              <span className="rd-pay-amount">{formatUsd(amount)}</span>
            </div>
          </div>

          {publishableKey ? (
            <CheckoutClient
              orderId={order.id}
              displayId={order.displayId}
              amount={amount}
              publishableKey={publishableKey}
              returnUrl={`${appUrl}/dashboard?paid=${order.displayId}`}
            />
          ) : (
            <p className="rd-pay-err">
              Stripe is not configured (set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY).
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
