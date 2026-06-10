import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWithRole } from "@/lib/rbac";

/** GET /api/admin/chat/threads — team inbox: open first, newest activity first. */
export async function GET() {
  const session = await getSessionWithRole("ESTIMATOR");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const threads = await prisma.chatThread.findMany({
    // Enum order: OPEN is declared before CLOSED, so asc puts open threads first.
    orderBy: [{ status: "asc" }, { lastMessageAt: "desc" }],
    take: 100,
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      user: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({
    threads: threads.map((t) => ({
      id: t.id,
      status: t.status,
      name: t.name ?? t.user?.name ?? null,
      email: t.email ?? t.user?.email ?? null,
      pageUrl: t.pageUrl,
      lastMessageAt: t.lastMessageAt,
      unread: t.unreadForTeam,
      preview: t.messages[0]?.body.slice(0, 140) ?? "",
      previewFrom: t.messages[0]?.sender ?? "VISITOR",
      createdAt: t.createdAt,
    })),
  });
}
