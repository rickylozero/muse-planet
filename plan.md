# 沐智星球親子平台 (Muse Planet) — 實作計畫

## 產品範圍與階段界線

此平台為香港家長整理來源透明的親子教育資訊。Phase 1–4 的產品功能與 CMS 核心已在 Manus Preview 實作及使用者測試；Phase 5 完成環境備忘錄、部署手冊與原始碼歸檔。正式 production 網域、Vercel 部署及 Manus OAuth 在 Vercel 的 portability 尚未設定或驗證。會員付費及遊戲功能不在本階段範圍內。

## 技術與安全設計

- **前端：** Next.js App Router、React、TypeScript、Tailwind CSS v4、Lucide React。Tailwind v4 的 CSS `@theme` 是實際生效的設計 token 來源；根目錄另提供與之相符的 `tailwind.config.ts` 色票參考。這不是可由 v4 自動載入的舊式設定檔。
- **資料庫：** Supabase PostgreSQL `contents` 已建立並啟用 RLS。使用 Supabase server-only client 存取；管理與前台查詢都會明確檢查發佈狀態、可見度與到期時間，不能依賴 service key 的 RLS 行為。
- **天氣：** 香港天文台 Open Data `rhrread` 和 `warnsum` 均採 `lang=tc`。伺服器端 `/api/v1/weather` 正規化溫度、濕度與生效警告，底層 HKO fetch revalidate 300 秒；前端天氣卡初次載入時更新，僅在使用者切回可見頁籤且距上次嘗試至少 15 分鐘時再刷新；無 interval/timeout 輪詢，滾動不觸發天氣 fetch。
- **OAuth 與 CMS：** 採 Manus OAuth。管理員需同時符合 `CMS_ADMIN_EMAILS` 身份清單與 `CMS_ALLOWED_ORIGINS` 確切 origin allowlist；state 的 `redirectUri` 必須屬於 allowlist，callback 需符合 host-only nonce cookie 後才交換 code。不信任請求者單獨提供的 Origin；Preview 代理會改寫 `Origin` 並省略 `Referer`，因此起始與 mutation 請求只在候選 origin 已 allowlist、且 `Sec-Fetch-Site: same-origin`（有 `Referer` 時亦須與候選 origin 相符）時採用 fallback；明確拒絕 `cross-site`/`same-site` metadata。登出也需有效 session 與同源驗證。session 使用平台相容的 `webdev_app_session`，以 `MANUS_JWT_SECRET` 驗證 HS256、`appId` 及期限，並使用 `SameSite=None; Secure` 配合 HTTPS Preview。管理 API 只能在伺服器端操作 Supabase。沒有建立或使用假身份/Preview 登入旁路。
- **服務邊界：** 使用者於 2026-10-10 明確批准啟用 WebDev server feature，限 `server=true`、`database=false` 且不發布。啟用屬不可逆設定；不得擴大到內建 database 或 production publish。Cloud Preview 必須保留真實 Manus OAuth 與有效 session；不可建立假身份、測試 session 或以 `NODE_ENV`／hostname 條件繞過登入，即使 endpoint 同時檢查 `CMS_ADMIN_EMAILS` 也不例外。
- **效能與重新導向：** 不新增 middleware；未登入時 `/admin` 僅一次回 307 `/admin/login`，login 回 200，admin API 回 401，沒有持續 redirect loop 證據。Next dev 僅在 dev 設定精確 loopback `allowedDevOrigins: ["127.0.0.1"]`。Preview 使用 `pnpm build` 後以 `next start --hostname 0.0.0.0` 在 port 3000 服務；這不等於正式發布。前台避免 JavaScript scroll listener、平滑捲動動畫、持續視差/裝飾動畫；文章卡片與 CMS 文字預覽使用 `content-visibility:auto`/intrinsic size；無 raster 圖片，hero SVG 有固定 intrinsic dimensions；不廣泛套用 `will-change`。天氣只在初次載入/可見頁籤回復且資料過期時請求，無 client timer。Preview 原生上下捲動觀測 18 次 scroll event、0 Fetch/XHR、CLS 0；前次 scripted RAF 測試約 58.1 FPS/p95 16.9ms。數據只代表當次 Sandbox browser/session。
- **部署邊界：** 本專案 current canonical repository 為 Manus-managed repository，沒有已連接 GitHub URL；不要把平台 Git remote 當成 GitHub。Vercel 可承載 Next.js，但 Manus 專屬 `MANUS_*` OAuth/session 變數不會自動移植，正式 callback 與 secret provisioning 尚未驗證；在取得官方支援前不得宣稱 CMS 可於 Vercel 使用。正式部署應使用獨立 production Supabase 專案，避免承接含 QA 合成資料的開發資料庫。
- **SEO：** 根 layout 使用明確品牌 metadata。canonical origin 只取自明確設定的 `NEXT_PUBLIC_SITE_URL`；未提供正式網域時，不猜測 Preview URL，不把 Preview 放入 sitemap，robots 禁止索引未設定 canonical 的站點。管理介面與 API 不放入 sitemap。

## 預定專案結構

```text
src/
  app/
    layout.tsx                          品牌 metadata、文件語系與共用外框
    page.tsx                            公開教育資訊首頁及 HTML5 分區
    globals.css                         Tailwind v4 @theme、前台與 CMS 共用設計 tokens
    sitemap.ts / robots.ts              僅使用明確正式網域的 SEO 路由
    admin/page.tsx                      Phase 4：受管理員授權保護的內容清單
  admin/login/page.tsx                Manus OAuth 登入介面
    api/auth/callback/route.ts          Phase 4：驗證 OAuth state 並建立相容 session
  api/v1/admin/contents/route.ts       受保護的 CMS 內容清單
  api/v1/admin/contents/[id]/route.ts 單筆可見度／核准操作
    api/v1/ingest/route.ts              Phase 2：API Key 保護的外部內容匯入
    api/v1/weather/route.ts             Phase 3：香港天文台伺服器端 proxy
  components/
    site-header.tsx                     品牌字標、Lucide Orbit 與 CSS 星環
    weather-widget.tsx                  即時溫度、濕度與天氣警告
    content-card.tsx                    來源透明的文章卡片
    planet-illustration.tsx             首頁與登入共用的純 SVG 星球插畫
    admin-contents-manager.tsx          分類/狀態篩選與審核操作
  lib/
    auth/                               Manus OAuth、session、管理員授權
      manus-oauth.ts                    OAuth URL/code exchange/identity
      session.ts                        allowlist、同源檢查與 HS256 session
    supabase/admin.ts                   server-only Supabase client
    content.ts                          公開內容查詢與有效期過濾
    weather.ts                          HKO API 呼叫及資料正規化
supabase/migrations/                    PostgreSQL enums、contents、trigger 與 RLS
public/
  brand-mark.svg                        純向量星球與金屬銅金星環圖示
  manus-routes.json                     實際頁面路由宣告（不含 API/SEO/system routes）
```

## 品牌與介面系統

- **Design Movement：** 友善的宇宙童趣編輯風——以 3D 感環行星、雲朵與小星體，融合森林綠和清透水色，令親子教育資訊圖像化、活潑但仍可靠。
- **Core Principles：** 以插畫和圖示快速建立視覺層次；卡片分組、badge 承載日期/來源等次要資料；內文保持易讀留白；CMS 與前台共用一致的色彩及互動語彙。
- **Color Philosophy：** Primary 幽林深碧 `#2D5A27` 用於主導覽與醒目標題；Background 清透泉水 `#F4F9F9` 作長文底色，`#E0F2FE` 作水色輔助面板；Accent 純金屬銅金 `#B87333` 用於重點按鈕、警告標籤與星環；正文深灰木 `#1E293B` 確保對比和閱讀性。
- **Layout Paradigm：** 深綠主導覽固定品牌重心；手機用原生可鍵盤操作的 disclosure menu 保留所有頁內導覽與內容管理入口。首頁採左側短文案、右側大型 SVG 星球主視覺，再以天氣資訊卡、快訊卡、教育局卡與主題卡片分段向下閱讀；登入頁桌面採左插畫右登入卡、手機改為插畫在上。
- **Signature Elements：** Lucide `Orbit` 搭配自製 SVG 漸層星球、斜向銅金星環與小衛星；雲朵、星星微裝飾和綠/金/藍 pill badge；資訊卡統一採圓角、微陰影及清楚 hover 深度。
- **Interaction Philosophy：** 功能、分類、天氣、日期、來源均以 Lucide 圖示輔助辨識；清晰動詞、鍵盤焦點、載入／成功／錯誤／空狀態；卡片 hover 輕微放大及加深陰影，外部資訊一律標示來源。
- **Animation：** 互動僅保留短時、低幅度按鈕/卡片過渡；為降低長頁渲染負擔，主視覺星球為靜態 SVG，不播放持續漂移/閃爍動畫；遵循 `prefers-reduced-motion`。
- **Typography System：** 標題採本機 `ui-rounded`/system-ui rounded sans-serif fallback，保留 Noto Sans TC/PingFang TC 中文字體；標題和卡片標題更大、字距舒展；內文行高放寬、文字用柔和 slate 色，不載入外部字型服務。
- **Brand Essence：** 「讓香港家長在資訊星海裡，找到值得信任的成長方向。」個性：清明、可靠、溫暖。
- **Brand Voice：** 標題簡潔有方向，CTA 說明實際下一步，避免讓家長焦慮。例：「一起找到孩子此刻需要的答案。」、「每一則資訊，都看得見它從哪裡來。」
- **Wordmark & Logo：** 中文字標「沐智星球親子平台」，輔以英文 Muse Planet；Lucide Orbit 為深碧圖示主體，CSS 增添傾斜銅金星環與三枚金屬光澤小星體，不要求使用者上傳圖片。
- **Signature Brand Color：** 幽林深碧 `#2D5A27`；星環及少量互動重點使用銅金 `#B87333`。

## 階段成果與驗收範圍

1. **Phase 1 — 已完成：** 建立 Next.js App Router、React、Tailwind CSS、Lucide React、繁體中文首頁、Responsive 基礎版面與初始大地色設計 tokens。
2. **Phase 2 — 已完成：** Supabase PostgreSQL `contents` 包含 `id UUID`、六類 `category`、`title`、60–100 字 `summary`、`source_name`、`source_url`、三種 `status`、`is_visible`、`created_at`、可空 `expires_at`；每日快訊由資料庫 trigger 強制於建立後 24 小時到期。啟用 RLS，公開只能讀取已發布、可見且未過期資料。`POST /api/v1/ingest` 需 `X-API-Key`，外部 Python/GAS 可匯入結構化摘要；匯入結果固定為 draft 且隱藏。Preview 寫入及錯誤權限回應已驗證，production 尚未發布。
3. **Phase 3 — 已完成：** 香港天文台 `rhrread`/`warnsum` 顯示溫度、濕度、生效警告和更新時間。首頁只顯示有效可見的最新 1–2 則 `daily_news`；卡片附來源名稱和原文外鏈。教育局專區只顯示已核准且可見的 `edb_official`。主題卡為升學遊學、學習技巧、健康 Tips；無資料時明確呈現空狀態，不編造文章。
4. **Phase 4 — 品牌與 CMS 已交付：** 全站 Muse Planet 品牌、指定色票、Lucide/CSS/SVG 視覺、metadata、PWA、HTML5 語意、sitemap/robots 已完成。CMS 使用 Manus OAuth、email/origin allowlist、nonce/state 與 session；已在 Preview 完成登入，驗證分類/狀態搜尋、`is_visible` 寫入及 EDB 草稿審批。Production domain 和 deployment 尚未設定。未建立 Preview bypass；天氣更新限初次載入及可見頁籤上次更新超過 15 分鐘後，Next dev HMR allowlist 僅為 loopback。
5. **Phase 5 — 文件與原始碼交付：** README 包含環境變數、目錄結構、Supabase migration、Vercel 部署及安全限制；`.env.example` 只列空白變數名稱，原始碼 ZIP 不包含 `.git`、`node_modules`、`.next` 或真實 `.env`。目前 Git provider 是 Manus-managed，而非 GitHub。

## 官方技術參考

Tailwind v4 採 CSS-first design tokens；`tailwind.config.ts` 不假裝為自動載入的 v4 主設定。SEO 絕對網址僅能由 `NEXT_PUBLIC_SITE_URL` 提供。

- [Tailwind CSS functions/directives](https://tailwindcss.com/docs/functions-and-directives)
- [Tailwind CSS theme variables](https://tailwindcss.com/docs/theme)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js sitemap metadata file](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js robots metadata file](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- Manus OAuth 與 Preview cookie 依 WebDev Authentication skill 規範實作。
