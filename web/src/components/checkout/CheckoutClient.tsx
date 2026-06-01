"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CheckoutClient({
  orderId,
  displayId,
  amount,
  publishableKey,
  returnUrl,
}: {
  orderId: string;
  displayId: string;
  amount: number;
  publishableKey: string;
  returnUrl: string;
}) {
  const stripePromise = useMemo<Promise<Stripe | null>>(
    () => loadStripe(publishableKey),
    [publishableKey]
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!active) return;
      if (res.ok && data.clientSecret) setClientSecret(data.clientSecret);
      else setErr(data.error ?? "Could not start checkout.");
    })();
    return () => {
      active = false;
    };
  }, [orderId]);

  if (err) return <p className="rd-pay-err">{err}</p>;
  if (!clientSecret) return <p className="rd-pay-loading">Preparing secure checkout…</p>;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "flat",
          variables: {
            colorPrimary: "#BE5630",
            colorText: "#15120D",
            fontFamily: "system-ui, sans-serif",
            borderRadius: "6px",
          },
        },
      }}
    >
      <PayForm displayId={displayId} amount={amount} returnUrl={returnUrl} />
    </Elements>
  );
}

function PayForm({
  displayId,
  amount,
  returnUrl,
}: {
  displayId: string;
  amount: number;
  returnUrl: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setErr("");
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    // If we reach here, confirmation failed before redirect.
    if (error) {
      setErr(error.message ?? "Payment failed.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rd-pay-form">
      <PaymentElement />
      {err && <p className="rd-pay-err">{err}</p>}
      <button type="submit" disabled={!stripe || busy} className="nj2-btn nj2-btn-brand nj2-btn-lg rd-pay-submit">
        {busy ? "Processing…" : `Pay ${dollars(amount)} · ${displayId}`}
      </button>
      <p className="rd-pay-note">Payments are processed securely by Stripe. Test mode in development.</p>
    </form>
  );
}
