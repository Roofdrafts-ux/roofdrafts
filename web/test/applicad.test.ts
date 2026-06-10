import { describe, it, expect } from "vitest";
import {
  parseAppliCad,
  summarizeRoof,
  loopToPolygon,
  planBounds,
  pitchLabel,
} from "@/lib/applicad";
import { SAMPLE_ROOF_XML } from "@/data/sample-roof";

// Ground truth: the vendor-generated PDF report for the same address
// (13 Rivers Run Way, Oak Ridge TN) — "Total Area summary" + "Edge Length
// Summary" pages.
const PDF = {
  areaSf: 5073.95,
  squares: 50.74,
  eave: 276.29,
  rake: 235.1,
  hip: 43.57,
  valley: 190.76,
  ridge: 152.28,
  step: 72.02,
  apron: 148.87,
};

const roof = parseAppliCad(SAMPLE_ROOF_XML);
const summary = summarizeRoof(roof);

describe("parseAppliCad", () => {
  it("parses all points, lines and faces", () => {
    expect(Object.keys(roof.points).length).toBe(101);
    expect(Object.keys(roof.lines).length).toBe(119);
    expect(roof.faces.length).toBe(28);
  });

  it("every face loop references known lines", () => {
    for (const f of roof.faces) {
      for (const loop of f.loops) {
        for (const id of loop) expect(roof.lines[id], `${f.id} → ${id}`).toBeDefined();
      }
    }
  });
});

describe("summarizeRoof — matches the vendor PDF", () => {
  it("total area and squares", () => {
    expect(summary.totalAreaSf).toBeCloseTo(PDF.areaSf, 1);
    expect(summary.squares).toBeCloseTo(PDF.squares, 1);
  });

  it("edge lengths by type", () => {
    expect(summary.edgeLf["EAVE"]).toBeCloseTo(PDF.eave, 1);
    expect(summary.edgeLf["RAKE"]).toBeCloseTo(PDF.rake, 1);
    expect(summary.edgeLf["HIP"]).toBeCloseTo(PDF.hip, 1);
    expect(summary.edgeLf["VALLEY"]).toBeCloseTo(PDF.valley, 1);
    expect(summary.edgeLf["RIDGE"]).toBeCloseTo(PDF.ridge, 1);
    expect(summary.edgeLf["STEP"]).toBeCloseTo(PDF.step, 1);
    expect(summary.edgeLf["APRON"]).toBeCloseTo(PDF.apron, 1);
  });

  it("perimeter = eave + rake", () => {
    expect(summary.perimeterLf).toBeCloseTo(PDF.eave + PDF.rake, 1);
  });

  it("waste table multiplies area correctly (PDF: 10% → 55.81 sq)", () => {
    const w10 = summary.wasteRows.find((w) => w.pct === 10)!;
    expect(w10.squares).toBeCloseTo(55.81, 1);
    const w0 = summary.wasteRows.find((w) => w.pct === 0)!;
    expect(w0.areaSf).toBeCloseTo(summary.totalAreaSf, 6);
  });

  it("pitch table covers the full area and 12/12 dominates", () => {
    const total = summary.pitchRows.reduce((s, r) => s + r.areaSf, 0);
    expect(total).toBeCloseTo(summary.totalAreaSf, 4);
    expect(summary.predominantPitch).toBe("12/12");
    const labels = summary.pitchRows.map((r) => r.label);
    expect(labels).toContain("2/12");
    expect(labels).toContain("11/12");
  });
});

describe("plan geometry", () => {
  it("chains every face loop into a drawable polygon", () => {
    for (const f of roof.faces) {
      for (const loop of f.loops) {
        const poly = loopToPolygon(loop, roof);
        expect(poly.length, `${f.id}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("bounds are sane for this roof (~52ft × ~80ft footprint)", () => {
    const b = planBounds(roof);
    expect(b.maxX - b.minX).toBeGreaterThan(40);
    expect(b.maxX - b.minX).toBeLessThan(70);
    expect(b.maxY - b.minY).toBeGreaterThan(60);
    expect(b.maxY - b.minY).toBeLessThan(100);
  });
});

describe("pitchLabel", () => {
  it("snaps to halves and flags flat", () => {
    expect(pitchLabel(12)).toBe("12/12");
    expect(pitchLabel(11.03)).toBe("11/12");
    expect(pitchLabel(13.5)).toBe("13.5/12");
    expect(pitchLabel(0.05)).toBe("flat");
  });
});
