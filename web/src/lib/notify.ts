import "server-only";
import { prisma } from "./prisma";
import { getEmailer, notifyOrderEvent } from "./email";
import { getBool, getEmails } from "./settings";
import { TURNAROUND_LABEL } from "./pricing";
import { escapeHtml } from "./chat";
import type { OrderEmailEvent } from "./email/types";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

/**
 * Load an order + its owner and send the lifecycle email for `event`.
 * Best-effort: logs and swallows errors so it never breaks the request.
 */
export async function notifyForOrder(orderId: string, event: OrderEmailEvent): Promise<void> {
  try {
    // Owner can disable customer lifecycle emails from admin Settings.
    if (!(await getBool("order_emails_enabled"))) return;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!order?.user?.email) return;

    const res = await notifyOrderEvent(event, {
      toEmail: order.user.email,
      toName: order.user.name,
      displayId: order.displayId,
      address: order.address,
      orderUrl: `${APP_URL}/dashboard`,
      priceUsd: order.priceUsd,
      etaLabel: order.turnaround ? TURNAROUND_LABEL[order.turnaround] ?? null : null,
    });
    if (!res.ok) console.warn(`[notify] ${event} for ${order.displayId} failed: ${res.error}`);
  } catch (e) {
    console.warn(`[notify] ${event} for ${orderId} threw: ${(e as Error).message}`);
  }
}

/**
 * Staff alert for every new order (separate from the customer lifecycle
 * email above). Recipients: order_alert_emails → lead_alert_emails.
 * Best-effort: never throws, never blocks the order response.
 */
export async function alertNewOrder(orderId: string): Promise<void> {
  try {
    let recipients = await getEmails("order_alert_emails");
    if (recipients.length === 0) recipients = await getEmails("lead_alert_emails");
    if (recipients.length === 0) return;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!order) return;

    const who = order.user?.name || order.user?.email || "A customer";
    const price = order.priceUsd != null ? `$${(order.priceUsd / 100).toFixed(2)}` : "—";
    const eta = TURNAROUND_LABEL[order.turnaround] ?? order.turnaround;
    const ordersUrl = `${APP_URL}/admin/orders`;

    const emailer = getEmailer();
    await Promise.all(
      recipients.map((to) =>
        emailer.send({
          to,
          subject: `🏠 New order ${order.displayId} — ${who.slice(0, 60)}`,
          text:
            `${who} placed ${order.displayId}\n\n` +
            `Address: ${order.address}\nType: ${order.reportType} · ${eta}\nPrice: ${price}\n\n` +
            `Manage: ${ordersUrl}`,
          html:
            `<p><b>${escapeHtml(who)}</b> placed <b>${escapeHtml(order.displayId)}</b></p>` +
            `<p>Address: ${escapeHtml(order.address)}<br/>` +
            `Type: ${escapeHtml(order.reportType)} · ${escapeHtml(eta)}<br/>` +
            `Price: ${price}</p>` +
            `<p><a href="${ordersUrl}">Open the orders console</a></p>`,
        })
      )
    );
  } catch (e) {
    console.warn(`[notify] new-order alert for ${orderId} threw: ${(e as Error).message}`);
  }
}
