import { describe, it, expect } from "vitest";
import { makeDisplayId } from "@/lib/orders";

describe("makeDisplayId", () => {
  it("formats as RD-#####", () => {
    expect(makeDisplayId(() => 0)).toBe("RD-10000");
    expect(makeDisplayId(() => 0.9999999)).toBe("RD-99999");
    expect(makeDisplayId()).toMatch(/^RD-\d{5}$/);
  });

  it("spans the full 5-digit range (never collides with the RD-48xxx draft look-alikes only)", () => {
    expect(makeDisplayId(() => 0.5)).toBe("RD-55000");
  });
});
