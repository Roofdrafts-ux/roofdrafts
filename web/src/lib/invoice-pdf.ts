import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const CLAY = rgb(0.745, 0.337, 0.188);
const INK = rgb(0.082, 0.071, 0.051);
const INK2 = rgb(0.345, 0.314, 0.255);
const HAIR = rgb(0.81, 0.78, 0.69);

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (d: Date | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

export interface InvoicePdfData {
  number: string;
  status: string;
  orgName: string;
  createdAt: Date;
  dueAt: Date | null;
  subtotalUsd: number;
  discountUsd: number;
  totalUsd: number;
  lines: { displayId: string; address: string; reportType: string; priceUsd: number; date: Date }[];
}

export async function renderInvoicePdf(d: InvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const M = 54;
  let y = height - M;
  const text = (s: string, x: number, yy: number, size: number, f = font, c = INK) =>
    page.drawText(s, { x, y: yy, size, font: f, color: c });

  // Header
  text("roof", M, y, 20, bold, INK);
  text("drafts", M + bold.widthOfTextAtSize("roof", 20), y, 20, bold, INK2);
  text("INVOICE", width - M - 120, y + 2, 18, bold, INK);
  y -= 16;
  text(d.number, width - M - 120, y, 10, font, INK2);
  y -= 24;
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 1, color: CLAY });
  y -= 24;

  // Bill-to + meta
  text("BILL TO", M, y, 8, bold, INK2);
  text("STATUS", width - M - 160, y, 8, bold, INK2);
  text("ISSUED", width - M - 80, y, 8, bold, INK2);
  y -= 14;
  text(d.orgName, M, y, 12, bold, INK);
  text(d.status, width - M - 160, y, 11, bold, d.status === "PAID" ? rgb(0.18, 0.49, 0.2) : CLAY);
  text(date(d.createdAt), width - M - 80, y, 10, font, INK);
  y -= 14;
  text(`Due ${date(d.dueAt)}`, width - M - 80, y, 9, font, INK2);
  y -= 28;

  // Line items
  text("REPORT", M, y, 8, bold, INK2);
  text("PROPERTY", M + 90, y, 8, bold, INK2);
  text("AMOUNT", width - M - 70, y, 8, bold, INK2);
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.75, color: HAIR });
  y -= 16;
  for (const l of d.lines) {
    if (y < M + 90) break;
    text(l.displayId, M, y, 9.5, font, INK);
    const addr = l.address.length > 46 ? l.address.slice(0, 45) + "…" : l.address;
    text(addr, M + 90, y, 9.5, font, INK2);
    text(usd(l.priceUsd), width - M - 70, y, 9.5, font, INK);
    y -= 16;
  }

  // Totals
  y -= 6;
  page.drawLine({ start: { x: width - M - 200, y }, end: { x: width - M, y }, thickness: 0.75, color: HAIR });
  y -= 18;
  const totRow = (label: string, val: string, b = false) => {
    text(label, width - M - 200, y, 10, b ? bold : font, INK2);
    text(val, width - M - 70, y, 10, b ? bold : font, INK);
    y -= 16;
  };
  totRow("Subtotal", usd(d.subtotalUsd));
  if (d.discountUsd > 0) totRow("Volume discount", `- ${usd(d.discountUsd)}`);
  y -= 2;
  totRow("Total due", usd(d.totalUsd), true);

  text("Thank you for your business · Roofdrafts · Net terms apply", M, M - 14, 8, font, INK2);
  return doc.save();
}
