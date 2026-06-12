import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/account";

/**
 * POST /api/account/resend-verification — authenticated.
 * Re-sends the email-confirmation link to the signed-in user. No-op (still 200)
 * if their email is already verified.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const rl = rateLimit(`resendverify:${session.user.id}`, 3, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Please wait a few minutes before requesting another email." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (user && !user.emailVerified) {
    try {
      await sendVerificationEmail(user);
    } catch (e) {
      console.warn(`[resend-verify] ${(e as Error).message}`);
    }
  }
  return NextResponse.json({ ok: true });
}
