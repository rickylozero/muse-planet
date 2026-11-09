import "server-only";

import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

export type ContentCardItem = {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  createdAt: string;
};

export type HomeContent = {
  dailyNews: ContentCardItem[];
  edbOfficial: ContentCardItem[];
  dailyNewsUnavailable: boolean;
  edbOfficialUnavailable: boolean;
};

type JsonRecord = Record<string, unknown>;
const CONTENT_COLUMNS = "id,title,summary,source_name,source_url,created_at";

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function toContentCardItem(value: unknown): ContentCardItem | null {
  const row = asRecord(value);
  if (
    !row ||
    typeof row.id !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string" ||
    typeof row.source_name !== "string" ||
    typeof row.created_at !== "string"
  ) {
    return null;
  }

  const sourceUrl = safeExternalUrl(row.source_url);
  if (!sourceUrl) return null;

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    sourceName: row.source_name,
    sourceUrl,
    createdAt: row.created_at,
  };
}

function normalizeRows(rows: unknown): ContentCardItem[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(toContentCardItem)
    .filter((item): item is ContentCardItem => item !== null);
}

export async function getHomeContent(): Promise<HomeContent> {
  const empty: HomeContent = {
    dailyNews: [],
    edbOfficial: [],
    dailyNewsUnavailable: false,
    edbOfficialUnavailable: false,
  };

  if (!isSupabaseAdminConfigured()) {
    return {
      ...empty,
      dailyNewsUnavailable: true,
      edbOfficialUnavailable: true,
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const [dailyResult, officialResult] = await Promise.all([
      supabase
        .from("contents")
        .select(CONTENT_COLUMNS)
        .eq("category", "daily_news")
        .eq("status", "published")
        .eq("is_visible", true)
        .gt("expires_at", now)
        .order("created_at", { ascending: false })
        .limit(2),
      supabase
        .from("contents")
        .select(CONTENT_COLUMNS)
        .eq("category", "edb_official")
        .eq("status", "published")
        .eq("is_visible", true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    if (dailyResult.error) {
      console.error("[content] Daily news query failed", {
        code: dailyResult.error.code,
      });
    }
    if (officialResult.error) {
      console.error("[content] EDB query failed", {
        code: officialResult.error.code,
      });
    }

    return {
      dailyNews: dailyResult.error ? [] : normalizeRows(dailyResult.data),
      edbOfficial: officialResult.error ? [] : normalizeRows(officialResult.data),
      dailyNewsUnavailable: Boolean(dailyResult.error),
      edbOfficialUnavailable: Boolean(officialResult.error),
    };
  } catch {
    console.error("[content] Supabase home feed request failed.");
    return {
      ...empty,
      dailyNewsUnavailable: true,
      edbOfficialUnavailable: true,
    };
  }
}
