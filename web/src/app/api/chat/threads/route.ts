import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { alertChatMessage } from "@/lib/chat-alerts";
import {
  isValidVisitorKey,
  cleanBody,
  cleanEmail,
  cleanName,
  cleanPageUrl,
} from "@/lib/chat";

/**
 * The visitorKey is a bearer credential — read it from a header (preferred)
 * so it never lands in access logs the way query strings do. The query param
 * is kept as a fallback for robustness.
 */
function visitorKeyFrom(req: NextRequest): string | null {
  const k = req.headers.get("x-visitor-key") ?? req.nextUrl.searchParams.get("visitorKey");
  return isValidVisitorKey(k) ? k : null;
}

/**
 * POST /api/chat/threads — start a conversation (guests welcome).
 * Body: { visitorKey, body, name?, email?, pageUrl? }
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`chat:create:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many new conversations. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const { visitorKey, body, name, email, pageUrl } = raw as Record<string, unknown>;
  if (!isValidVisitorKey(visitorKey)) {
    return NextResponse.json({ error: "Invalid visitor key." }, { status: 400 });
  }
  const text = cleanBody(body);
  if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  const session = await auth();

  const thread = await prisma.chatThread.create({
    data: {
      visitorKey,
      userId: session?.user?.id ?? null,
      name: cleanName(name) ?? session?.user?.name ?? null,
      email: cleanEmail(email) ?? session?.user?.email ?? null,
      pageUrl: cleanPageUrl(pageUrl),
      unreadForTeam: 1,
      messages: { create: { sender: "VISITOR", body: text } },
    },
    include: { messages: true },
  });

  await alertChatMessage({
    threadId: thread.id,
    name: thread.name,
    email: thread.email,
    body: text,
    isNew: true,
  });

  return NextResponse.json({ thread }, { status: 201 });
}

/**
 * GET /api/chat/threads — the visitor's conversations, newest activity first,
 * with a last-message preview for the Messages tab. Key via X-Visitor-Key.
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`chat:poll:${ip}`, 90, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const visitorKey = visitorKeyFrom(req);
  const session = await auth();

  if (!visitorKey && !session?.user) {
    return NextResponse.json({ threads: [] });
  }

  const or: object[] = [];
  if (visitorKey) or.push({ visitorKey });
  if (session?.user?.id) or.push({ userId: session.user.id });

  const threads = await prisma.chatThread.findMany({
    where: { OR: or },
    orderBy: { lastMessageAt: "desc" },
    take: 20,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return NextResponse.json({
    threads: threads.map((t) => ({
      id: t.id,
      status: t.status,
      lastMessageAt: t.lastMessageAt,
      unread: t.unreadForVisitor,
      preview: t.messages[0]?.body.slice(0, 120) ?? "",
      previewFrom: t.messages[0]?.sender ?? "VISITOR",
    })),
  });
}
