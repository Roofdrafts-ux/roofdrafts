import "server-only";
import type { Emailer, EmailMessage, SendResult, OrderEmailEvent } from "./types";
import { renderOrderEmail, type OrderEmailContext } from "./templates";

const FROM = process.env.EMAIL_FROM ?? "Roofdrafts <orders@roofdrafts.dev>";

/** Resend-backed emailer via REST (no SDK dep). Falls back to console in dev. */
class ResendEmailer implements Emailer {
  constructor(private apiKey: string) {}
  async send(msg: EmailMessage): Promise<SendResult> {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [msg.to],
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, error: `Resend ${res.status}: ${body}` };
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { ok: true, id: data.id };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}

/** Dev-safe fallback: logs the email instead of sending. Clearly flagged. */
class ConsoleEmailer implements Emailer {
  async send(msg: EmailMessage): Promise<SendResult> {
    console.warn(
      `[email:DRY-RUN no RESEND_API_KEY] → ${msg.to} · ${msg.subject}`
    );
    return { ok: true, dryRun: true };
  }
}

export function getEmailer(): Emailer {
  const key = process.env.RESEND_API_KEY;
  return key ? new ResendEmailer(key) : new ConsoleEmailer();
}

/** High-level: render + send a lifecycle email. Never throws (best-effort). */
export async function notifyOrderEvent(
  event: OrderEmailEvent,
  ctx: OrderEmailContext
): Promise<SendResult> {
  try {
    const msg = renderOrderEmail(event, ctx);
    return await getEmailer().send(msg);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type { OrderEmailContext } from "./templates";
