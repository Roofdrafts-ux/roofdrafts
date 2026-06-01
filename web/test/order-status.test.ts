import { describe, it, expect } from "vitest";
import { validateTransition, ALLOWED_TRANSITIONS } from "@/lib/order-status";

const ctx = (over: Partial<{ hasModel: boolean; isMock: boolean }> = {}) => ({
  hasModel: true,
  isMock: false,
  ...over,
});

describe("order status state machine", () => {
  it("allows PENDING → MODELING", () => {
    expect(validateTransition("PENDING", "MODELING", ctx()).ok).toBe(true);
  });

  it("rejects illegal edges (PENDING → DELIVERED)", () => {
    const r = validateTransition("PENDING", "DELIVERED", ctx());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Cannot move/);
  });

  it("CANCELLED is terminal", () => {
    expect(ALLOWED_TRANSITIONS.CANCELLED).toHaveLength(0);
  });

  it("QA_REVIEW requires a saved model", () => {
    expect(validateTransition("MODELING", "QA_REVIEW", ctx({ hasModel: false })).ok).toBe(false);
    expect(validateTransition("MODELING", "QA_REVIEW", ctx({ hasModel: true })).ok).toBe(true);
  });

  // The core safety invariant for the whole product:
  it("BLOCKS delivery of a mock-imagery model", () => {
    const r = validateTransition("QA_REVIEW", "DELIVERED", ctx({ isMock: true }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/mock/i);
  });

  it("allows delivery of a real (non-mock) model", () => {
    expect(validateTransition("QA_REVIEW", "DELIVERED", ctx({ isMock: false })).ok).toBe(true);
  });
});
