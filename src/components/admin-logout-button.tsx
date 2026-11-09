"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
    } finally {
      router.replace("/admin/login");
    }
  }

  return (
    <button className="admin-logout-button" type="button" onClick={logout} disabled={busy}>
      <LogOut size={16} aria-hidden="true" />
      {busy ? "正在登出…" : "登出"}
    </button>
  );
}
