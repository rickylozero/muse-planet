"use client";

import { useState } from "react";
import { ArrowUpRight, LoaderCircle, Orbit } from "lucide-react";

export function AdminLoginButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function beginLogin() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const result = (await response.json()) as { authorizationUrl?: string };
      if (!response.ok || !result.authorizationUrl) {
        throw new Error("登入服務暫時無法使用，請稍後再試。" );
      }

      const topWindow = window.top;
      if (topWindow) topWindow.location.assign(result.authorizationUrl);
      else window.location.assign(result.authorizationUrl);
    } catch {
      setError("無法開始 Manus 登入，請確認連線後再試。" );
      setBusy(false);
    }
  }

  return (
    <div className="admin-login-actions">
      <button className="admin-login-button" type="button" onClick={beginLogin} disabled={busy}>
        {busy ? <LoaderCircle className="admin-spinner" size={18} aria-hidden="true" /> : <Orbit size={18} aria-hidden="true" />}
        {busy ? "正在前往安全登入…" : "使用 Manus 帳戶登入"}
        {!busy && <ArrowUpRight size={16} aria-hidden="true" />}
      </button>
      {error && <p className="admin-feedback" data-state="error" role="alert">{error}</p>}
    </div>
  );
}
