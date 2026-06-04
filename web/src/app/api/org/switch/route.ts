import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORG_COOKIE } from "@/lib/org";

/** POST /api/org/switch — set the caller's active organization (must be a member). */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const organizationId = String((await req.json().catch(() => ({})))?.organizationId ?? "");
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member of that organization." }, { status: 403 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
