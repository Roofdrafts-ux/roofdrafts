import { describe, it, expect } from "vitest";
import { buildSummaryPrompt, fallbackSummary, type SummaryInput } from "@/lib/report-summary";

const input: SummaryInput = {
  displayId: "RD-48213",
  address: "1412 Magnolia Ave, Fort Worth, TX",
  reportType: "residential",
  totalSqFt: 2039,
  squares: 20.4,
  predominantPitch: "6/12",
  lengths: { ridge: 88, hip: 0, valley: 36, rake: 80, eave: 128 },
  facetCount: 4,
};

describe("buildSummaryPrompt", () => {
  it("includes system + user messages grounded in the real numbers", () => {
    const msgs = buildSummaryPrompt(input);
    expect(msgs[0].role).toBe("system");
    expect(msgs[0].content).toMatch(/never invent/i);
    const user = msgs[1].content;
    expect(user).toContain("RD-48213");
    expect(user).toContain("1412 Magnolia Ave");
    expect(user).toContain("2039");
    expect(user).toContain("6/12");
  });
});

describe("fallbackSummary", () => {
  it("produces a deterministic factual summary from the numbers", () => {
    const s = fallbackSummary(input);
    expect(s).toContain("RD-48213");
    expect(s).toContain("20.4 roofing squares");
    expect(s).toContain("6/12");
    expect(s).toContain("eave 128 ft");
    // deterministic
    expect(fallbackSummary(input)).toBe(s);
  });
});
