// Canonical site config. Production domain is roofdrafts.com; override per-env
// with NEXT_PUBLIC_SITE_URL (e.g. a preview or staging host).

export const SITE = {
  name: "Roofdrafts",
  domain: "roofdrafts.com",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://roofdrafts.com").replace(/\/$/, ""),
  description:
    "Order an aerial roof-measurement report by address. Human-verified pitch, area, squares and line lengths delivered as PDF, Xactimate ESX and XML within a 6–10 hr SLA.",
  twitter: "@roofdrafts",
} as const;
