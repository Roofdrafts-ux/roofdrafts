import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getEmailer } from "@/lib/email";
import { getEmails } from "@/lib/settings";
import {
  isValidVisitorKey,
  cleanBody,
  cleanEmail,
  cleanName,
  cleanPageUrl,
} from "@/lib/chat";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

/** Best-effort team alert when a new conversation starts. Never throws. */
async function alertNewChat(thread: { id: string; name: string | null; email: string | null }, body: string) {
  try {
    let recipients = await getEmails("chat_alert_emails");
    if (recipients.length === 0) recipients = await getEmails("lead_alert_emails");
    if (recipients.length === 0) return;

    const who = thread.name || thread.email || "A visitor";
    const emailer = getEmailer();
    await Promise.all(
      recipients.map((to) =>
        emailer.send({
          to,
          subject: `💬 New chat — ${who}`,
          text: `${who} started a chat on roofdrafts.com:\n\n${body}\n\nReply: ${APP_URL}/admin/chat`,
          html: `<p><b>${who}</b> started a chat on roofdrafts.com:</p><blockquote>${body
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")}</blockquote><p><a href="${APP_URL}/admin/chat">Open the chat inbox</a> — they expect a reply in minutes.</p>`,
        })
      )
    );
  } catch (e) {
    console.warn(`[chat] alert failed: ${(e as Error).message}`);
  }
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

  await alertNewChat(thread, text);

  return NextResponse.json({ thread }, { status: 201 });
}

/**
 * GET /api/chat/threads?visitorKey=... — the visitor's conversations, newest
 * activity first, with a last-message preview for the Messages tab.
 */
export async function GET(req: NextRequest) {
  const visitorKey = req.nextUrl.searchParams.get("visitorKey");
  const session = await auth();

  if (!isValidVisitorKey(visitorKey) && !session?.user) {
    return NextResponse.json({ threads: [] });
  }

  const or: object[] = [];
  if (isValidVisitorKey(visitorKey)) or.push({ visitorKey });
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
