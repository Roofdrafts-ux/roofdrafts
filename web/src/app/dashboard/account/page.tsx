import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { AccountActions } from "@/components/dashboard/AccountActions";
import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";
import { EmailVerifyBanner } from "@/components/dashboard/EmailVerifyBanner";
import Link from "next/link";
import "../dashboard.css";
import { RoofMark } from "@/components/primitives";

export const metadata = { title: "Account — Roofdrafts" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireAuth();

  const [user, cred] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true, mustChangePassword: true },
    }),
    prisma.account.findFirst({
      where: { userId: session.user.id, provider: "credentials" },
      select: { id: true },
    }),
  ]);

  const email = user?.email ?? session.user.email ?? "";
  const hasPassword = !!cred;
  const verified = !!user?.emailVerified;
  const mustChange = !!user?.mustChangePassword;

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
        <h1 className="rd-dash-h1">Account &amp; security</h1>
        <p className="rd-dash-sub" style={{ marginBottom: 24 }}>Signed in as {email}.</p>

        {!verified && <EmailVerifyBanner email={email} />}

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 560 }}>
          <ChangePasswordForm hasPassword={hasPassword} mustChange={mustChange} />
          <div style={{ borderTop: "1px solid var(--nj2-border-subtle,#eee)", paddingTop: 24 }}>
            <AccountActions />
          </div>
        </div>
      </main>
    </div>
  );
}
