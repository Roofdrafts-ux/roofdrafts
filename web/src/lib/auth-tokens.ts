import "server-only";
import crypto from "crypto";
import { prisma } from "./prisma";
import type { AuthTokenType } from "../generated/prisma/enums";

// Token lifetimes.
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** SHA-256 of the raw token — only the hash is ever persisted. */
function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Mint a single-use token for `userId`. Returns the RAW token (goes in the
 * emailed link); only its hash is stored. Existing unused tokens of the same
 * type are invalidated so a user only ever has one live link per purpose.
 */
export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlMs: number
): Promise<string> {
  const raw = crypto.randomBytes(32).toString("base64url");
  await prisma.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });
  return raw;
}

/**
 * Validate + atomically consume a token. Returns the userId on success, or
 * null if the token is unknown, expired, or already used. The mark-used update
 * is conditioned on `usedAt: null`, so two concurrent redemptions can't both win.
 */
export async function consumeAuthToken(
  raw: string,
  type: AuthTokenType
): Promise<string | null> {
  if (!raw || typeof raw !== "string") return null;
  const tokenHash = hashToken(raw);
  const row = await prisma.authToken.findUnique({ where: { tokenHash } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) return null;

  const claimed = await prisma.authToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return null; // lost the race
  return row.userId;
}
