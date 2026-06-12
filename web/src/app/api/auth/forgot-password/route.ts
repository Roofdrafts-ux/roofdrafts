import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { cleanEmail } from "@/lib/chat";
import { sendPasswordResetEmail } from "@/lib/account";

/**
 * POST /api/auth/forgot-password — { email }
 * Always responds 200 with the same body whether or not the account exists, so
 * the endpoint can't be used to enumerate registered emails. A reset link is
 * only actually sent to a real credentials account.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`forgot:${ip}`, 5, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const raw = await req.json().catch(() => null);
  const email = cleanEmail(typeof raw?.email === "string" ? raw.email.toLowerCase() : null);

  const ok = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  });
  if (!email) return ok;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });
  // Only send to accounts that actually have a password to reset.
  if (user) {
    const cred = await prisma.account.findFirst({
      where: { userId: user.id, provider: "credentials" },
      select: { id: true },
    });
    if (cred) {
      try {
        await sendPasswordResetEmail(user);
      } catch (e) {
        console.warn(`[forgot] ${(e as Error).message}`);
      }
    }
  }
  return ok;
}
