import { requireOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import Link from "next/link";
import "../dashboard.css";
import "../../admin/admin.css";
import { RoofMark } from "@/components/primitives";

export const metadata = { title: "Billing — Roofdrafts" };
export const dynamic = "force-dynamic";

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const fmt = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default async function CustomerBillingPage() {
  const { session, membership } = await requireOrg("ADMIN");
  const isCompany = membership.orgType === "COMPANY";

  const invoices = isCompany
    ? await prisma.invoice.findMany({
        where: { organizationId: membership.organizationId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { orders: true } } },
      })
    : [];

  return (
    <div className="rd-dash">
      <header className="rd-dash-header">
        <div className="rd-dash-header-inner">
          <Link href="/dashboard" className="rd-dash-brand">
            <RoofMark size={24} />
            <span className="rd-dash-brand-roof">roof</span>
            <span className="rd-dash-brand-drafts">drafts</span>
          </Link>
          <div className="rd-dash-header-right">
            <Link href="/dashboard" className="rd-dash-user" style={{ textDecoration: "none" }}>← Reports</Link>
            <span className="rd-dash-user">{session.user.name ?? session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="rd-dash-main">
        <h1 className="rd-dash-h1">{membership.orgName} · Billing</h1>
        {!isCompany ? (
          <p className="rd-dash-sub" style={{ marginTop: 8 }}>
            Individual accounts pay per report at checkout — there are no invoices to show. Switch to a
            company account for consolidated invoicing.
          </p>
        ) : invoices.length === 0 ? (
          <p className="rd-dash-sub" style={{ marginTop: 8 }}>
            No invoices yet. As your team orders reports, we&apos;ll roll them into a consolidated invoice.
          </p>
        ) : (
          <table className="rd-admin-table" style={{ marginTop: 18 }}>
            <thead>
              <tr><th>Invoice</th><th>Orders</th><th>Total</th><th>Status</th><th>Due</th><th></th></tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td className="rd-mono">{i.number}</td>
                  <td className="rd-dim">{i._count.orders}</td>
                  <td>{usd(i.totalUsd)}</td>
                  <td>{i.status}</td>
                  <td className="rd-dim">{fmt(i.dueAt)}</td>
                  <td><a href={`/api/invoices/${i.id}/pdf`} target="_blank" rel="noreferrer" style={{ color: "var(--nj2-brand-600,#A2451F)", fontWeight: 600, textDecoration: "none" }}>PDF ↗</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
