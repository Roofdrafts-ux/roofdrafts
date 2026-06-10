import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { alertChatMessage } from "@/lib/chat-alerts";
import { isValidVisitorKey, cleanBody, canAccessThread, isTeamRole } from "@/lib/chat";

type Params = { params: Promise<{ threadId: string }> };

const PAGE = 200;

function visitorKeyFrom(req: NextRequest): string | null {
  const k = req.headers.get("x-visitor-key") ?? req.nextUrl.searchParams.get("visitorKey");
  return isValidVisitorKey(k) ? k : null;
}

/**
 * GET /api/chat/threads/[threadId]/messages?after=<iso>
 * Polled by the widget (visitor side, key via X-Visitor-Key header) and the
 * admin console (team side, session). Without `after`, returns the newest
 * page; with `after`, returns only messages newer than that cursor (clients
 * append + dedupe by id, so equal-millisecond overlap is harmless).
 * Marks the caller's side of the thread as read up to what was returned.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`chat:poll:${ip}`, 90, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { threadId } = await params;
  const visitorKey = visitorKeyFrom(req);
  const after = req.nextUrl.searchParams.get("after");
  const session = await auth();
  const role = session?.user?.role ?? null;

  const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (
    !canAccessThread({
      thread,
      visitorKey,
      userId: session?.user?.id ?? null,
      role,
    })
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const afterDate = after ? new Date(after) : null;
  const incremental = afterDate && !isNaN(afterDate.getTime());

  const messages = incremental
    ? await prisma.chatMessage.findMany({
        where: { threadId, createdAt: { gt: afterDate } },
        orderBy: { createdAt: "asc" },
        take: PAGE,
      })
    : (
        await prisma.chatMessage.findMany({
          where: { threadId },
          orderBy: { createdAt: "desc" },
          take: PAGE,
        })
      ).reverse();

  // Mark the caller's side as read — but only up to what this response
  // actually contains, so a reply landing mid-request keeps its unread flag.
  const readField = isTeamRole(role) ? "unreadForTeam" : "unreadForVisitor";
  const cursor = messages.length > 0 ? messages[messages.length - 1].createdAt : incremental ? afterDate : null;
  if (thread[readField] > 0 && cursor) {
    await prisma.chatThread
      .updateMany({
        where: { id: threadId, lastMessageAt: { lte: cursor } },
        data: { [readField]: 0 },
      })
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

  // One atomic write: the message and the thread's activity/unread bump
  // commit together, so the inbox can never miss a message.
  const now = new Date();
  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        threadId,
        sender: team ? "TEAM" : "VISITOR",
        authorId: team ? session!.user.id : null,
        authorName: team ? session!.user.name ?? "Roofdrafts" : null,
        body: text,
        createdAt: now,
      },
    }),
    prisma.chatThread.update({
      where: { id: threadId },
      data: {
        lastMessageAt: now,
        status: "OPEN",
        ...(team ? { unreadForVisitor: { increment: 1 } } : { unreadForTeam: { increment: 1 } }),
      },
    }),
  ]);

  // A visitor reply to a quiet thread deserves the same staff alert as a new
  // conversation — nobody is watching the inbox 24/7.
  if (!team && thread.unreadForTeam === 0) {
    await alertChatMessage({
      threadId,
      name: thread.name,
      email: thread.email,
      body: text,
      isNew: false,
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}
