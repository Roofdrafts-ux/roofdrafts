import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { setUserPassword, validatePassword } from "@/lib/account";
import { writeAudit } from "@/lib/audit";

/**
 * POST /api/auth/reset-password — { token, password }
 * Consumes a single-use reset token and sets the new password. Resetting also
 * verifies the email (proves inbox control), so a reset doubles as verification.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`reset:${ip}`, 10, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const raw = await req.json().catch(() => null);
  const token = typeof raw?.token === "string" ? raw.token : "";
  const password = raw?.password;

  const pwError = validatePassword(password);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const userId = await consumeAuthToken(token, "PASSWORD_RESET");
  if (!userId) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  await setUserPassword(userId, password as string);
  // A valid reset proves control of the inbox → mark verified too.
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });
  await writeAudit({
    actorId: userId,
    action: "user.password.reset",
    targetType: "user",
    targetId: userId,
    ip: ip === "unknown" ? null : ip,
  });

  return NextResponse.json({ ok: true });
}
