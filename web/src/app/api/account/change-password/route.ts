import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { setUserPassword, verifyUserPassword, validatePassword } from "@/lib/account";
import { writeAudit } from "@/lib/audit";

/**
 * POST /api/account/change-password — { currentPassword?, newPassword }
 * Authenticated. Password users must supply the correct current password;
 * OAuth-only users (no existing password) can set one without it.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const ip = clientIp(req.headers);
  const rl = rateLimit(`changepw:${session.user.id}`, 10, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });
  }

  const raw = await req.json().catch(() => null);
  const pwError = validatePassword(raw?.newPassword);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const hasPassword = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "credentials" },
    select: { id: true },
  });

  if (hasPassword) {
    const current = typeof raw?.currentPassword === "string" ? raw.currentPassword : "";
    const valid = await verifyUserPassword(session.user.id, current);
    if (!valid) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
    }
  }

  await setUserPassword(session.user.id, raw.newPassword as string);
  await writeAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: hasPassword ? "user.password.change" : "user.password.set",
    targetType: "user",
    targetId: session.user.id,
    ip: ip === "unknown" ? null : ip,
  });

  return NextResponse.json({ ok: true });
}
