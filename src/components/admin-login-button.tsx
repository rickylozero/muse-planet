"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/admin.ts";

export function AdminLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("登入錯誤:", err.message);
      alert("登入失敗，請確認網路連線或稍後再試。");
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="admin-login-btn w-full flex items-center justify-center gap-2 bg-[#9E6438] hover:bg-[#85512B] text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
    >
      <LogIn size={18} />
      {isLoading ? "正在連接認證..." : "使用 GitHub 帳戶登入 ↗"}
    </button>
  );
}
