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

async function nextInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

/** Roll all of an org's unbilled orders into a single DRAFT invoice. Returns null if none. */
export async function generateInvoiceForOrg(organizationId: string) {
  const orders = await unbilledOrders(organizationId);
  if (orders.length === 0) return null;

  const subtotal = orders.reduce((s, o) => s + (o.priceUsd ?? 0), 0);
  const pct = Math.min(100, Math.max(0, await num("company_volume_discount_pct", 0)));
  const discount = Math.round((subtotal * pct) / 100);
  const total = subtotal - discount;
  const netDays = await num("invoice_net_days", 15);

  return prisma.invoice.create({
    data: {
      number: await nextInvoiceNumber(),
      organizationId,
      subtotalUsd: subtotal,
      discountUsd: discount,
      totalUsd: total,
      dueAt: new Date(Date.now() + netDays * 24 * 60 * 60 * 1000),
      orders: { connect: orders.map((o) => ({ id: o.id })) },
    },
    include: { orders: true },
  });
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
    await prisma.order.updateMany({ where: { invoiceId }, data: { invoiceId: null } });
    return prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
  }
  return prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
}
