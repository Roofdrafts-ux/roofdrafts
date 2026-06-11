"use client";
// Admin "Add team member" — creates the account server-side, emails a
// temporary password, and shows it once here as the fallback handoff.
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ESTIMATOR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; tempPassword: string; emailed: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, email: email.trim(), role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Couldn't create the account.");
        return;
      }
      const d = data as { user: { email: string }; tempPassword: string; emailed: boolean };
      setDone({ email: d.user.email, tempPassword: d.tempPassword, emailed: d.emailed });
      setName(""); setEmail(""); setRole("ESTIMATOR");
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rd-adduser rd-adduser-done">
        <p className="rd-adduser-done-title">Account created for {done.email}</p>
        <p className="rd-adduser-done-row">
          Temporary password: <code className="rd-adduser-pw">{done.tempPassword}</code>
        </p>
        <p className="rd-adduser-done-hint">
          {done.emailed
            ? "They've been emailed sign-in instructions too. This password is shown only once."
            : "The email didn't go out — copy this password now and share it securely; it won't be shown again."}
        </p>
        <button type="button" className="rd-filter" onClick={() => setDone(null)}>
          Add another
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="rd-adduser-cta" onClick={() => setOpen(true)}>
        + Add team member
      </button>
    );
  }

  return (
    <form className="rd-adduser" onSubmit={submit}>
      <input
        className="rd-adduser-input"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Full name"
      />
      <input
        className="rd-adduser-input"
        type="email"
        required
        placeholder="email@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email"
      />
      <select
        className="rd-role-dropdown"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        aria-label="Role"
      >
        <option value="ESTIMATOR">Estimator</option>
        <option value="ADMIN">Admin</option>
        <option value="CUSTOMER">Customer</option>
      </select>
      <button type="submit" className="rd-adduser-submit" disabled={busy || !email.trim()}>
        {busy ? "Creating…" : "Create account"}
      </button>
      <button type="button" className="rd-filter" onClick={() => { setOpen(false); setError(null); }}>
        Cancel
      </button>
      {error && <span className="rd-role-err">{error}</span>}
    </form>
  );
}
