import "server-only";
// Staff email alerts for live chat. Best-effort: never throws, never blocks
// the visitor's request on failure.
import { getEmailer } from "./email";
import { getEmails } from "./settings";
import { rateLimit } from "./rate-limit";
import { escapeHtml } from "./chat";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

// Global ceiling on alert emails so a thread-creation flood can't become a
// staff-inbox flood / Resend bill. In-memory, so on serverless it's
// per-instance (best-effort) — see lib/rate-limit.ts for the same caveat.
const ALERTS_PER_HOUR = 30;

export interface ChatAlertContext {
  threadId: string;
  name: string | null;
  email: string | null;
  body: string;
  /** true = first message of a new conversation; false = follow-up reply. */
  isNew: boolean;
}

export async function alertChatMessage(ctx: ChatAlertContext): Promise<void> {
  try {
    let recipients = await getEmails("chat_alert_emails");
    if (recipients.length === 0) recipients = await getEmails("lead_alert_emails");
    if (recipients.length === 0) return;

    const cap = rateLimit("chat:alerts:global", ALERTS_PER_HOUR, 3_600_000);
    if (!cap.ok) {
      console.warn("[chat] alert cap reached — suppressing staff email");
      return;
    }

    // Visitor-controlled fields are output-encoded at this sink. cleanName/
    // cleanEmail validate shape only — they are NOT HTML-safe.
    const who = ctx.name || ctx.email || "A visitor";
    const safeWho = escapeHtml(who);
    const safeBody = escapeHtml(ctx.body);
    const verb = ctx.isNew ? "started a chat" : "replied";
    const inboxUrl = `${APP_URL}/admin/chat`;

    const emailer = getEmailer();
    await Promise.all(
      recipients.map((to) =>
        emailer.send({
          to,
          subject: `💬 Chat ${ctx.isNew ? "started" : "reply"} — ${who.slice(0, 60)}`,
          text: `${who} ${verb} on roofdrafts.com:\n\n${ctx.body}\n\nReply: ${inboxUrl}`,
          html: `<p><b>${safeWho}</b> ${verb} on roofdrafts.com:</p><blockquote>${safeBody}</blockquote><p><a href="${inboxUrl}">Open the chat inbox</a> — they expect a reply in minutes.</p>`,
        })
      )
    );
  } catch (e) {
    console.warn(`[chat] alert failed: ${(e as Error).message}`);
  }
}
