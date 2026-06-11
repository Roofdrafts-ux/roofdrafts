import { requireAuth } from "@/lib/auth-helpers";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { AccountActions } from "@/components/dashboard/AccountActions";
import Link from "next/link";
import "../dashboard.css";
import { RoofMark } from "@/components/primitives";

export const metadata = { title: "Account — Roofdrafts" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireAuth();
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
        <h1 className="rd-dash-h1">Account &amp; privacy</h1>
        <p className="rd-dash-sub" style={{ marginBottom: 24 }}>Signed in as {session.user.email}.</p>
        <AccountActions />
      </main>
    </div>
  );
}
