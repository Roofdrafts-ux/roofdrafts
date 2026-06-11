import { describe, it, expect } from "vitest";
import { relTime, fmtUsd, typeMeta, initials, avatarBucket } from "@/lib/admin-format";

const NOW = new Date("2026-06-11T12:00:00Z");

describe("relTime", () => {
  it("formats past deltas compactly", () => {
    expect(relTime(new Date("2026-06-11T11:59:40Z"), NOW)).toBe("just now");
    expect(relTime(new Date("2026-06-11T11:30:00Z"), NOW)).toBe("30m ago");
    expect(relTime(new Date("2026-06-11T05:00:00Z"), NOW)).toBe("7h ago");
    expect(relTime(new Date("2026-06-08T12:00:00Z"), NOW)).toBe("3d ago");
  });
  it("shows an absolute date for future inputs instead of 'just now'", () => {
    expect(relTime(new Date("2026-06-14T12:00:00Z"), NOW)).toMatch(/Jun/);
  });
});

describe("fmtUsd", () => {
  it("renders whole dollars without cents and null as a dash", () => {
    expect(fmtUsd(3500)).toBe("$35");
    expect(fmtUsd(123450)).toBe("$1,234.50");
    expect(fmtUsd(null)).toBe("—");
    expect(fmtUsd(0)).toBe("$0");
  });
});

describe("typeMeta / initials / avatarBucket", () => {
  it("maps report types and defaults unknown to residential", () => {
    expect(typeMeta("commercial").label).toBe("COM");
    expect(typeMeta("3d-esx").label).toBe("3D");
    expect(typeMeta("anything").label).toBe("RES");
  });
  it("derives initials with email fallback", () => {
    expect(initials("Tara Whitfield")).toBe("TW");
    expect(initials(null, "pat@example.com")).toBe("P");
    expect(initials("Cher")).toBe("C");
  });
  it("buckets are stable and in range", () => {
    const b = avatarBucket("pat@example.com");
    expect(b).toBe(avatarBucket("pat@example.com"));
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(6);
  });
});
