"use client";
import { useEffect, useState } from "react";

/** Live SLA countdown. Turns red when overdue. */
export function Countdown({ dueAt }: { dueAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!dueAt) return <span className="rd-eta-muted">—</span>;

  const due = new Date(dueAt).getTime();
  const diff = due - now;
  const overdue = diff < 0;
  const abs = Math.abs(diff);

  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = Math.floor((abs % 60_000) / 1000);
  const label = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;

  return (
    <span className={overdue ? "rd-eta-over" : "rd-eta-ok"}>
      {overdue ? `${label} overdue` : `${label} left`}
    </span>
  );
}
