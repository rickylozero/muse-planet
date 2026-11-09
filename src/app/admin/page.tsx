import Link from "next/link";
import { redirect } from "next/navigation";
import { Orbit, ShieldCheck } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminContentsManager } from "@/components/admin-contents-manager";
import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link className="admin-topbar-brand" href="/" aria-label="沐智星球首頁">
            <span className="admin-auth-mark" aria-hidden="true"><Orbit size={23} /></span>
            <span><strong>沐智星球</strong><small>CONTENT STUDIO</small></span>
          </Link>
          <div className="admin-topbar-user">
            <span className="admin-user-badge"><ShieldCheck size={15} aria-hidden="true" />已授權管理員</span>
            <span className="admin-user-email">{admin.email}</span>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="後台導覽">
          <p className="admin-sidebar-kicker">WORKSPACE</p>
          <a href="#content-list" aria-current="page">內容管理</a>
          <p className="admin-sidebar-note">依分類檢視摘要、管理前台顯示，並審核教育局官方草稿。</p>
          <Link className="admin-sidebar-home" href="/">← 返回公開網站</Link>
        </aside>

        <section className="admin-main" id="content-list" aria-labelledby="admin-title">
          <div className="admin-page-heading">
            <div>
              <p className="admin-kicker">EDITORIAL DESK · CONTENT REVIEW</p>
              <h1 id="admin-title">內容管理</h1>
              <p>先確認來源與摘要，再核准教育局資訊；前台顯示狀態可獨立切換。</p>
            </div>
            <span className="admin-live-note"><span aria-hidden="true" />變更即時寫入 Supabase</span>
          </div>
          <AdminContentsManager />
        </section>
      </div>
    </main>
  );
}
