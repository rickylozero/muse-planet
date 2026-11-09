# 沐智星球親子平台 (Muse Planet) — 階段交付事項

> Phase 1–4 產品功能已交付；此清單保留功能驗收、刻意不實作的登入旁路，以及尚待資料擁有人處理的 QA 測試資料清理事項。

## Phase 1 — Next.js 基礎專案與視覺排版（已完成）

- [x] 初始化 Next.js 專案，採用 Next.js（App Router）、React、Tailwind CSS，並加入 Lucide-react 圖示支援。
- [x] 設定初始自然溫和 Earth tones（大地木質色系、白底、灰綠／暖棕點綴）變數與基礎排版，維持大留白、無廣告干擾、圓角卡片式閱讀體驗。
- [x] 建立具響應式排版的基礎網站外框及首頁預覽。

## Phase 2 — Supabase 結構與外部寫入 API（已完成）

- [x] 設計 `contents` 資料表：`id` UUID；`category` enum (`daily_news`, `edb_official`, `weekly_topic`, `study_skill`, `health_tip`, `parenting_eq`)；`title` string；`summary` text（60–100 字純摘要）；`source_name` string（例「星島日報」「香港01」「教育局」）；`source_url` 原文外部跳轉連結；`status` enum (`draft`, `published`, `archived`)；`is_visible` boolean（前台顯示開關）；`created_at` timestamp；可為空的 `expires_at` timestamp。
- [x] 每日新聞 `daily_news` 的 `expires_at` 設置為建立後 24 小時；其他內容的 `expires_at` 可為空。
- [x] 開放 `POST /api/v1/ingest` Endpoint 並進行 API Key 驗證，允許外部 Python/GAS 腳本將抓取的結構化摘要資料寫入資料庫；所有外部匯入固定成 draft 且 `is_visible=false`。
- [x] 資料庫/BaaS 依使用者選擇採用 Supabase PostgreSQL，並實際套用 schema 和 API 寫入。

## Phase 3 — 前台資訊與香港天文台天氣（已完成）

- [x] 頁首串接香港天文台即時天氣 API，顯示當前氣溫、濕度及天氣警告圖示。
- [x] 今日教育快訊 `daily_news` 僅渲染 `expires_at` 尚未過期且 `is_visible=true` 的最新 1–2 則卡片；每張卡片下方必須有「資料來源：[來源名稱]」與「閱讀原文（外部連結）」按鈕。
- [x] 教育局專區 `edb_official` 僅顯示經過審批、`status='published'` 的官方要聞。
- [x] 主題分類展示卡片模組化呈現升學遊學、學習技巧與健康 Tips。

## Phase 4 — 品牌重構、SEO 與後台 CMS（核心功能已交付）

### 品牌與 SEO

- [x] 全站頁首、頁尾、登入品牌標誌、首頁、社群圖卡、metadata、PWA manifest、route manifest 與文件統一使用「沐智星球親子平台 (Muse Planet)」；`package.json` 使用 `muse-planet`、Tailwind palette 使用 `musePalette`，保留實際 `/`、`/admin`、`/admin/login` 路由，不虛構品牌 URL。
- [x] 使用 Lucide Orbit/Globe 深碧星球圖示，純 CSS 增添金屬銅金星環或三枚金屬光澤星體；不要求或依賴使用者上傳圖片。
- [x] 全站 Tailwind v4 CSS tokens 與基礎 CSS 採用 Primary `#2D5A27`、Background `#F4F9F9`（並可用 `#E0F2FE` 作水色輔助面板）、Accent `#B87333`、Text `#1E293B`；主導覽使用 Primary、重點按鈕與天氣警告使用 Accent。提供一致的 Tailwind theme palette reference。
- [x] App Router metadata 預設 Title template 設為 `%s | 沐智星球親子平台 (Muse Planet)`，Description 設為「專為香港家長打造的智慧教育平台，整合最新教育局快訊、升學情報與天文台即時天氣，您的育兒專屬智囊團。」
- [x] canonical、Open Graph 和 sitemap 的絕對 URL 僅由實際設定的正式 HTTPS `NEXT_PUBLIC_SITE_URL` 產生；目前沒有設定正式網域，因此不猜測 Muse 網域或新增不存在的 sitemap 路徑；`robots.ts` 維持不索引未設定 canonical 的站點。
- [x] 前台新聞卡片和版面保留 `<article>`、`<section>`、`<main>` 等 HTML5 語意元素；在 App Router 建立 `sitemap.ts` 與 `robots.ts`，不猜測正式網域，也不索引私密後台/API。

### 前台與登入頁視覺升級（已完成）

- [x] 全站標題採親和的 sans-serif／rounded system UI；調大標題與卡片標題、精簡內文、增加行高與字距，並使用柔和的深灰文字。
- [x] 功能、分類、天氣資訊與新聞來源均加上 Lucide 圖示；頁面留白與 Banner 使用純 CSS/SVG 繪製的星球、星軌、雲朵與小星星裝飾，不上傳圖片。
- [x] 新聞、快訊及天氣資訊採圓角 `rounded-2xl` 卡片、輕陰影 `shadow-sm` 與 `hover:scale-[1.01] hover:shadow-md`；日期與來源使用綠、金、藍色 pill badge。
- [x] `/admin/login` 左側或上方加入大型 Muse Planet 立體星環／小星體 CSS/SVG 插畫和「歡迎來到沐智星球」標題；Manus 登入按鈕具漸層、金屬微光與 3D 質感。
- [x] 手機版仍須可存取每日快訊、教育局資訊、主題、平台理念與內容管理登入入口；選單須可使用鍵盤操作。

### CMS 核心與權限（已實作並於 Preview 驗證；使用者已批准僅啟用 `server=true`，維持 `database=false` 且不發布）

- [x] 建立後台內容清單，支援依 `contents.category` 分類篩選。
- [x] 管理員可一鍵切換 `is_visible`，隱藏或顯示前台內容。
- [x] 管理員可將教育局草稿 `status='draft'` 審批為 `status='published'`。
- [x] 後台內容清單支援按六個 `contents.category` 分類及三種 `status` 篩選，並可搜尋標題、摘要或來源；核准後清單必須反映目前篩選，且不同內容列的並行操作不得互相解除仍在進行中的狀態。
- [x] 所有 CMS 查詢與修改均須經 Manus OAuth 管理員身份授權，email 必須符合受保護的管理員允許清單；不建立共用密碼或讓瀏覽器持有 Supabase secret。
- [x] OAuth 只接受 `CMS_ALLOWED_ORIGINS` 所列的確切 origin；callback 的 redirect URI 必須是該 allowlist 內 origin 的 `/api/auth/callback`，並先驗證發起瀏覽器的單次 nonce cookie，再交換 authorization code。session 綁定相同 origin，成功後只導回固定 `/admin`。
- [x] CMS 修改與登出須驗證有效管理員 session 和同源請求；WebDev Preview 會改寫 `Origin` 並省略 `Referer`，只有候選 origin 已在 allowlist 且 `Sec-Fetch-Site: same-origin` 才可作 fallback；如有 `Referer`，其 origin 必須符合候選值；拒絕 `cross-site`/`same-site` metadata。
- [x] WebDev server feature 啟用屬不可逆設定；使用者已明確批准僅啟用 `server=true`，維持 `database=false` 且不發布正式服務。

### Preview 登入隔離與效能（已交付；不實作登入旁路）

- [ ] **受安全規範限制，未實作：** 使用者要求在 `/admin/login` 新增「🚀 測試：管理員一鍵快速登入 (免 OAuth)」按鈕，只在非 production／Preview 或 localhost 顯示，並僅模擬 `CMS_ADMIN_EMAILS` 中的帳號。Cloud Preview 必須使用真實 Manus OAuth 和已驗證 session；不得以 `NODE_ENV`／hostname 條件建立假 Preview 使用者或繞過登入，因此不新增此按鈕／旁路。
- [x] 天氣資料保留香港天文台即時資訊與伺服器端 300 秒 revalidate；瀏覽器只在首次載入及可見頁籤已過 15 分鐘時更新，不在背景頁籤持續輪詢。
- [x] 稽核 middleware、HMR 與 `/admin` redirect chain：專案無 middleware/proxy；無有效 session 時 `/admin` 一次 307 至 `/admin/login`，login 回 200、admin API 回 401，未觀察到持續互相導向。Next dev 曾拒絕 `127.0.0.1` 的 HMR origin，已加精確 dev-only `allowedDevOrigins`；重啟後公開 Preview 登入頁與 OAuth start 均回 200；不對公開 host 或 app API 放寬 CORS。

### Supabase CMS 測試資料（2026-10-11）

- [x] 原 `public.contents` 為空；加入 8 筆合成資料，全部以 `MUSE-QA-20261011-` 開頭並在摘要/來源明確標為測試資料；包括 `daily_news`（有效/隱藏/過期）、`edb_official` 草稿、`weekly_topic`、`study_skill`、`health_tip`，狀態含 draft/published，summary 長度 68–100 字。
- [x] 登入 Preview CMS 後，以 `edb_official` + `draft` 篩選得到 1 筆待審草稿；測試 `daily_news` #02 的 `is_visible=false → true → false`，資料庫值最後還原為 false；透過 UI 審批 EDB #04 並確認資料庫 `status='published'`。
- [ ] 使用者測試完成、正式啟用前，須清理或封存 `MUSE-QA-20261011-%` 標記的合成內容；目前保留一筆隱藏 EDB draft 供使用者接手測試。

### Preview 滾動與渲染效能（2026-10-12）

- [x] 停止現有 `next dev`，以 `next build` 後透過 `next start` 在既有 Preview port 3000（`0.0.0.0`）提供預覽；不得發布正式網站或更改 `server=true`、`database=false` 與 `auto_publish=false`。已確認 `next-server` 為 `next start`，公開 Preview 的首頁、登入頁、`/manus-routes.json` 均回 HTTP 200；沒有發布正式站。
- [x] 所有捲動行為避免 JavaScript scroll listener；若需事件則 passive；不使用昂貴視差或複雜 3D 動畫；一般頁面捲動不可被背景 timer 或 fetch 觸發。source audit 無 scroll listener、parallax、裝飾性持續 planet animation；scroll 期間沒有新增 fetch，也沒有 production HMR script。
- [x] 前台卡片與 CMS 長清單使用輕量 offscreen rendering / intrinsic-size 預留尺寸；圖片如有使用須明確尺寸並設 `loading="lazy"`；SVG/圖示需固定尺寸以避免 layout shift。不得對所有元素廣泛加 `will-change` 或強制建立合成層。內容卡及 CMS 文字預覽採 `content-visibility:auto`/`contain-intrinsic-size`；專案沒有 raster `<img>`/Next `<Image>`；hero inline SVG 有固定 `width=640`、`height=540`。
- [x] 天氣及 scraper 不得使用 client-side `setInterval`/`setTimeout` 輪詢；天氣只可在首次載入及使用者切回可見頁籤且資料過期時請求。全 `src` 搜尋無 client timer；天氣更新僅由 mount/`visibilitychange` 觸發。
- [x] 在 Preview 實際往下與往上捲動，驗證頁面回應、卡片布局穩定，並記錄可觀察到的結果；不可僅憑 production build 宣稱 FPS 提升。3.2 秒 scripted down/up 測試跨 2,319px，187 frames、平均 58.1 FPS、p95 16.9ms、5 個 frame >32ms、scroll 期間 0 fetch、無 HMR script；原生 browser 向下至頁尾再向上至頁首，觀察到 0 layout-shift entries（CLS 0.0000），靜止 2 秒亦為 0。此數據僅代表本次 Sandbox browser/session，不保證其他裝置表現。

## 明確排除

- 暫不開發會員付費與遊戲功能。
