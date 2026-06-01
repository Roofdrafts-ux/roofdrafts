import { describe, it, expect } from "vitest";
import { getPrice, formatUsd, REPORT_PRICES } from "@/lib/pricing";
import { isCovered, COVERAGE } from "@/lib/coverage";
import {
  normalizeReportType,
  normalizeTurnaround,
  computeSlaDueAt,
  STATUS_META,
} from "@/lib/orders";

describe("pricing", () => {
  it("resolves known tier prices", () => {
    expect(getPrice("residential", "standard")).toBe(REPORT_PRICES.residential_standard);
    expect(getPrice("commercial", "rush")).toBe(REPORT_PRICES.commercial_rush);
    expect(getPrice("3d-esx", "bulk")).toBe(REPORT_PRICES["3d-esx_bulk"]);
  });

  it("falls back to residential/standard for unknown combos", () => {
    expect(getPrice("nonsense", "whenever")).toBe(REPORT_PRICES.residential_standard);
  });

  it("rush costs more than standard for the same type", () => {
    expect(getPrice("residential", "rush")).toBeGreaterThan(getPrice("residential", "standard"));
  });

  it("formatUsd renders cents as dollars", () => {
    expect(formatUsd(3500)).toBe("$35.00");
    expect(formatUsd(12500)).toBe("$125.00");
  });
});

describe("coverage", () => {
  it("recognizes serviced states (case-insensitive)", () => {
    expect(isCovered("TX")).toBe(true);
    expect(isCovered("tx")).toBe(true);
    expect(isCovered(" nc ")).toBe(true);
  });

  it("rejects unserviced states", () => {
    expect(isCovered("AK")).toBe(false);
    expect(isCovered("")).toBe(false);
  });

  it("every coverage region has a valid imagery tier", () => {
    for (const r of COVERAGE) {
      expect(["premium", "standard"]).toContain(r.imageryTier);
    }
  });
});

describe("order helpers", () => {
  it("normalizes report types incl. the threeD alias", () => {
    expect(normalizeReportType("threeD")).toBe("3d-esx");
    expect(normalizeReportType("residential")).toBe("residential");
    expect(normalizeReportType("garbage")).toBe("residential");
  });

  it("normalizes turnaround", () => {
    expect(normalizeTurnaround("rush")).toBe("rush");
    expect(normalizeTurnaround("???")).toBe("standard");
  });

  it("computes SLA windows: rush sooner than standard sooner than bulk", () => {
    const from = new Date("2026-06-01T12:00:00Z");
    const rush = computeSlaDueAt("rush", from).getTime();
    const standard = computeSlaDueAt("standard", from).getTime();
    const bulk = computeSlaDueAt("bulk", from).getTime();
    expect(rush).toBeLessThan(standard);
    expect(standard).toBeLessThan(bulk);
    // rush = +3h
    expect(rush - from.getTime()).toBe(3 * 3600 * 1000);
  });

  it("STATUS_META covers every status with a tone", () => {
    for (const k of Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]) {
      expect(STATUS_META[k].label).toBeTruthy();
      expect(STATUS_META[k].tone).toBeTruthy();
    }
  });
});
