import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestAdmin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categories = [
  "daily_news",
  "edb_official",
  "weekly_topic",
  "study_skill",
  "health_tip",
  "parenting_eq",
] as const;
const statuses = ["draft", "published", "archived"] as const;
const CONTENT_COLUMNS =
  "id,category,title,summary,source_name,source_url,status,is_visible,created_at,expires_at";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request: NextRequest) {
  if (!getRequestAdmin(request)) return json({ error: "unauthorized" }, 401);

  const categoryParam = request.nextUrl.searchParams.get("category") ?? "all";
  const statusParam = request.nextUrl.searchParams.get("status") ?? "all";
  const category = categoryParam === "all" ? null : z.enum(categories).safeParse(categoryParam);
  const status = statusParam === "all" ? null : z.enum(statuses).safeParse(statusParam);

  if (category && !category.success) return json({ error: "invalid_category" }, 400);
  if (status && !status.success) return json({ error: "invalid_status" }, 400);

  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("contents")
      .select(CONTENT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(100);

    if (category && category.success) query = query.eq("category", category.data);
    if (status && status.success) query = query.eq("status", status.data);

    const { data, error } = await query;
    if (error) {
      console.error("[cms] Content list query failed", { code: error.code });
      return json({ error: "content_list_unavailable" }, 503);
    }

    return json({ contents: data ?? [], limit: 100 });
  } catch {
    console.error("[cms] Content list request failed.");
    return json({ error: "content_list_unavailable" }, 503);
  }
}
