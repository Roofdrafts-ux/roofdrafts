import "server-only";
import type { OrderStatus } from "../generated/prisma/enums";

/** Maps the OrderFlow form's report-type key → canonical DB reportType. */
export function normalizeReportType(rtype: string): string {
  switch (rtype) {
    case "residential": return "residential";
    case "commercial": return "commercial";
    case "threeD":
    case "3d-esx": return "3d-esx";
    default: return "residential";
  }
}

/** Maps the OrderFlow turnaround key → canonical DB turnaround. */
export function normalizeTurnaround(turn: string): string {
  switch (turn) {
    case "standard": return "standard";
    case "rush": return "rush";
    case "bulk": return "bulk";
    default: return "standard";
  }
}

/** SLA window in hours for each turnaround tier. */
const SLA_HOURS: Record<string, number> = {
  standard: 10,
  rush: 3,
  bulk: 18,
};

export function computeSlaDueAt(turnaround: string, from: Date): Date {
  const hours = SLA_HOURS[turnaround] ?? 10;
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Customer-facing order number, e.g. RD-48213. Uniqueness is enforced by the
 * DB constraint on displayId — callers retry on collision (P2002).
 */
export function makeDisplayId(rand: () => number = Math.random, digits: 5 | 7 = 5): string {
  const lo = 10 ** (digits - 1);
  return "RD-" + Math.floor(lo + rand() * (9 * lo));
}

/** Human-facing status label + token color key for badges. */
export const STATUS_META: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING:            { label: "Received",          tone: "info" },
  MODELING:           { label: "Modeling",          tone: "accent" },
  QA_REVIEW:          { label: "QA review",         tone: "warning" },
  DELIVERED:          { label: "Delivered",         tone: "success" },
  REVISION_REQUESTED: { label: "Revision requested",tone: "warning" },
  ON_HOLD:            { label: "On hold",           tone: "muted" },
  CANCELLED:          { label: "Cancelled",         tone: "danger" },
};
