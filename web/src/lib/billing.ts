import "server-only";
import { prisma } from "./prisma";
import { getSetting } from "./settings";
import type { InvoiceStatus } from "@/generated/prisma/enums";

async function num(key: string, fallback: number): Promise<number> {
  const n = parseFloat(await getSetting(key));
  return Number.isFinite(n) ? n : fallback;
}

/** Orders for a company org that haven't been invoiced or paid yet. */
export async function unbilledOrders(organizationId: string) {
  return prisma.order.findMany({
    where: { organizationId, invoiceId: null, paymentStatus: { not: "PAID" } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Roll all of an org's unbilled orders into a single DRAFT invoice. Returns null if none.
 * Race-safe: runs in a transaction, attaches orders with a guarded `invoiceId IS NULL` write
 * (so two concurrent runs can't double-bill the same order), recomputes totals from what
 * actually attached, and retries on invoice-number unique collisions.
 */
export async function generateInvoiceForOrg(organizationId: string) {
  const pct = Math.min(100, Math.max(0, await num("company_volume_discount_pct", 0)));
  const netDays = await num("invoice_net_days", 15);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const orders = await tx.order.findMany({
          where: { organizationId, invoiceId: null, paymentStatus: { not: "PAID" } },
        });
        if (orders.length === 0) return null;

        const count = await tx.invoice.count();
        const invoice = await tx.invoice.create({
          data: {
            number: `INV-${String(count + 1).padStart(4, "0")}`,
            organizationId,
            dueAt: new Date(Date.now() + netDays * 24 * 60 * 60 * 1000),
          },
        });

        // Attach only orders that are still unbilled — a concurrent invoice can't steal them.
        await tx.order.updateMany({
          where: { id: { in: orders.map((o) => o.id) }, invoiceId: null },
          data: { invoiceId: invoice.id },
        });
        const attached = await tx.order.findMany({ where: { invoiceId: invoice.id } });
        if (attached.length === 0) throw new Error("RACE_EMPTY");

        const subtotal = attached.reduce((s, o) => s + (o.priceUsd ?? 0), 0);
        const discount = Math.round((subtotal * pct) / 100);
        return tx.invoice.update({
          where: { id: invoice.id },
          data: { subtotalUsd: subtotal, discountUsd: discount, totalUsd: subtotal - discount },
          include: { orders: true },
        });
      });
    } catch (e) {
      if ((e as Error).message === "RACE_EMPTY") return null;
      if (attempt < 2 && (e as { code?: string }).code === "P2002") continue; // dup number, retry
      throw e;
    }
  }
  return null;
}

/** Transition an invoice; PAID marks its orders paid, VOID releases them back to unbilled. */
export async function setInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return null;

  if (status === "PAID") {
    await prisma.order.updateMany({
      where: { invoiceId },
      data: { paymentStatus: "PAID", paidAt: new Date() },
    });
    return prisma.invoice.update({ where: { id: invoiceId }, data: { status, paidAt: new Date() } });
  }
  if (status === "SENT") {
    return prisma.invoice.update({ where: { id: invoiceId }, data: { status, sentAt: new Date() } });
  }
  if (status === "VOID") {
    // Release orders back to unbilled and clear any payment stamped by this invoice.
    await prisma.order.updateMany({
      where: { invoiceId },
      data: { invoiceId: null, paymentStatus: "UNPAID", paidAt: null },
    });
    return prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
  }
  return prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
}
