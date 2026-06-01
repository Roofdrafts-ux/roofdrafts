import "server-only";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});

/** Price table — cents */
export const REPORT_PRICES = {
  residential_standard: 3500,   // $35.00
  residential_rush:     6500,   // $65.00
  commercial_standard:  5500,   // $55.00
  commercial_rush:      9500,   // $95.00
  "3d-esx_standard":    7500,   // $75.00
  "3d-esx_rush":       12500,   // $125.00
} as const;

export type PriceKey = keyof typeof REPORT_PRICES;

export function getPrice(reportType: string, turnaround: string): number {
  const key = `${reportType}_${turnaround}` as PriceKey;
  return REPORT_PRICES[key] ?? REPORT_PRICES["residential_standard"];
}
