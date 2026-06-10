import { describe, it, expect } from "vitest";
import {
  isValidVisitorKey,
  cleanBody,
  cleanEmail,
  cleanName,
  cleanPageUrl,
  canAccessThread,
  isTeamRole,
  CHAT_MAX_BODY,
} from "@/lib/chat";

describe("isValidVisitorKey", () => {
  it("accepts uuid-without-dashes style keys", () => {
    expect(isValidVisitorKey("a".repeat(32))).toBe(true);
    expect(isValidVisitorKey("AbC123_-".repeat(3))).toBe(true);
  });
  it("rejects short, long, and junk keys", () => {
    expect(isValidVisitorKey("short")).toBe(false);
    expect(isValidVisitorKey("x".repeat(65))).toBe(false);
    expect(isValidVisitorKey("has spaces here yes!")).toBe(false);
    expect(isValidVisitorKey(null)).toBe(false);
    expect(isValidVisitorKey(42)).toBe(false);
  });
});

describe("cleanBody", () => {
  it("trims and keeps interior whitespace", () => {
    expect(cleanBody("  hello world  ")).toBe("hello world");
    expect(cleanBody("line one\nline two")).toBe("line one\nline two");
  });
  it("strips control characters but keeps newline/tab", () => {
    expect(cleanBody("a\u0000b\u0007c")).toBe("abc");
    expect(cleanBody("a\tb\nc")).toBe("a\tb\nc");
  });
  it("rejects empty / non-string input", () => {
    expect(cleanBody("   ")).toBeNull();
    expect(cleanBody(undefined)).toBeNull();
    expect(cleanBody(123)).toBeNull();
  });
  it("clamps to the max length", () => {
    expect(cleanBody("x".repeat(CHAT_MAX_BODY + 50))!.length).toBe(CHAT_MAX_BODY);
  });
});

describe("cleanEmail / cleanName", () => {
  it("accepts a normal email and rejects junk", () => {
    expect(cleanEmail(" pat@example.com ")).toBe("pat@example.com");
    expect(cleanEmail("not-an-email")).toBeNull();
    expect(cleanEmail("")).toBeNull();
  });
  it("clamps names", () => {
    expect(cleanName("  Pat  ")).toBe("Pat");
    expect(cleanName("y".repeat(200))!.length).toBe(80);
    expect(cleanName(7)).toBeNull();
  });
});

describe("cleanPageUrl", () => {
  it("keeps only the pathname — never query strings or hashes", () => {
    expect(cleanPageUrl("https://roofdrafts.com/pricing?token=SECRET#x")).toBe("/pricing");
    expect(cleanPageUrl("/measure?id=9")).toBe("/measure");
  });
  it("returns null for junk", () => {
    expect(cleanPageUrl("")).toBeNull();
    expect(cleanPageUrl(undefined)).toBeNull();
  });
});

describe("canAccessThread", () => {
  const thread = { visitorKey: "k".repeat(32), userId: "user_1" };

  it("grants the visitor holding the key", () => {
    expect(canAccessThread({ thread, visitorKey: "k".repeat(32) })).toBe(true);
  });
  it("grants the owning signed-in user", () => {
    expect(canAccessThread({ thread, userId: "user_1" })).toBe(true);
  });
  it("grants team roles regardless of key", () => {
    expect(canAccessThread({ thread, role: "ESTIMATOR" })).toBe(true);
    expect(canAccessThread({ thread, role: "ADMIN" })).toBe(true);
  });
  it("denies everyone else", () => {
    expect(canAccessThread({ thread })).toBe(false);
    expect(canAccessThread({ thread, visitorKey: "wrong".padEnd(32, "x") })).toBe(false);
    expect(canAccessThread({ thread, userId: "user_2", role: "CUSTOMER" })).toBe(false);
  });
});

describe("isTeamRole", () => {
  it("only estimator/admin are team", () => {
    expect(isTeamRole("ESTIMATOR")).toBe(true);
    expect(isTeamRole("ADMIN")).toBe(true);
    expect(isTeamRole("CUSTOMER")).toBe(false);
    expect(isTeamRole(null)).toBe(false);
  });
});
