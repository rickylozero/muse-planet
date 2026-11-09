# 品牌 tokens 與 Next.js SEO 實作依據

## Tailwind CSS v4

此專案使用 Tailwind CSS v4。官方文件建議以 CSS `@theme` 定義色彩等設計 tokens，`--color-*` tokens 會建立 `bg-*`、`text-*` 等 utilities；因此 `src/app/globals.css` 是實際生效的色彩來源。`@config` 是與 v3 相容的指令，用來載入 legacy JavaScript config；官方文件範例使用 `tailwind.config.js`，並未將 `.ts` 列為 v4 自動載入或主要設定方式。根目錄可保留要求的型別化 `tailwind.config.ts` 作色票參考，但 CSS `@theme` 必須維持單一 runtime source of truth。[1] [2]

全站 palette 以 `#2D5A27`（Primary）、`#F4F9F9`（Background）、`#E0F2FE`（輔助水色）、`#B87333`（Accent）及 `#1E293B`（Text）定義。Accent 用於原文 CTA、天氣警告標籤及 Logo 星環。

## App Router metadata 與 crawler files

Next.js App Router 支援 `Metadata.title` 的 `default` 與 `template`。正式網站 origin 僅使用明確設定的 `NEXT_PUBLIC_SITE_URL`；未提供真實 canonical 網域時，不輸出猜測或 request-derived 的 canonical、`og:url` 和 sitemap URL。`sitemap.ts` 列出公開可索引頁面，不包括 CMS 或 API；未設定正式 origin 時回傳空 sitemap。`robots.ts` 在 origin 未設定時禁止索引，正式設定後只允許公開頁面並排除 `/admin` 和 `/api/`。[3] [4] [5]

## References

[1]: https://tailwindcss.com/docs/functions-and-directives "Tailwind CSS functions and directives"
[2]: https://tailwindcss.com/docs/theme "Tailwind CSS theme variables"
[3]: https://nextjs.org/docs/app/api-reference/functions/generate-metadata "Next.js Metadata API"
[4]: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap "Next.js sitemap metadata file"
[5]: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots "Next.js robots metadata file"
