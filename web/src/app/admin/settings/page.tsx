import { requireRole } from "@/lib/auth-helpers";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { SETTINGS, getAllSettings } from "@/lib/settings";
import Link from "next/link";
import "../admin.css";

export const metadata = { title: "Settings — Roofdrafts admin" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireRole("ADMIN");
  const values = await getAllSettings();
  const fields = SETTINGS.map((s) => ({
    key: s.key,
    label: s.label,
    description: s.description,
    type: s.type,
    group: s.group,
    placeholder: s.placeholder,
  }));

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
            <Link href="/admin/users" className="rd-admin-navlink">Users</Link>
            <Link href="/admin/pricing" className="rd-admin-navlink">Pricing</Link>
            <Link href="/admin/billing" className="rd-admin-navlink">Billing</Link>
            <Link href="/admin/settings" className="rd-admin-navlink rd-admin-navlink-active">Settings</Link>
            <Link href="/admin/audit" className="rd-admin-navlink">Audit</Link>
            <span className="rd-admin-user">{session.user.name ?? session.user.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Settings</h1>
        <p className="rd-admin-empty" style={{ marginTop: -8, marginBottom: 24 }}>
          Business configuration you control directly. Secrets (API keys, DB) stay in environment
          variables and are never editable here.
        </p>
        <SettingsForm fields={fields} values={values} />
      </main>
    </div>
  );
}
