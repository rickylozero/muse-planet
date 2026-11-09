import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestAdmin, isSameSessionOrigin } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Id = z.string().uuid();
const Operation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_visibility"), is_visible: z.boolean() }).strict(),
  z.object({ action: z.literal("approve_edb_draft") }).strict(),
]);
const RESULT_COLUMNS = "id,category,status,is_visible";

type RouteContext = { params: Promise<{ id: string }> };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = getRequestAdmin(request);
  if (!admin) return json({ error: "unauthorized" }, 401);
  if (!isSameSessionOrigin(admin, request)) {
    return json({ error: "origin_forbidden" }, 403);
  }

  const { id } = await context.params;
  if (!Id.safeParse(id).success) return json({ error: "invalid_content_id" }, 400);

  const rawBody = await request.text().catch(() => "");
  if (!rawBody || rawBody.length > 2048) return json({ error: "invalid_request" }, 400);

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  const operation = Operation.safeParse(body);
  if (!operation.success) return json({ error: "invalid_operation" }, 400);

  try {
    const supabase = createSupabaseAdminClient();
    const result = operation.data.action === "set_visibility"
      ? await supabase
          .from("contents")
          .update({ is_visible: operation.data.is_visible })
          .eq("id", id)
          .select(RESULT_COLUMNS)
          .maybeSingle()
      : await supabase
          .from("contents")
          .update({ status: "published" })
          .eq("id", id)
          .eq("category", "edb_official")
          .eq("status", "draft")
          .select(RESULT_COLUMNS)
          .maybeSingle();

    if (result.error) {
      console.error("[cms] Content update failed", { code: result.error.code });
      return json({ error: "content_update_unavailable" }, 503);
    }
    if (!result.data) {
      return json({
        error: operation.data.action === "approve_edb_draft"
          ? "edb_draft_not_found_or_already_reviewed"
          : "content_not_found",
      }, operation.data.action === "approve_edb_draft" ? 409 : 404);
    }

    return json({ content: result.data });
  } catch {
    console.error("[cms] Content update request failed.");
    return json({ error: "content_update_unavailable" }, 503);
  }
}
