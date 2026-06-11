import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { AdminNav } from "@/components/admin/AdminNav";
import { AddUserForm } from "@/components/admin/AddUserForm";
import { initials, avatarBucket, relTime } from "@/lib/admin-format";
import "../admin.css";
import type { Role } from "@/generated/prisma/enums";

export const metadata = { title: "Users — Roofdrafts admin" };
export const dynamic = "force-dynamic";

const ROLE_TONE: Record<string, string> = {
  ADMIN: "accent",
  ESTIMATOR: "info",
  CUSTOMER: "muted",
};

export default async function AdminUsersPage() {
  const session = await requireRole("ADMIN");
  const now = new Date();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, name: true, role: true, createdAt: true,
      accountType: true, companyName: true, leadStatus: true,
      _count: { select: { orders: true, assignedOrders: true } },
    },
  });

  const staff = users.filter((u) => u.role !== "CUSTOMER").length;

  return (
    <div className="rd-admin">
      <AdminNav active="users" user={session.user.name ?? session.user.email} />

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">
          Users <span className="rd-admin-count">{users.length}</span>
        </h1>
        <p className="rd-admin-lede">
          Everyone with an account — customers and your team in one place. Promote an employee to
          Estimator to give them the production console, or to Admin for everything. Role changes
          apply on their next page load and land in the audit log.
        </p>

        <div className="rd-wl-row" style={{ alignItems: "center" }}>
          <div className="rd-wl">
            <div className="rd-wl-label">Team (estimator + admin)</div>
            <div className="rd-wl-n">{staff}</div>
          </div>
          <div className="rd-wl">
            <div className="rd-wl-label">Customers</div>
            <div className="rd-wl-n">{users.length - staff}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <AddUserForm />
          </div>
        </div>

        <table className="rd-admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Joined</th>
              <th style={{ textAlign: "right" }}>Orders</th>
              <th style={{ textAlign: "right" }}>Assigned</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="rd-id">
                    <span className={`rd-avatar rd-av-${avatarBucket(u.email)}`}>
                      {initials(u.name, u.email)}
                    </span>
                    <span>
                      <span className="rd-id-name">
                        {u.name ?? "—"}
                        {u.id === session.user.id && (
                          <span className="rd-badge rd-badge-accent" style={{ marginLeft: 8 }}>you</span>
                        )}
                      </span>
                      <br />
                      <span className="rd-id-sub">{u.email}</span>
                    </span>
                  </span>
                </td>
                <td>
                  {u.accountType === "company" ? (
                    <span className="rd-badge rd-badge-info">{u.companyName ?? "company"}</span>
                  ) : (
                    <span className="rd-dim">individual</span>
                  )}
                  {u.leadStatus && (
                    <span className="rd-badge rd-badge-warning" style={{ marginLeft: 6 }}>
                      lead: {u.leadStatus.toLowerCase()}
                    </span>
                  )}
                </td>
                <td className="rd-rel">{relTime(u.createdAt, now)}</td>
                <td className="rd-num">{u._count.orders}</td>
                <td className="rd-num">{u._count.assignedOrders}</td>
                <td>
                  <span className={`rd-badge rd-badge-${ROLE_TONE[u.role] ?? "muted"}`} style={{ marginRight: 8 }}>
                    {u.role.toLowerCase()}
                  </span>
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
