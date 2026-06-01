import { describe, it, expect } from "vitest";
import { renderOrderEmail, type OrderEmailContext } from "@/lib/email/templates";
import type { OrderEmailEvent } from "@/lib/email/types";

const ctx: OrderEmailContext = {
  toEmail: "casey.holt@example.com",
  toName: "Casey Holt",
  displayId: "RD-48213",
  address: "1412 Magnolia Ave, Fort Worth, TX",
  orderUrl: "https://app.example.com/dashboard",
  priceUsd: 6500,
  etaLabel: "Rush · 3 hr",
};

const EVENTS: OrderEmailEvent[] = [
  "received",
  "in_production",
  "delivered",
  "revision_requested",
  "payment_received",
];

describe("order email templates", () => {
  it("renders every lifecycle event with subject, html, text", () => {
    for (const ev of EVENTS) {
      const m = renderOrderEmail(ev, ctx);
      expect(m.to).toBe(ctx.toEmail);
      expect(m.subject).toContain("RD-48213");
      expect(m.html).toContain("RD-48213");
      expect(m.html.toLowerCase()).toContain("roof");
      expect(m.text.length).toBeGreaterThan(20);
      expect(m.html).toContain(ctx.orderUrl);
    }
  });

  it("delivered email mentions the file formats", () => {
    const m = renderOrderEmail("delivered", ctx);
    expect(m.html).toMatch(/PDF/);
    expect(m.html).toMatch(/ESX/);
    expect(m.html).toMatch(/XML/);
  });

  it("payment_received shows the formatted amount", () => {
    const m = renderOrderEmail("payment_received", ctx);
    expect(m.html).toContain("$65.00");
  });

  it("greets by name when present, generically otherwise", () => {
    expect(renderOrderEmail("received", ctx).html).toContain("Casey Holt");
    expect(renderOrderEmail("received", { ...ctx, toName: null }).text).toContain("Hi,");
  });
});
