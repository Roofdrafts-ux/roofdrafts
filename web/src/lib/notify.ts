import "server-only";
import { prisma } from "./prisma";
import { notifyOrderEvent } from "./email";
import { TURNAROUND_LABEL } from "./pricing";
import type { OrderEmailEvent } from "./email/types";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

/**
 * Load an order + its owner and send the lifecycle email for `event`.
 * Best-effort: logs and swallows errors so it never breaks the request.
 */
export async function notifyForOrder(orderId: string, event: OrderEmailEvent): Promise<void> {
  try {
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
