import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getEmailer } from "./email";
import { renderPasswordResetEmail, renderVerifyEmail } from "./email/auth-templates";
import {
  createAuthToken,
  PASSWORD_RESET_TTL_MS,
  EMAIL_VERIFY_TTL_MS,
} from "./auth-tokens";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export const MIN_PASSWORD_LEN = 8;

/** Shared password policy. Returns an error string, or null when acceptable. */
export function validatePassword(pw: unknown): string | null {
  if (typeof pw !== "string" || pw.length < MIN_PASSWORD_LEN) {
    return `Password must be at least ${MIN_PASSWORD_LEN} characters.`;
  }
  if (pw.length > 200) return "Password is too long.";
  return null;
}

/**
 * Set (or replace) a user's credentials password. Works for password users and
 * for OAuth-only users adding their first password (creates the credentials
 * Account row if absent). Clears the mustChangePassword flag.
 */
export async function setUserPassword(userId: string, newPlain: string): Promise<void> {
  const hash = await bcrypt.hash(newPlain, 12);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) throw new Error("user not found");

  const cred = await prisma.account.findFirst({
    where: { userId, provider: "credentials" },
    select: { id: true },
  });
  if (cred) {
    await prisma.account.update({ where: { id: cred.id }, data: { access_token: hash } });
  } else {
    await prisma.account.create({
      data: {
        userId,
        type: "credentials",
        provider: "credentials",
        providerAccountId: user.email,
        access_token: hash,
      },
    });
  }
  await prisma.user.update({ where: { id: userId }, data: { mustChangePassword: false } });
}

/** Verify a plaintext password against the stored credentials hash. */
export async function verifyUserPassword(userId: string, plain: string): Promise<boolean> {
  const cred = await prisma.account.findFirst({
    where: { userId, provider: "credentials" },
    select: { access_token: true },
  });
  if (!cred?.access_token) return false;
  return bcrypt.compare(plain, cred.access_token);
}

/** Mint a reset token and email the link. Best-effort; logs on failure. */
export async function sendPasswordResetEmail(user: { id: string; email: string; name: string | null }) {
  const raw = await createAuthToken(user.id, "PASSWORD_RESET", PASSWORD_RESET_TTL_MS);
  const url = `${APP_URL}/auth/reset?token=${encodeURIComponent(raw)}`;
  const res = await getEmailer().send(renderPasswordResetEmail(user.email, user.name, url));
  if (!res.ok) console.warn(`[account] reset email to ${user.email} failed: ${res.error}`);
}

/** Mint a verification token and email the link. Best-effort; logs on failure. */
export async function sendVerificationEmail(user: { id: string; email: string; name: string | null }) {
  const raw = await createAuthToken(user.id, "EMAIL_VERIFY", EMAIL_VERIFY_TTL_MS);
  const url = `${APP_URL}/auth/verify?token=${encodeURIComponent(raw)}`;
  const res = await getEmailer().send(renderVerifyEmail(user.email, user.name, url));
  if (!res.ok) console.warn(`[account] verify email to ${user.email} failed: ${res.error}`);
}
