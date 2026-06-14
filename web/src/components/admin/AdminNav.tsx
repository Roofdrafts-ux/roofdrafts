import Link from "next/link";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { RoofMark } from "@/components/primitives";

const LINKS: { href: string; label: string; key: string }[] = [
  { href: "/admin", label: "Overview", key: "overview" },
  { href: "/admin/leads", label: "Leads", key: "leads" },
  { href: "/admin/chat", label: "Chat", key: "chat" },
  { href: "/admin/orders", label: "Orders", key: "orders" },
  { href: "/admin/users", label: "Users", key: "users" },
  { href: "/admin/pricing", label: "Pricing", key: "pricing" },
  { href: "/admin/billing", label: "Billing", key: "billing" },
  { href: "/admin/settings", label: "Settings", key: "settings" },
  { href: "/admin/audit", label: "Audit", key: "audit" },
];

/** Shared admin header + nav. Pass the active section key. */
export function AdminNav({ active, user }: { active: string; user: string | null | undefined }) {
  return (
    <header className="rd-admin-header" data-theme="dark">
      <div className="rd-admin-header-inner">
        <Link href="/" className="rd-admin-brand">
          <RoofMark size={24} />
          <span className="rd-admin-brand-roof">roof</span>
          <span className="rd-admin-brand-drafts">drafts</span>
          <span className="rd-admin-tag">admin</span>
        </Link>
        <nav className="rd-admin-nav">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={`rd-admin-navlink${active === l.key ? " rd-admin-navlink-active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <span className="rd-admin-user">{user}</span>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
