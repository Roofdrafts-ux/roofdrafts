import { describe, it, expect } from "vitest";
import {
  computeRoof,
  polyArea3D,
  polyAreaPlan,
  dist3D,
  slopeFactor,
  ftIn,
  MODEL_GABLE,
  MODEL_CROSS_GABLE,
  type Vec3,
} from "@/lib/roofcalc";

describe("vector + area primitives", () => {
  it("dist3D computes true 3-D distance", () => {
    expect(dist3D([0, 0, 0], [3, 4, 0])).toBeCloseTo(5, 6);
    expect(dist3D([0, 0, 0], [0, 0, 12])).toBeCloseTo(12, 6);
  });

  it("polyAreaPlan returns footprint area (shoelace)", () => {
    const square: Vec3[] = [
      [0, 0, 0],
      [10, 0, 0],
      [10, 10, 0],
      [0, 10, 0],
    ];
    expect(polyAreaPlan(square)).toBeCloseTo(100, 6);
  });

  it("polyArea3D equals plan area for a flat polygon", () => {
    const square: Vec3[] = [
      [0, 0, 0],
      [10, 0, 0],
      [10, 10, 0],
      [0, 10, 0],
    ];
    expect(polyArea3D(square)).toBeCloseTo(100, 6);
  });

  it("polyArea3D exceeds plan area for a sloped polygon by the slope factor", () => {
    // 10x10 footprint tilted so one edge rises 5 ft over a 10 ft run → 6/12 pitch
    const tilted: Vec3[] = [
      [0, 0, 0],
      [10, 0, 0],
      [10, 10, 5],
      [0, 10, 5],
    ];
    const plan = polyAreaPlan(tilted); // 100
    const surface = polyArea3D(tilted);
    const expected = plan * slopeFactor(6); // rise 5 / run 10 = 6/12
    expect(surface).toBeCloseTo(expected, 4);
  });

  it("slopeFactor matches sqrt(1 + (rise/run)^2)", () => {
    expect(slopeFactor(0)).toBeCloseTo(1, 6);
    expect(slopeFactor(12)).toBeCloseTo(Math.SQRT2, 6); // 12/12 = 45°
    expect(slopeFactor(6)).toBeCloseTo(Math.sqrt(1 + 0.25), 6);
  });

  it("ftIn formats decimal feet as feet + inches", () => {
    expect(ftIn(12.5)).toBe("12′ 6″");
    expect(ftIn(10)).toBe("10′ 0″");
    // rounds up to whole foot when inches hit 12
    expect(ftIn(9.999)).toBe("10′ 0″");
  });
});

describe("computeRoof — simple gable (32×24, 5/12)", () => {
  const r = computeRoof(MODEL_GABLE);

  it("derives the predominant pitch from geometry", () => {
    expect(r.predominantPitch).toBe("5/12");
  });

  it("reports two facets", () => {
    expect(r.facetCount).toBe(2);
  });

  it("surfaceArea ≈ planArea × slopeFactor per facet (accuracy contract)", () => {
    for (const f of r.facets) {
      expect(f.area).toBeCloseTo(f.planArea * slopeFactor(f.pitch), 2);
    }
  });

  it("squares = total surface area / 100", () => {
    expect(r.squares).toBeCloseTo(r.totalArea / 100, 6);
  });

  it("a gable has zero hips and zero valleys", () => {
    expect(r.byType.hip).toBe(0);
    expect(r.byType.valley).toBe(0);
    expect(r.byType.ridge).toBeGreaterThan(0);
    expect(r.byType.eave).toBeGreaterThan(0);
  });

  it("ridge length equals the building length (32 ft)", () => {
    expect(r.byType.ridge).toBeCloseTo(32, 4);
  });
});

describe("computeRoof — cross-gable (has valleys)", () => {
  const r = computeRoof(MODEL_CROSS_GABLE);

  it("has valleys where the wings meet", () => {
    expect(r.byType.valley).toBeGreaterThan(0);
  });

  it("every facet honors the slope-factor accuracy contract", () => {
    for (const f of r.facets) {
      expect(f.area).toBeCloseTo(f.planArea * slopeFactor(f.pitch), 1);
    }
  });

  it("total surface area is strictly greater than total plan area", () => {
    expect(r.totalArea).toBeGreaterThan(r.planTotal);
  });
});
