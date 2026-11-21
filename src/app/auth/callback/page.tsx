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
          router.replace("/admin");
          router.refresh();
          return;
        }

        const data = (await res.json().catch(() => ({}))) as { error?: string };
        router.replace(`/admin/login?reason=${data.error || "oauth_failed"}`);
      } catch {
        router.replace("/admin/login?reason=oauth_failed");
      }
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        await exchangeSession(data.session.access_token);
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.access_token) {
            listener.subscription.unsubscribe();
            await exchangeSession(session.access_token);
          }
        },
      );

      setTimeout(() => {
        if (!handled) {
          listener.subscription.unsubscribe();
          router.replace("/admin/login?reason=oauth_failed");
        }
      }, 6000);
    };

    init();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-neutral-600">正在驗證管理員身份，請稍候...</p>
    </main>
  );
}
