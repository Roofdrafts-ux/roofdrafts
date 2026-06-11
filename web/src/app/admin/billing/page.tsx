import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

import { BillingConsole } from "@/components/admin/BillingConsole";

import "../admin.css";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = { title: "Billing — Roofdrafts admin" };
export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const session = await requireRole("ADMIN");

  const companies = await prisma.organization.findMany({
    where: { type: "COMPANY" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const grouped = await prisma.order.groupBy({
    by: ["organizationId"],
    where: {
      organizationId: { in: companies.map((c) => c.id) },
      invoiceId: null,
      paymentStatus: { not: "PAID" },
    },
    _count: { _all: true },
    _sum: { priceUsd: true },
  });
  const byOrg = new Map(grouped.map((g) => [g.organizationId, { count: g._count._all, total: g._sum.priceUsd ?? 0 }]));
  const companyRows = companies.map((c) => ({
    id: c.id,
    name: c.name,
    unbilledCount: byOrg.get(c.id)?.count ?? 0,
    unbilledTotalUsd: byOrg.get(c.id)?.total ?? 0,
  }));

  const invs = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { organization: { select: { name: true } }, _count: { select: { orders: true } } },
  });
  const invoiceRows = invs.map((i) => ({
    id: i.id,
    number: i.number,
    orgName: i.organization.name,
    status: i.status,
    totalUsd: i.totalUsd,
    orderCount: i._count.orders,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <div className="rd-admin">
      <AdminNav active="billing" user={session.user.name ?? session.user.email} />

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Billing</h1>
        <p className="rd-admin-empty" style={{ marginTop: -8, marginBottom: 24 }}>
          Companies are billed by consolidated invoice. Generate an invoice to roll up their unbilled
          orders, then send and mark paid. Individual customers pay per report at checkout.
        </p>
        <BillingConsole companies={companyRows} invoices={invoiceRows} />
      </main>
    </div>
  );
}
