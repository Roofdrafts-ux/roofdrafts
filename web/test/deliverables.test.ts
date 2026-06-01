import { describe, it, expect } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { buildReportData, generateArtifact } from "@/lib/deliverables";
import type { RoofReportData } from "@/lib/deliverables";

const order = { displayId: "RD-99001", address: "1 Test Way, Austin, TX", reportType: "residential" };
const roof = {
  totalSqFt: 2450,
  squares: 24.5,
  predominantPitch: "6/12",
  ridgeFt: 40,
  hipFt: 0,
  valleyFt: 12,
  rakeFt: 60,
  eaveFt: 88,
  pitchData: [
    { id: "S", pitch: 6, planArea: 1100, area: 1230 },
    { id: "N", pitch: 6, planArea: 1100, area: 1230 },
  ],
  isMock: false,
};

function data(over: Partial<RoofReportData> = {}): RoofReportData {
  return { ...buildReportData(order, roof, new Date("2026-06-01T00:00:00Z")), ...over };
}

describe("buildReportData", () => {
  it("maps rows into normalized report data", () => {
    const d = data();
    expect(d.displayId).toBe("RD-99001");
    expect(d.squares).toBe(24.5);
    expect(d.lengths.valley).toBe(12);
    expect(d.facets).toHaveLength(2);
    expect(d.isMock).toBe(false);
  });
});

describe("XML exporter", () => {
  it("emits well-formed report XML with totals", async () => {
    const a = await generateArtifact("XML", data());
    const xml = new TextDecoder().decode(a.bytes);
    expect(xml).toContain("<ReportId>RD-99001</ReportId>");
    expect(xml).toContain("<Squares>24.5</Squares>");
    expect(xml).toContain('<Facets count="2">');
    expect(a.filename).toBe("RD-99001.xml");
  });

  it("flags mock status in the XML + filename", async () => {
    const a = await generateArtifact("XML", data({ isMock: true }));
    const xml = new TextDecoder().decode(a.bytes);
    expect(xml).toContain("<Mock>true</Mock>");
    expect(xml).toContain('status="DRAFT_MOCK"');
    expect(a.filename).toBe("RD-99001-DRAFT.xml");
    expect(a.isMock).toBe(true);
  });
});

describe("ESX exporter", () => {
  it("produces a valid zip containing the sketch + manifest", async () => {
    const a = await generateArtifact("XACTIMATE_ESX", data());
    // ZIP magic bytes 'PK'
    expect(a.bytes[0]).toBe(0x50);
    expect(a.bytes[1]).toBe(0x4b);
    const files = unzipSync(a.bytes);
    expect(Object.keys(files)).toContain("sketch.xml");
    expect(Object.keys(files)).toContain("manifest.json");
    const manifest = JSON.parse(strFromU8(files["manifest.json"]));
    expect(manifest.validatedAgainstXactimate).toBe(false);
  });

  it("includes a do-not-deliver marker when mock", async () => {
    const a = await generateArtifact("XACTIMATE_ESX", data({ isMock: true }));
    const files = unzipSync(a.bytes);
    expect(Object.keys(files).some((f) => /DO-NOT-DELIVER/.test(f))).toBe(true);
  });
});

describe("PDF exporter", () => {
  it("produces a real PDF (%PDF header)", async () => {
    const a = await generateArtifact("PDF", data());
    const header = new TextDecoder().decode(a.bytes.slice(0, 5));
    expect(header).toBe("%PDF-");
    expect(a.mimeType).toBe("application/pdf");
    expect(a.bytes.length).toBeGreaterThan(800);
  });

  it("carries the mock flag + DRAFT filename", async () => {
    const a = await generateArtifact("PDF", data({ isMock: true }));
    expect(a.isMock).toBe(true);
    expect(a.filename).toBe("RD-99001-DRAFT.pdf");
  });
});
