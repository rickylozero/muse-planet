import { ArrowUpRight, CalendarDays, Newspaper } from "lucide-react";
import type { ContentCardItem } from "@/lib/content";

export function ContentCard({
  item,
  label,
}: {
  item: ContentCardItem;
  label: string;
}) {
  return (
    <article className="content-card">
      <div className="content-card-meta">
        <span className="content-card-label">
          <Newspaper size={13} strokeWidth={1.9} aria-hidden="true" />
          {label}
        </span>
        <time className="content-card-date" dateTime={item.createdAt}>
          <CalendarDays size={13} strokeWidth={1.9} aria-hidden="true" />
          {formatPublishedAt(item.createdAt)}
        </time>
      </div>
      <h3>{item.title}</h3>
      <p className="content-card-summary">{item.summary}</p>
      <div className="content-card-footer">
        <p className="content-card-source">
          <Newspaper size={14} strokeWidth={1.9} aria-hidden="true" />
          <span>資料來源：{item.sourceName}</span>
        </p>
        <a
          className="content-card-link"
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`閱讀原文（外部連結）：${item.title}，來源：${item.sourceName}`}
        >
          閱讀原文（外部連結）
          <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "發布時間未提供";
  return new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Hong_Kong",
  }).format(date);
}
