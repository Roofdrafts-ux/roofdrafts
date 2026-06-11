import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";


import "../admin.css";
import { AdminNav } from "@/components/admin/AdminNav";

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
      <AdminNav active="audit" user={session.user.name ?? session.user.email} />

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
