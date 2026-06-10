import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWithRole } from "@/lib/rbac";

type Params = { params: Promise<{ threadId: string }> };

/** PATCH /api/chat/threads/[threadId] — team only: close / reopen a thread. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionWithRole("ESTIMATOR");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { threadId } = await params;
  const raw = await req.json().catch(() => null);
  const status = (raw as { status?: string } | null)?.status;
  if (status !== "OPEN" && status !== "CLOSED") {
    return NextResponse.json({ error: "status must be OPEN or CLOSED." }, { status: 400 });
  }

  const thread = await prisma.chatThread.update({
    where: { id: threadId },
    data: { status },
  }).catch(() => null);
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ thread: { id: thread.id, status: thread.status } });
}
