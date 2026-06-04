import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import Link from "next/link";
import "../admin.css";

export const metadata = { title: "Audit log — Roofdrafts admin" };
export const dynamic = "force-dynamic";

function fmt(d: Date): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminAuditPage() {
  const session = await requireRole("ADMIN");
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="rd-admin">
      <header className="rd-admin-header">
        <div className="rd-admin-header-inner">
          <Link href="/" className="rd-admin-brand">
            <span className="rd-admin-brand-roof">roof</span>
            <span className="rd-admin-brand-drafts">drafts</span>
            <span className="rd-admin-tag">admin</span>
          </Link>
          <nav className="rd-admin-nav">
            <Link href="/admin" className="rd-admin-navlink">Overview</Link>
            <Link href="/admin/leads" className="rd-admin-navlink">Leads</Link>
            <Link href="/admin/orders" className="rd-admin-navlink">Orders</Link>
            <Link href="/admin/users" className="rd-admin-navlink">Users</Link>
            <Link href="/admin/pricing" className="rd-admin-navlink">Pricing</Link>
            <Link href="/admin/billing" className="rd-admin-navlink">Billing</Link>
            <Link href="/admin/settings" className="rd-admin-navlink">Settings</Link>
            <Link href="/admin/audit" className="rd-admin-navlink rd-admin-navlink-active">Audit</Link>
            <span className="rd-admin-user">{session.user.name ?? session.user.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Audit log</h1>
        {logs.length === 0 ? (
          <p className="rd-admin-empty">No activity recorded yet.</p>
        ) : (
          <table className="rd-admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="rd-dim">{fmt(l.createdAt)}</td>
                  <td>{l.actorEmail ?? l.actorId ?? "—"}</td>
                  <td className="rd-mono">{l.action}</td>
                  <td className="rd-dim">{l.targetType ? `${l.targetType}:${l.targetId ?? "?"}` : "—"}</td>
                  <td className="rd-dim" style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.meta ? JSON.stringify(l.meta) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
