import { requireRole } from "@/lib/auth-helpers";
import { AdminNav } from "@/components/admin/AdminNav";
import { ChatConsole } from "@/components/admin/ChatConsole";
import "../admin.css";

export const metadata = { title: "Chat — Roofdrafts admin" };
export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const session = await requireRole("ADMIN");

  return (
    <div className="rd-admin">
      <AdminNav active="chat" user={session.user.name ?? session.user.email} />

      <main className="rd-admin-main">
        <h1 className="rd-admin-h1">Live chat</h1>
        <p className="rd-admin-empty" style={{ marginTop: -8, marginBottom: 24 }}>
          Conversations from the website widget. Visitors see &ldquo;typically replies in under 5
          minutes&rdquo; — keep that promise.
        </p>
        <ChatConsole />
      </main>
    </div>
  );
}
