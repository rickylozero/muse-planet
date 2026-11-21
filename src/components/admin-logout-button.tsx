"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      await Promise.allSettled([
        supabase.auth.signOut(),
        fetch("/api/auth/supabase-session", { method: "DELETE" }),
      ]);
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("登出失敗:", err);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-neutral-100 disabled:opacity-50"
    >
      <LogOut size={16} />
      {isLoading ? "登出中..." : "登出"}
    </button>
  );
}
