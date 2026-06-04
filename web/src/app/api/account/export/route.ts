import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/account/export — download the signed-in user's personal data (GDPR/CCPA). */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const userId = session.user.id;
  const [user, orders, memberships, consents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, accountType: true, companyName: true, monthlyVolume: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { userId },
      select: { displayId: true, address: true, reportType: true, turnaround: true, status: true, paymentStatus: true, priceUsd: true, createdAt: true, deliveredAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organizationMember.findMany({
      where: { userId },
      select: { role: true, createdAt: true, organization: { select: { name: true, type: true } } },
    }),
    prisma.consentRecord.findMany({
      where: { userId },
      select: { type: true, createdAt: true, ipAddress: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const payload = { exportedAt: new Date().toISOString(), profile: user, orders, organizations: memberships, consents };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="roofdrafts-data-${userId}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
