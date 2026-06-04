import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/AdminNav";
import { LeadsBoard, type Lead } from "@/components/admin/LeadsBoard";
import "../admin.css";
import type { LeadStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Leads — Roofdrafts admin" };
export const dynamic = "force-dynamic";

const ORDER: Record<LeadStatus, number> = { NEW: 0, CONTACTED: 1, QUALIFIED: 2, CONVERTED: 3, LOST: 4 };

export default async function AdminLeadsPage() {
  const session = await requireRole("ADMIN");

  const rows = await prisma.user.findMany({
    where: { leadStatus: { not: null } },
    select: { id: true, name: true, email: true, companyName: true, monthlyVolume: true, leadStatus: true, leadNotes: true, createdAt: true },
  });

  // Surface open leads (NEW first) ahead of converted/lost; newest within a stage.
  const leads: Lead[] = rows
    .map((r) => ({
      id: r.id, name: r.name, email: r.email, companyName: r.companyName,
      monthlyVolume: r.monthlyVolume, leadStatus: r.leadStatus as LeadStatus,
      leadNotes: r.leadNotes, createdAt: r.createdAt.toISOString(),
    }))
    .sort((a, b) =>
      ORDER[a.leadStatus] - ORDER[b.leadStatus] ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <div className="rd-admin">
      <AdminNav active="leads" user={session.user.name ?? session.user.email} />

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Leads</h1>
        <p className="rd-admin-empty" style={{ marginTop: -8, marginBottom: 24 }}>
          Company signups land here as <b>NEW</b>. Speed matters — reach out fast, then move them through
          the pipeline. Individual customers aren&apos;t tracked as leads.
        </p>
        <LeadsBoard leads={leads} />
      </main>
    </div>
  );
}
