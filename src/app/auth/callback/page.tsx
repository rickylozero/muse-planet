"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let handled = false;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const exchangeSession = async (accessToken: string) => {
      if (handled) return;
      handled = true;

      try {
        const res = await fetch("/api/auth/supabase-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });

        if (res.ok) {
          window.location.href = "/admin";
          return;
        }

        const data = (await res.json().catch(() => ({}))) as { error?: string };
        const reason = data.error || `http_${res.status}`;
        router.replace(`/admin/login?reason=${encodeURIComponent(reason)}`);
      } catch {
        router.replace("/admin/login?reason=fetch_error");
      }
    };

    const init = async () => {
      // 1. 直接從網址的 #access_token=... 讀取
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashToken = hashParams.get("access_token");
      if (hashToken) {
        await exchangeSession(hashToken);
        return;
      }

      // 2. 若網址沒有，再從 Supabase Session 讀取
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        await exchangeSession(data.session.access_token);
        return;
      }

      router.replace("/admin/login?reason=no_token");
    };

    init();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-neutral-600">正在驗證管理員身份，請稍候...</p>
    </main>
  );
}
