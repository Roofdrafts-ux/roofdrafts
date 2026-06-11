import { requireRole } from "@/lib/auth-helpers";

import { SettingsForm } from "@/components/admin/SettingsForm";
import { SETTINGS, getAllSettings } from "@/lib/settings";

import "../admin.css";
import { AdminNav } from "@/components/admin/AdminNav";

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
      <AdminNav active="settings" user={session.user.name ?? session.user.email} />

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
