import "server-only";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import type { Exporter, RoofReportData, DeliverableArtifact } from "./types";

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const fmt = (n: number) => round(n).toLocaleString("en-US");

// Brand palette (clay / ink / paper) — matches the design tokens.
const CLAY = rgb(0.745, 0.337, 0.188);
const INK = rgb(0.082, 0.071, 0.051);
const INK2 = rgb(0.345, 0.314, 0.255);
const HAIR = rgb(0.81, 0.78, 0.69);

export const pdfExporter: Exporter = {
  kind: "PDF",
  async generate(data: RoofReportData): Promise<DeliverableArtifact> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]); // US Letter
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();
    const M = 54;
    let y = height - M;

    const text = (
      s: string,
      x: number,
      yy: number,
      size: number,
      f = font,
      color = INK
    ) => page.drawText(s, { x, y: yy, size, font: f, color });

    // ── Header ──
    text("roof", M, y, 20, bold, INK);
    text("drafts", M + bold.widthOfTextAtSize("roof", 20), y, 20, bold, INK2);
    text("ROOF MEASUREMENT REPORT", width - M - 188, y + 4, 9, bold, INK2);
    y -= 14;
    text(`Report ${data.displayId}`, width - M - 188, y, 9, font, INK2);
    y -= 22;
    page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 1, color: CLAY });
    y -= 26;

    // ── Property ──
    text("PROPERTY", M, y, 8, bold, INK2);
    y -= 15;
    text(data.address, M, y, 13, bold, INK);
    y -= 14;
    text(
      `${data.reportType} · generated ${new Date(data.generatedAt).toLocaleString("en-US")}`,
      M,
      y,
      9,
      font,
      INK2
    );
    y -= 28;

    // ── Headline totals (3 cells) ──
    const cells: [string, string][] = [
      ["TOTAL AREA", `${fmt(data.totalSqFt)} ft²`],
      ["ROOF SQUARES", `${round(data.squares)} SQ`],
      ["PREDOMINANT PITCH", data.predominantPitch],
    ];
    const cellW = (width - M * 2) / 3;
    cells.forEach(([k, v], i) => {
      const x = M + i * cellW;
      text(k, x, y, 8, bold, INK2);
      text(v, x, y - 20, 17, bold, i === 2 ? CLAY : INK);
    });
    y -= 44;
    page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.75, color: HAIR });
    y -= 24;

    // ── Line lengths ──
    text("LINE LENGTHS", M, y, 8, bold, INK2);
    y -= 18;
    const lines: [string, number][] = [
      ["Ridge", data.lengths.ridge],
      ["Hip", data.lengths.hip],
      ["Valley", data.lengths.valley],
      ["Rake", data.lengths.rake],
      ["Eave", data.lengths.eave],
    ];
    lines.forEach(([k, v]) => {
      text(k, M, y, 11, font, INK);
      text(`${fmt(v)} ft`, M + 160, y, 11, bold, INK);
      y -= 17;
    });
    y -= 12;
    page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.75, color: HAIR });
    y -= 24;

    // ── Per-facet table ──
    text("FACETS", M, y, 8, bold, INK2);
    y -= 16;
    text("ID", M, y, 9, bold, INK2);
    text("PITCH", M + 120, y, 9, bold, INK2);
    text("PLAN ft²", M + 220, y, 9, bold, INK2);
    text("SURFACE ft²", M + 340, y, 9, bold, INK2);
    y -= 14;
    data.facets.forEach((f) => {
      if (y < M + 60) return;
      text(f.id, M, y, 10, font, INK);
      text(`${round(f.pitch)}/12`, M + 120, y, 10, font, INK);
      text(fmt(f.planArea), M + 220, y, 10, font, INK);
      text(fmt(f.area), M + 340, y, 10, font, INK);
      y -= 15;
    });

    // ── Footer ──
    text(
      "Surface area via Newell's method on 3-D vertices · squares = surface ÷ 100 · ±2% accuracy contract",
      M,
      M - 14,
      7.5,
      font,
      INK2
    );

    // ── MOCK watermark (diagonal, repeated) ──
    if (data.isMock) {
      const wm = "DRAFT · MOCK IMAGERY · NOT FOR DELIVERY";
      for (let i = 0; i < 4; i++) {
        page.drawText(wm, {
          x: 70,
          y: 150 + i * 180,
          size: 22,
          font: bold,
          color: rgb(0.85, 0.42, 0.3),
          opacity: 0.16,
          rotate: degrees(32),
        });
      }
      // top banner
      page.drawRectangle({ x: 0, y: height - 6, width, height: 6, color: CLAY });
    }

    const bytes = await doc.save();
    return {
      kind: "PDF",
      filename: `${data.displayId}${data.isMock ? "-DRAFT" : ""}.pdf`,
      mimeType: "application/pdf",
      bytes,
      isMock: data.isMock,
    };
  },
};
