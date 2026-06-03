"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type SettingField = {
  key: string;
  label: string;
  description: string;
  type: "string" | "emails" | "url" | "boolean";
  group: string;
  placeholder?: string;
};

export function SettingsForm({
  fields,
  values,
}: {
  fields: SettingField[];
  values: Record<string, string>;
}) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, string>>(values);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const dirty = fields.some((f) => (state[f.key] ?? "") !== (values[f.key] ?? ""));
  const groups = Array.from(new Set(fields.map((f) => f.group)));

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: state }),
    });
    if (res.ok) {
      setMsg({ tone: "ok", text: "Settings saved." });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ tone: "err", text: d.error ?? "Failed to save." });
    }
    setBusy(false);
  }

  const set = (k: string, v: string) => setState((s) => ({ ...s, [k]: v }));

  return (
    <div style={{ maxWidth: 640 }}>
      {groups.map((group) => (
        <section key={group} className="rd-admin-section">
          <h2 className="rd-admin-h2">{group}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {fields
              .filter((f) => f.group === group)
              .map((f) => (
                <div key={f.key}>
                  <label
                    htmlFor={f.key}
                    style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}
                  >
                    {f.label}
                  </label>
                  <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "var(--nj2-fg-3)" }}>
                    {f.description}
                  </p>
                  {f.type === "boolean" ? (
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                      <input
                        id={f.key}
                        type="checkbox"
                        checked={(state[f.key] ?? "false") === "true"}
                        onChange={(e) => set(f.key, e.target.checked ? "true" : "false")}
                        style={{ accentColor: "var(--nj2-brand-500)", width: 16, height: 16 }}
                      />
                      {(state[f.key] ?? "false") === "true" ? "Enabled" : "Disabled"}
                    </label>
                  ) : (
                    <input
                      id={f.key}
                      type="text"
                      value={state[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.key, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--nj2-border-subtle, #d8d2c7)",
                        fontSize: 14,
                        fontFamily: "var(--nj2-font-body)",
                        background: "var(--nj2-bg-card, #fff)",
                        color: "var(--nj2-fg-1)",
                      }}
                    />
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
        <button
          type="button"
          className="nj2-btn nj2-btn-brand"
          disabled={busy || !dirty}
          onClick={save}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
        {msg && (
          <span style={{ fontSize: 13.5, color: msg.tone === "ok" ? "#2e7d32" : "#c0392b" }}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
