"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Stage = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
const STAGES: Stage[] = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];
const VOLUME_LABEL: Record<string, string> = { "1-5": "1–5/mo", "5-20": "5–20/mo", "20+": "20+/mo" };

export type Lead = {
  id: string;
  name: string | null;
  email: string;
  companyName: string | null;
  monthlyVolume: string | null;
  leadStatus: Stage;
  leadNotes: string | null;
  createdAt: string;
};

function ageLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function LeadsBoard({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(leads.map((l) => [l.id, l.leadNotes ?? ""]))
  );

  const counts = STAGES.map((s) => [s, leads.filter((l) => l.leadStatus === s).length] as const);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
  }

  if (leads.length === 0) {
    return <p className="rd-admin-empty">No company leads yet. They&apos;ll appear here the moment a company signs up.</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {counts.map(([s, n]) => (
          <div key={s} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--nj2-border-subtle,#e5e0d6)", background: s === "NEW" && n > 0 ? "var(--nj2-brand-50,#FBECE4)" : "#fff" }}>
            <div style={{ fontSize: 11, color: "var(--nj2-fg-3,#888)", letterSpacing: ".04em" }}>{s}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s === "NEW" && n > 0 ? "var(--nj2-brand-600,#A2451F)" : "inherit" }}>{n}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {leads.map((l) => (
          <div key={l.id} style={{ border: "1px solid var(--nj2-border-subtle,#e5e0d6)", borderRadius: 12, padding: 14, background: l.leadStatus === "NEW" ? "var(--nj2-brand-50,#FBECE4)" : "#fff" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{l.companyName ?? l.name ?? l.email}</div>
                <div style={{ fontSize: 13, color: "var(--nj2-fg-2,#555)" }}>
                  {l.name ? `${l.name} · ` : ""}
                  <a href={`mailto:${l.email}`} style={{ color: "var(--nj2-brand-600,#A2451F)" }}>{l.email}</a>
                </div>
                <div style={{ fontSize: 12, color: "var(--nj2-fg-3,#888)", marginTop: 2 }}>
                  {l.monthlyVolume ? `${VOLUME_LABEL[l.monthlyVolume] ?? l.monthlyVolume} · ` : ""}signed up {ageLabel(l.createdAt)}
                </div>
              </div>
              <select
                value={l.leadStatus}
                disabled={busyId === l.id}
                onChange={(e) => patch(l.id, { leadStatus: e.target.value })}
                style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d8d2c7", fontSize: 13, fontWeight: 600, height: 38 }}
              >
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "flex-end" }}>
              <textarea
                value={notes[l.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [l.id]: e.target.value }))}
                placeholder="Notes — call outcome, next step…"
                rows={1}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #d8d2c7", fontSize: 13, fontFamily: "var(--nj2-font-body)", resize: "vertical" }}
              />
              {(notes[l.id] ?? "") !== (l.leadNotes ?? "") && (
                <button type="button" className="nj2-btn nj2-btn-brand nj2-btn-sm" disabled={busyId === l.id}
                  onClick={() => patch(l.id, { leadNotes: notes[l.id] ?? "" })}>
                  Save
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
