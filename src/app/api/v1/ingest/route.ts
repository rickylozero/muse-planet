import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;
const CATEGORIES = [
  "daily_news",
  "edb_official",
  "weekly_topic",
  "study_skill",
  "health_tip",
  "parenting_eq",
] as const;

const summarySchema = z
  .string()
  .trim()
  .refine((value) => {
    const characterCount = Array.from(value).length;
    return characterCount >= 60 && characterCount <= 100;
  }, "摘要必須是 60–100 字的純文字內容。");

const sourceUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === "https:" || url.protocol === "http:") &&
        url.username.length === 0 &&
        url.password.length === 0
      );
    } catch {
      return false;
    }
  }, "source_url 必須是有效的 HTTP 或 HTTPS 原文連結。");

const ingestSchema = z
  .object({
    category: z.enum(CATEGORIES),
    title: z.string().trim().min(1).max(200),
    summary: summarySchema,
    source_name: z.string().trim().min(1).max(120),
    source_url: sourceUrlSchema,
  })
  .strict();

class PayloadTooLargeError extends Error {}

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function hasValidApiKey(providedKey: string | null, expectedKey: string): boolean {
  if (!providedKey) return false;

  const provided = Buffer.from(providedKey, "utf8");
  const expected = Buffer.from(expectedKey, "utf8");

  return (
    provided.byteLength === expected.byteLength && timingSafeEqual(provided, expected)
  );
}

async function readLimitedBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      void reader.cancel().catch(() => undefined);
      throw new PayloadTooLargeError();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function POST(request: Request): Promise<Response> {
  const expectedKey = process.env.INGEST_API_KEY;
  if (
    !expectedKey ||
    Buffer.byteLength(expectedKey, "utf8") < 32 ||
    !isSupabaseAdminConfigured()
  ) {
    return jsonResponse(
      { error: "service_not_configured", message: "內容匯入服務尚未完成設定。" },
      503,
    );
  }

  if (!hasValidApiKey(request.headers.get("x-api-key"), expectedKey)) {
    return jsonResponse(
      { error: "unauthorized", message: "請提供有效的 X-API-Key。" },
      401,
    );
  }

  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return jsonResponse(
      { error: "unsupported_media_type", message: "Content-Type 必須是 application/json。" },
      415,
    );
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse(
      { error: "payload_too_large", message: "請求內容不可超過 32 KB。" },
      413,
    );
  }

  let payload: unknown;
  try {
    const rawBody = await readLimitedBody(request);
    payload = JSON.parse(rawBody) as unknown;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return jsonResponse(
        { error: "payload_too_large", message: "請求內容不可超過 32 KB。" },
        413,
      );
    }
    return jsonResponse(
      { error: "invalid_json", message: "請求內容必須是有效的 JSON。" },
      400,
    );
  }

  const parsed = ingestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse(
      {
        error: "invalid_content",
        message: "內容欄位未通過驗證。",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.map(String).join("."),
          code: issue.code,
          message: issue.message,
        })),
      },
      422,
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("contents")
      .insert(parsed.data)
      .select("id, category, title, status, is_visible, created_at, expires_at")
      .single();

    if (error || !data) {
      console.error("[api/v1/ingest] Supabase insert failed", {
        code: error?.code ?? "no_row_returned",
      });
      return jsonResponse(
        { error: "database_write_failed", message: "內容目前無法儲存，請稍後重試。" },
        502,
      );
    }

    return jsonResponse({ ok: true, data }, 201);
  } catch {
    console.error("[api/v1/ingest] Supabase request failed");
    return jsonResponse(
      { error: "database_unavailable", message: "內容資料庫目前無法連線。" },
      503,
    );
  }
}
