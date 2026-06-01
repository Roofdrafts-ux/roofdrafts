// Pure pricing config — no server-only imports, safe in client, server, and tests.

/** Per-report price table, in US cents. */
export const REPORT_PRICES = {
  residential_standard: 3500,
  residential_rush: 6500,
  commercial_standard: 5500,
  commercial_rush: 9500,
  "3d-esx_standard": 7500,
  "3d-esx_rush": 12500,
  // Bulk is quoted per-property; fall back to standard tier as the unit price.
  residential_bulk: 3000,
  commercial_bulk: 5000,
  "3d-esx_bulk": 7000,
} as const;

export type PriceKey = keyof typeof REPORT_PRICES;

/** Resolve the price for a (reportType, turnaround) pair; falls back to residential/standard. */
export function getPrice(reportType: string, turnaround: string): number {
  const key = `${reportType}_${turnaround}` as PriceKey;
  return REPORT_PRICES[key] ?? REPORT_PRICES.residential_standard;
}

/** Display helper: cents → "$35.00". */
export function formatUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const REPORT_TYPE_LABEL: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  "3d-esx": "3D / ESX",
};
export const TURNAROUND_LABEL: Record<string, string> = {
  standard: "Standard · 6–10 hr",
  rush: "Rush · 3 hr",
  bulk: "Bulk · overnight",
};
