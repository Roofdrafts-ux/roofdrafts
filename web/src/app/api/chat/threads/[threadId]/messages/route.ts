import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isValidVisitorKey, cleanBody, canAccessThread, isTeamRole } from "@/lib/chat";

type Params = { params: Promise<{ threadId: string }> };

/**
 * GET /api/chat/threads/[threadId]/messages?visitorKey=...&after=<iso>
 * Polled by the widget (visitor side) and the admin console (team side).
 * Marks the caller's side of the thread as read.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { threadId } = await params;
  const visitorKey = req.nextUrl.searchParams.get("visitorKey");
  const after = req.nextUrl.searchParams.get("after");
  const session = await auth();
  const role = session?.user?.role ?? null;

  const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (
    !canAccessThread({
      thread,
      visitorKey: isValidVisitorKey(visitorKey) ? visitorKey : null,
      userId: session?.user?.id ?? null,
      role,
    })
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const afterDate = after ? new Date(after) : null;
  const messages = await prisma.chatMessage.findMany({
    where: {
      threadId,
      ...(afterDate && !isNaN(afterDate.getTime()) ? { createdAt: { gt: afterDate } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  // Reading marks your own side as caught-up (best-effort).
  const readField = isTeamRole(role) ? "unreadForTeam" : "unreadForVisitor";
  if (thread[readField] > 0) {
    await prisma.chatThread
      .update({ where: { id: threadId }, data: { [readField]: 0 } })
      .catch(() => {});
  }

  return NextResponse.json({
    status: thread.status,
    messages: messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      authorName: m.authorName,
      body: m.body,
      createdAt: m.createdAt,
    })),
  });
}

/**
 * POST /api/chat/threads/[threadId]/messages — append a message.
 * Visitors authenticate by visitorKey; team members by session role.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { threadId } = await params;
  const ip = clientIp(req.headers);
  const rl = rateLimit(`chat:msg:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Slow down a little — try again in a few seconds." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const { visitorKey, body } = raw as Record<string, unknown>;

  const text = cleanBody(body);
  if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  const session = await auth();
  const role = session?.user?.role ?? null;
  const team = isTeamRole(role);

  const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (
    !canAccessThread({
      thread,
      visitorKey: isValidVisitorKey(visitorKey) ? (visitorKey as string) : null,
      userId: session?.user?.id ?? null,
      role,
    })
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      threadId,
      sender: team ? "TEAM" : "VISITOR",
      authorId: team ? session!.user.id : null,
      authorName: team ? session!.user.name ?? "Roofdrafts" : null,
      body: text,
    },
  });

  await prisma.chatThread.update({
    where: { id: threadId },
    data: {
      lastMessageAt: message.createdAt,
      status: "OPEN",
      ...(team ? { unreadForVisitor: { increment: 1 } } : { unreadForTeam: { increment: 1 } }),
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
