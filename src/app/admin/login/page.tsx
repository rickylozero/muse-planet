import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LockKeyhole,
  Newspaper,
  Orbit,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AdminLoginButton } from "@/components/admin-login-button";
import { PlanetIllustration } from "@/components/planet-illustration";
import { getCurrentAdmin } from "@/lib/auth/session";

const reasonCopy: Record<string, string> = {
  oauth_failed: "Manus 登入未能完成，請重新開始。",
  identity_failed: "無法確認 Manus 帳戶身份，請重新登入。",
  not_authorized: "此 Manus 帳戶未獲 CMS 管理員授權。",
  oauth_unavailable: "登入服務暫時無法使用，請稍後再試。",
};

type LoginPageProps = {
  searchParams?: Promise<{ reason?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await getCurrentAdmin()) redirect("/admin");
  const params = searchParams ? await searchParams : {};
  const message = params.reason ? reasonCopy[params.reason] : undefined;

  return (
    <main className="admin-auth-shell">
      <div className="admin-auth-layout">
        <aside className="admin-auth-visual" aria-labelledby="admin-welcome-title">
          <div className="admin-auth-planet-art">
            <PlanetIllustration className="admin-auth-planet-illustration" />
            <span className="admin-auth-floating admin-auth-floating--sparkle" aria-hidden="true">
              <Sparkles size={20} />
            </span>
            <span className="admin-auth-floating admin-auth-floating--moon" aria-hidden="true">
              <span />
            </span>
          </div>
          <p className="admin-auth-visual-kicker">
            <Sparkles size={15} aria-hidden="true" />
            MUSE PLANET · CONTENT STUDIO
          </p>
          <h1 id="admin-welcome-title">
            歡迎來到
            <span>沐智星球</span>
          </h1>
          <p className="admin-auth-visual-copy">
            讓好資訊沿著清晰軌道，陪每個家庭自在成長。
          </p>
          <div className="admin-auth-features" aria-label="平台管理特色">
            <span><Newspaper size={14} aria-hidden="true" />來源清楚</span>
            <span><ShieldCheck size={14} aria-hidden="true" />審核有序</span>
          </div>
        </aside>

        <section className="admin-auth-card" aria-labelledby="admin-login-title">
          <Link className="admin-auth-brand" href="/" aria-label="返回沐智星球首頁">
            <span className="admin-auth-mark" aria-hidden="true">
              <Orbit size={26} />
              <span className="admin-auth-mark-ring" />
            </span>
            <span>
              <strong>沐智星球親子平台 (Muse Planet)</strong>
              <small>MUSE PLANET · CONTENT STUDIO</small>
            </span>
          </Link>
          <p className="admin-kicker">
            <LockKeyhole size={14} aria-hidden="true" />
            PRIVATE CONTENT STUDIO
          </p>
          <h2 id="admin-login-title">編輯與審核工作台</h2>
          <p className="admin-auth-copy">
            使用已獲授權的 Manus 帳戶登入，即可整理內容並協助優質資訊安全發布。
          </p>
          {message && <p className="admin-feedback" data-state="error" role="alert">{message}</p>}
          <AdminLoginButton />
          <p className="admin-auth-footnote">
            <LockKeyhole size={14} aria-hidden="true" />
            登入驗證由 Manus OAuth 處理；平台密鑰不會送到瀏覽器。
          </p>
          <Link className="admin-back-link" href="/">
            <Orbit size={14} aria-hidden="true" />
            返回公開首頁
          </Link>
        </section>
      </div>
    </main>
  );
}
