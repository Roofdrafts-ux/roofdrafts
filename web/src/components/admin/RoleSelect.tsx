"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";

const ROLES: Role[] = ["CUSTOMER", "ESTIMATOR", "ADMIN"];

export function RoleSelect({
  userId,
  role,
  self,
}: {
  userId: string;
  role: Role;
  self: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Role>(role);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function change(next: Role) {
    const prev = value;
    setValue(next);
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed.");
      setValue(prev);
    }
    setBusy(false);
  }

  return (
    <div className="rd-role-select">
      <select
        className="rd-role-dropdown"
        value={value}
        disabled={busy}
        onChange={(e) => change(e.target.value as Role)}
        title={self ? "You cannot remove your own admin role" : ""}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0) + r.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
      {err && <span className="rd-role-err">{err}</span>}
    </div>
  );
}
