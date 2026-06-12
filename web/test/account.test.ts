import { describe, it, expect } from "vitest";
import { validatePassword, MIN_PASSWORD_LEN } from "@/lib/account";
import { renderPasswordResetEmail, renderVerifyEmail } from "@/lib/email/auth-templates";

describe("validatePassword", () => {
  it("rejects short, non-string, and over-long passwords", () => {
    expect(validatePassword("short")).toMatch(/at least/);
    expect(validatePassword("")).toMatch(/at least/);
    expect(validatePassword(undefined)).toMatch(/at least/);
    expect(validatePassword(12345678)).toMatch(/at least/);
    expect(validatePassword("x".repeat(201))).toMatch(/too long/);
  });
  it("accepts a password at or above the minimum", () => {
    expect(validatePassword("x".repeat(MIN_PASSWORD_LEN))).toBeNull();
    expect(validatePassword("a-decent-passphrase")).toBeNull();
  });
});

describe("auth email templates", () => {
  it("embed the link and escape a hostile display name", () => {
    const url = "https://roofdrafts.com/auth/reset?token=abc123";
    const reset = renderPasswordResetEmail("pat@example.com", '<img src=x onerror=alert(1)>', url);
    expect(reset.subject).toMatch(/reset/i);
    expect(reset.html).toContain(url);
    expect(reset.html).not.toContain("<img src=x");
    expect(reset.html).toContain("&lt;img");

    const verify = renderVerifyEmail("pat@example.com", null, url.replace("reset", "verify"));
    expect(verify.subject).toMatch(/confirm/i);
    expect(verify.html).toContain("/auth/verify");
    expect(verify.text).toContain("Hi,");
  });
});
