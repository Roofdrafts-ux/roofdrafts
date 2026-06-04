import { requireOrg, orgAtLeast } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { TeamManager } from "@/components/dashboard/TeamManager";
import Link from "next/link";
import "../dashboard.css";

export const metadata = { title: "Team — Roofdrafts" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { session, membership } = await requireOrg("MEMBER");
  const canManage = orgAtLeast(membership.role, "ADMIN");

  const rawMembers = await prisma.organizationMember.findMany({
    where: { organizationId: membership.organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  const members = rawMembers.map((m) => ({
    id: m.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    isSelf: m.userId === session.user.id,
  }));

  const invitations = canManage
    ? (
        await prisma.invitation.findMany({
          where: { organizationId: membership.organizationId, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        })
      ).map((i) => ({ id: i.id, email: i.email, role: i.role }))
    : [];

  return (
    <div className="rd-dash">
      <header className="rd-dash-header">
        <div className="rd-dash-header-inner">
          <Link href="/dashboard" className="rd-dash-brand">
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
        <h1 className="rd-dash-h1">{membership.orgName} · Team</h1>
        <p className="rd-dash-sub" style={{ marginBottom: 24 }}>
          {canManage
            ? "Invite teammates and manage their access. Everyone in the organization shares its reports."
            : "Members of your organization. Ask an admin to invite teammates or change roles."}
        </p>
        <TeamManager
          members={members}
          invitations={invitations}
          canManage={canManage}
          isOwner={membership.role === "OWNER"}
        />
      </main>
    </div>
  );
}
