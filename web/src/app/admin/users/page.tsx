import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import Link from "next/link";
import "../admin.css";
import type { Role } from "@/generated/prisma/enums";

export const metadata = { title: "Users — Roofdrafts admin" };

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminUsersPage() {
  const session = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, name: true, role: true, createdAt: true,
      _count: { select: { orders: true, assignedOrders: true } },
    },
  });

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
            <Link href="/admin/users" className="rd-admin-navlink rd-admin-navlink-active">Users</Link>
            <Link href="/admin/pricing" className="rd-admin-navlink">Pricing</Link>
            <Link href="/admin/billing" className="rd-admin-navlink">Billing</Link>
            <Link href="/admin/settings" className="rd-admin-navlink">Settings</Link>
            <Link href="/admin/audit" className="rd-admin-navlink">Audit</Link>
            <span className="rd-admin-user">{session.user.name ?? session.user.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">
          Users <span className="rd-admin-count">{users.length}</span>
        </h1>

        <table className="rd-admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Orders</th>
              <th>Assigned</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name ?? "—"}</td>
                <td className="rd-mono">{u.email}</td>
                <td className="rd-dim">{fmtDate(u.createdAt)}</td>
                <td className="rd-dim">{u._count.orders}</td>
                <td className="rd-dim">{u._count.assignedOrders}</td>
                <td>
                  <RoleSelect
                    userId={u.id}
                    role={u.role as Role}
                    self={u.id === session.user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
