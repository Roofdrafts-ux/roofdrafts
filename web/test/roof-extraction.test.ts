import { describe, it, expect } from "vitest";
import { MockExtractor } from "@/lib/roof-extraction/mock";
import { solarToRoofModel } from "@/lib/roof-extraction/google-solar";
import { computeRoof } from "@/lib/roofcalc";

describe("MockExtractor", () => {
  const ex = new MockExtractor();

  it("is deterministic for the same address", async () => {
    const a = await ex.extract("1412 Magnolia Ave, Fort Worth, TX");
    const b = await ex.extract("1412 Magnolia Ave, Fort Worth, TX");
    expect(a.confidence).toBe(b.confidence);
    expect(JSON.stringify(a.model.v)).toBe(JSON.stringify(b.model.v));
  });

  it("varies by address", async () => {
    const a = await ex.extract("1 Main St");
    const b = await ex.extract("2 Main St");
    expect(JSON.stringify(a.model.v)).not.toBe(JSON.stringify(b.model.v));
  });

  it("returns a mock-flagged draft with confidence in 0.62..0.92", async () => {
    const r = await ex.extract("99 Test Rd");
    expect(r.isMock).toBe(true);
    expect(r.source).toBe("mock");
    expect(r.confidence).toBeGreaterThanOrEqual(0.62);
    expect(r.confidence).toBeLessThanOrEqual(0.92);
  });

  it("produces a valid model the engine can compute (positive area + squares)", async () => {
    const r = await ex.extract("500 Commerce Blvd");
    const m = computeRoof(r.model);
    expect(m.totalArea).toBeGreaterThan(0);
    expect(m.squares).toBeCloseTo(m.totalArea / 100, 6);
    expect(m.facetCount).toBeGreaterThan(0);
  });
});

describe("solarToRoofModel", () => {
  it("maps each roof segment to a facet and yields valid geometry", () => {
    const model = solarToRoofModel([
      { pitchDegrees: 26.57, azimuthDegrees: 180, areaMeters2: 60 }, // ~6/12
      { pitchDegrees: 26.57, azimuthDegrees: 0, areaMeters2: 60 },
    ]);
    expect(model.facets).toHaveLength(2);
    const m = computeRoof(model);
    expect(m.totalArea).toBeGreaterThan(0);
    // 26.57° ≈ 6/12 pitch
    expect(m.predominantPitch).toBe("6/12");
    expect(m.byType.eave).toBeGreaterThan(0);
    expect(m.byType.ridge).toBeGreaterThan(0);
  });
});
