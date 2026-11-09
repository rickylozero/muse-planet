"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, LoaderCircle, RefreshCw, Search } from "lucide-react";

type Category =
  | "daily_news"
  | "edb_official"
  | "weekly_topic"
  | "study_skill"
  | "health_tip"
  | "parenting_eq";
type Status = "draft" | "published" | "archived";
type ContentRow = {
  id: string;
  category: Category;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  status: Status;
  is_visible: boolean;
  created_at: string;
  expires_at: string | null;
};
type ListResponse = { contents?: ContentRow[]; error?: string; limit?: number };
type UpdateOperation =
  | { action: "set_visibility"; is_visible: boolean }
  | { action: "approve_edb_draft" };

const categoryOptions: Array<{ value: Category | "all"; label: string }> = [
  { value: "all", label: "全部分類" },
  { value: "daily_news", label: "今日快訊" },
  { value: "edb_official", label: "教育局官方資訊" },
  { value: "weekly_topic", label: "每週主題" },
  { value: "study_skill", label: "學習技巧" },
  { value: "health_tip", label: "健康 Tips" },
  { value: "parenting_eq", label: "親子情緒教育" },
];
const statusOptions: Array<{ value: Status | "all"; label: string }> = [
  { value: "all", label: "全部狀態" },
  { value: "draft", label: "草稿" },
  { value: "published", label: "已發布" },
  { value: "archived", label: "已封存" },
];
const categoryLabel = Object.fromEntries(
  categoryOptions
    .filter((item) => item.value !== "all")
    .map((item) => [item.value, item.label]),
) as Record<Category, string>;
const statusLabel: Record<Status, string> = {
  draft: "草稿",
  published: "已發布",
  archived: "已封存",
};

export function AdminContentsManager() {
  const router = useRouter();
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");
  const [contents, setContents] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (status !== "all") params.set("status", status);

    async function loadContents() {
      try {
        const response = await fetch(`/api/v1/admin/contents?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const result = (await response.json()) as ListResponse;
        if (!response.ok || !Array.isArray(result.contents)) {
          throw new Error("內容清單暫時無法載入，請稍後重試。");
        }
        setContents(result.contents);
        setError(null);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "內容清單暫時無法載入。");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadContents();
    return () => controller.abort();
  }, [category, status, reloadKey, router]);

  const filteredContents = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("zh-HK");
    if (!needle) return contents;
    return contents.filter((item) =>
      [item.title, item.summary, item.source_name].some((value) =>
        value.toLocaleLowerCase("zh-HK").includes(needle),
      ),
    );
  }, [contents, query]);

  async function updateContent(item: ContentRow, operation: UpdateOperation) {
    setPendingIds((current) => new Set(current).add(item.id));
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/v1/admin/contents/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(operation),
      });
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const result = (await response.json()) as {
        content?: Pick<ContentRow, "id" | "category" | "status" | "is_visible">;
        error?: string;
      };
      if (!response.ok || !result.content) {
        if (response.status === 409) {
          throw new Error("這則教育局內容已不再是待審草稿，請重新整理清單。");
        }
        throw new Error("更新未能完成，請重新整理後再試。");
      }

      setContents((current) => current.map((row) =>
        row.id === item.id ? { ...row, ...result.content } : row,
      ));
      setLoading(true);
      setReloadKey((key) => key + 1);
      setNotice(operation.action === "approve_edb_draft"
        ? "教育局草稿已審批為已發布；前台顯示開關維持原設定。"
        : operation.is_visible ? "內容已設為前台顯示。" : "內容已從前台隱藏。",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新未能完成，請稍後再試。");
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  function changeCategory(value: Category | "all") {
    setLoading(true);
    setError(null);
    setNotice(null);
    setCategory(value);
  }

  function changeStatus(value: Status | "all") {
    setLoading(true);
    setError(null);
    setNotice(null);
    setStatus(value);
  }

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <label className="admin-label">
          內容分類
          <select className="admin-select" value={category} onChange={(event) => changeCategory(event.target.value as Category | "all")}>
            {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="admin-label">
          審核狀態
          <select className="admin-select" value={status} onChange={(event) => changeStatus(event.target.value as Status | "all")}>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="admin-label admin-search-label">
          搜尋標題、摘要或來源
          <span className="admin-search-control">
            <Search size={16} aria-hidden="true" />
            <input className="admin-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="輸入關鍵字" />
          </span>
        </label>
        <button className="admin-refresh-button" type="button" onClick={() => { setLoading(true); setError(null); setNotice(null); setReloadKey((key) => key + 1); }} disabled={loading}>
          <RefreshCw size={15} aria-hidden="true" />重新載入
        </button>
      </div>

      <div className="admin-result-line" aria-live="polite">
        <span>{loading ? "正在載入內容…" : `顯示 ${filteredContents.length} 則內容`}</span>
        {!loading && contents.length === 100 && <span>只載入最新 100 則，請使用分類或狀態篩選。</span>}
      </div>

      {error && <p className="admin-feedback" data-state="error" role="alert">{error}</p>}
      {notice && <p className="admin-feedback" role="status"><Check size={16} aria-hidden="true" />{notice}</p>}

      {loading ? (
        <div className="admin-empty-state" role="status"><LoaderCircle className="admin-spinner" size={22} aria-hidden="true" />正在整理內容清單…</div>
      ) : error ? null : filteredContents.length === 0 ? (
        <div className="admin-empty-state">
          <strong>{contents.length ? "沒有符合篩選條件的內容" : "目前尚無內容"}</strong>
          <span>{contents.length ? "請嘗試其他分類、狀態或關鍵字。" : "外部匯入的內容會先以草稿狀態等待管理員審核。"}</span>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th scope="col">內容</th><th scope="col">分類／狀態</th><th scope="col">建立時間</th><th scope="col">前台顯示</th><th scope="col">審核操作</th></tr>
            </thead>
            <tbody>
              {filteredContents.map((item) => {
                const busy = pendingIds.has(item.id);
                return (
                  <tr key={item.id}>
                    <td className="admin-content-cell">
                      <div className="admin-content-preview">
                        <strong>{item.title}</strong>
                        <span>{item.summary}</span>
                        <small>資料來源：{item.source_name}</small>
                      </div>
                    </td>
                    <td>
                      <span className="admin-category-label">{categoryLabel[item.category]}</span>
                      <span className="admin-status" data-status={item.status}>{statusLabel[item.status]}</span>
                    </td>
                    <td><time dateTime={item.created_at}>{formatDate(item.created_at)}</time></td>
                    <td>
                      <button
                        className="admin-visibility"
                        type="button"
                        role="switch"
                        aria-checked={item.is_visible}
                        aria-label={`${item.is_visible ? "隱藏" : "顯示"}「${item.title}」`}
                        disabled={busy}
                        onClick={() => void updateContent(item, { action: "set_visibility", is_visible: !item.is_visible })}
                      >
                        {busy ? <LoaderCircle className="admin-spinner" size={16} aria-hidden="true" /> : item.is_visible ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
                        {item.is_visible ? "顯示中" : "已隱藏"}
                      </button>
                    </td>
                    <td>
                      {item.category === "edb_official" && item.status === "draft" ? (
                        <button className="admin-action" type="button" disabled={busy} onClick={() => void updateContent(item, { action: "approve_edb_draft" })}>
                          {busy ? <LoaderCircle className="admin-spinner" size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
                          審批為已發布
                        </button>
                      ) : <span className="admin-no-action">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Hong_Kong",
  }).format(date);
}
