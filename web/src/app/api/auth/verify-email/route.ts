import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { consumeAuthToken } from "@/lib/auth-tokens";

/**
 * POST /api/auth/verify-email — { token }
 * Consumes a single-use verification token and stamps emailVerified.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`verify:${ip}`, 20, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const raw = await req.json().catch(() => null);
  const token = typeof raw?.token === "string" ? raw.token : "";

  const userId = await consumeAuthToken(token, "EMAIL_VERIFY");
  if (!userId) {
    return NextResponse.json(
      { error: "This confirmation link is invalid or has expired." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true });
}
