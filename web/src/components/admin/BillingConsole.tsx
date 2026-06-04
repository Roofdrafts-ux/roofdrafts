"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export type CompanyRow = { id: string; name: string; unbilledCount: number; unbilledTotalUsd: number };
export type InvoiceRow = {
  id: string; number: string; orgName: string; status: string;
  totalUsd: number; orderCount: number; createdAt: string;
};

export function BillingConsole({ companies, invoices }: { companies: CompanyRow[]; invoices: InvoiceRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function call(url: string, body: unknown, okText: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (res.ok) {
      setMsg({ tone: "ok", text: okText });
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ tone: "err", text: d.error ?? "Failed." });
    }
  }

  const billable = companies.filter((c) => c.unbilledCount > 0);

  return (
    <div>
      {msg && <p style={{ fontSize: 13.5, color: msg.tone === "ok" ? "#2e7d32" : "#c0392b", marginBottom: 14 }}>{msg.text}</p>}

      <section className="rd-admin-section">
        <h2 className="rd-admin-h2">Companies with unbilled orders</h2>
        {billable.length === 0 ? (
          <p className="rd-admin-empty">Nothing to invoice right now.</p>
        ) : (
          <table className="rd-admin-table">
            <thead><tr><th>Company</th><th>Unbilled</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {billable.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="rd-dim">{c.unbilledCount} order{c.unbilledCount === 1 ? "" : "s"}</td>
                  <td>{usd(c.unbilledTotalUsd)}</td>
                  <td>
                    <button type="button" className="nj2-btn nj2-btn-brand nj2-btn-sm" disabled={busy}
                      onClick={() => call("/api/admin/invoices", { organizationId: c.id }, `Invoice created for ${c.name}.`)}>
                      Generate invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rd-admin-section">
        <h2 className="rd-admin-h2">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="rd-admin-empty">No invoices yet.</p>
        ) : (
          <table className="rd-admin-table">
            <thead><tr><th>Invoice</th><th>Company</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td className="rd-mono">{i.number}</td>
                  <td className="rd-dim">{i.orgName}</td>
                  <td>{usd(i.totalUsd)}</td>
                  <td><span className="rd-badge rd-badge-accent">{i.status}</span></td>
                  <td style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <a href={`/api/invoices/${i.id}/pdf`} target="_blank" rel="noreferrer" className="rd-auth-link" style={{ fontSize: 13 }}>PDF</a>
                    {i.status === "DRAFT" && (
                      <button type="button" disabled={busy} className="rd-linkbtn"
                        onClick={() => call(`/api/admin/invoices/${i.id}/status`, { status: "SENT" }, `${i.number} sent.`)}>Send</button>
                    )}
                    {(i.status === "DRAFT" || i.status === "SENT") && (
                      <button type="button" disabled={busy} className="rd-linkbtn"
                        onClick={() => call(`/api/admin/invoices/${i.id}/status`, { status: "PAID" }, `${i.number} marked paid.`)}>Mark paid</button>
                    )}
                    {i.status !== "PAID" && i.status !== "VOID" && (
                      <button type="button" disabled={busy} className="rd-linkbtn" style={{ color: "#c0392b" }}
                        onClick={() => { if (confirm(`Void ${i.number}? Its orders return to unbilled.`)) call(`/api/admin/invoices/${i.id}/status`, { status: "VOID" }, `${i.number} voided.`); }}>Void</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <style>{`.rd-linkbtn{background:none;border:none;color:var(--nj2-brand-600,#A2451F);cursor:pointer;font-size:13px;padding:0;font-weight:600}`}</style>
    </div>
  );
}
