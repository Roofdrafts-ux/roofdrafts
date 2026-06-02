import "server-only";
import Stripe from "stripe";

// Lazy init: importing this module must never throw (so `next build` can collect
// route metadata even when STRIPE_SECRET_KEY isn't present at build time). The
// error only surfaces if Stripe is actually used at runtime without a key.
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, { apiVersion: "2026-05-27.dahlia", typescript: true });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});

// Pricing lives in the pure, testable pricing module (single source of truth).
export { REPORT_PRICES, getPrice, type PriceKey } from "./pricing";
