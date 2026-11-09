# 沐智星球親子平台 (Muse Planet)

面向香港家長的來源透明教育資訊平台。網站以 Next.js App Router、React、TypeScript、Tailwind CSS v4 與 Lucide React 建置，資料由 Supabase PostgreSQL 提供，天氣資料來自香港天文台 Open Data。

> **交付狀態：** Phase 1–4 的產品功能已實作；Phase 5 本文件與原始碼封裝完成後可供部署。正式 production 網域與 Vercel 部署尚未設定。本專案目前的 canonical Git repository 是 Manus-managed repository，**不是 GitHub repository**，因此目前沒有可提供的 GitHub URL。任何 GitHub repository connection 都需由專案擁有人另行授權。

## 功能與階段成果

- **Phase 1 — 網站基礎：** Next.js App Router、TypeScript、Tailwind CSS v4 與響應式版面；設計色票為深林綠 `#2D5A27`、清透底色 `#F4F9F9`、銅金 `#B87333` 與深灰文字 `#1E293B`。
- **Phase 2 — 資料與匯入：** Supabase `contents` schema、RLS、每日新聞 24 小時到期 trigger，以及需 `X-API-Key` 的 `POST /api/v1/ingest`。外部匯入固定以隱藏草稿開始。
- **Phase 3 — 公開資訊：** 香港天文台天氣 proxy、每日教育快訊、教育局專區及主題卡片；內容需符合發佈、可見度與有效期條件，卡片顯示來源和原文連結。
- **Phase 4 — Muse Planet 品牌與 CMS：** 網站品牌、SEO/PWA、Manus OAuth 管理員登入、分類/狀態篩選、可見度切換，以及教育局草稿審批。CMS 驗證登入者 email allowlist、origin allowlist、OAuth nonce 與同源 mutation。
- **效能與無障礙：** Preview 使用 production build (`next start`) 進行檢查；天氣不在瀏覽器背景輪詢；頁面捲動沒有 JS scroll handler；卡片使用 offscreen content visibility；SVG 插畫有明確 intrinsic 尺寸。

目前連接的開發 Supabase 專案曾建立 8 筆以 `MUSE-QA-20261011-` 開頭的**合成測試資料**。它們不在 Git repository 或本 ZIP 中。正式上線應使用全新的 production Supabase 專案，不要把開發測試資料直接當正式內容；測試資料清理仍需由資料擁有人決定並執行。

## 目錄與主要檔案

```text
muse-planet/
├── src/
│   ├── app/
│   │   ├── page.tsx                              公開首頁
│   │   ├── layout.tsx                            全站 metadata、語系與外框
│   │   ├── globals.css                           Tailwind v4 tokens 與前台/CMS 樣式
│   │   ├── admin/
│   │   │   ├── page.tsx                          管理台頁面
│   │   │   ├── layout.tsx                        管理台保護/版面
│   │   │   └── login/page.tsx                     Manus OAuth 登入頁
│   │   ├── api/
│   │   │   ├── auth/{start,callback,logout}/route.ts  OAuth、session 與登出
│   │   │   └── v1/
│   │   │       ├── ingest/route.ts                API Key 保護的內容匯入
│   │   │       ├── weather/route.ts               香港天文台 proxy
│   │   │       └── admin/contents/                CMS 清單與單筆 mutation API
│   │   ├── manifest.ts                            PWA manifest
│   │   ├── sitemap.ts / robots.ts                 SEO crawler routes
│   │   └── icon.svg                                SVG app icon
│   ├── components/
│   │   ├── admin-contents-manager.tsx              CMS 篩選、審批與可見度 UI
│   │   ├── admin-login-button.tsx                 Manus OAuth 按鈕
│   │   ├── content-card.tsx                       新聞/公告卡片
│   │   ├── planet-illustration.tsx                純 SVG 星球插畫
│   │   ├── site-header.tsx                        品牌導覽與天氣元件
│   │   └── weather-widget.tsx                     天氣顯示與可見頁籤更新
│   └── lib/
│       ├── auth/                                   Manus OAuth 與 HS256 session
│       ├── supabase/admin.ts                       server-only Supabase client
│       ├── content.ts                              公開內容篩選
│       ├── site-url.ts                             正式 canonical origin 驗證
│       └── weather.ts                              HKO 資料取得與正規化
├── supabase/migrations/                            PostgreSQL schema、trigger、RLS
├── public/                                          SVG 品牌素材與 route manifest
├── docs/                                            Ingest、HKO、Supabase、SEO 筆記
├── .env.example                                     環境變數名稱範本，沒有密鑰
├── package.json / pnpm-lock.yaml                   Scripts、相依套件與 lockfile
├── next.config.ts / tsconfig.json                  Next.js 與 TypeScript 設定
└── tailwind.config.ts / postcss.config.mjs          色票參考與 Tailwind CSS v4 pipeline
```

**沒有 scraper 腳本。** 專案提供已驗證的 ingest endpoint 和 Python/GAS 範例（`docs/ingest-api.md`）；實際資料抓取、來源授權與摘要產製流程尚未納入程式庫，也不會自動抓取新聞。

## 環境變數備忘錄

先複製 `.env.example` 為本機 `.env.local`。**不要把實際值提交到 Git、ZIP、前端 bundle、issue 或日誌。** 除 `NEXT_PUBLIC_SITE_URL` 外，其餘應視為 server-only 設定。變數名稱以程式實際引用為準：

| 變數 | 建議值 / 用途 | 部署注意事項 |
| --- | --- | --- |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase Project URL；HTTPS。程式亦接受標準 `/rest/v1` 結尾，但建議使用根 URL。 |
| `SUPABASE_SECRET_KEY` | Supabase `sb_secret_...` secret key | 高權限，只能在伺服器使用；會繞過 RLS。優先新式 secret key，不建議新部署再採用舊 `service_role` key。絕不可加 `NEXT_PUBLIC_`。 |
| `INGEST_API_KEY` | 高熵隨機字串，至少 32 UTF-8 bytes；可用 `openssl rand -hex 32` 產生 | 與 Supabase key 分開保存。Python/GAS 呼叫端以 `X-API-Key` 傳送；輪替時同步更新所有呼叫端。 |
| `CMS_ADMIN_EMAILS` | `admin@example.com`；多位以逗號、分號或換行分隔 | 只放經授權 CMS 管理員；比對時忽略大小寫與外圍空白。server-only。 |
| `CMS_ALLOWED_ORIGINS` | `https://www.example.hk` | 僅填 exact origin，可逗號/分號分隔；不含路徑、query、fragment 或結尾 `/`。Production 只放正式站 origin；不支援 wildcard。 |
| `NEXT_PUBLIC_SITE_URL` | `https://www.example.hk` | 正式 HTTPS canonical origin，不含路徑或結尾 `/`。設定後重新建置部署；決定 canonical、OG、sitemap 與 robots 索引策略。 |
| `MANUS_PROJECT_ID` | 由 Manus/WebDev 專案環境提供的 application/project ID | Manus OAuth 與 session 會使用。不得自行猜值。Vercel 不會自動注入。 |
| `MANUS_JWT_SECRET` | 由 Manus/WebDev 安全提供的 signing secret | 用於驗證管理員 session；只作 server secret。不得複製到公開文件、聊天或 source control。Vercel 不會自動注入。 |
| `MANUS_OAUTH_API_URL` | Manus 提供的 HTTPS OAuth API base URL | 程式會在 base 後組合 Manus WebDev OAuth API path。不得填猜測網址；Vercel 端是否可用須由 OAuth 服務明確支援。 |
| `MANUS_OAUTH_PORTAL_URL` | Manus 提供的 HTTPS OAuth portal base URL | 程式會附加 `/app-auth`。OAuth provider 也必須接受正式網站 callback URL。Vercel 不會自動注入。 |

`PORT`、`NODE_ENV` 等由 Next.js/Vercel runtime 管理，不是本應用的自訂 secret。Supabase CLI 可能在 `supabase link` 時互動式詢問資料庫密碼；此值不是 Next.js runtime 變數，不要寫入 `.env.example` 或 Vercel app env，除非另有受控 CI 流程需要。

### Manus OAuth 與 Vercel 的重要相容性限制

目前登入依賴 Manus/WebDev 注入的 `MANUS_*` 變數及 Manus OAuth API/portal。這些設定不會因把程式碼放到 Vercel 就自動移轉。只有在 Manus 提供受支援的 Vercel 設定/redirect 註冊方式，並且正式 callback `https://<production-domain>/api/auth/callback` 能完成驗證後，才可在 Vercel 啟用 CMS。若拿不到這些官方設定，網站前台和 Supabase API 可另外評估部署，但 CMS 登入不會正常工作；不要自行複製或猜測平台 secret，也不要以假管理員旁路取代 OAuth。

## 本機安裝與檢查

需求：Node.js 22（或符合目前 Next.js 版本支援範圍）、Corepack、pnpm 11.25.0。環境變數若尚未設定，Supabase 資料功能會回傳未設定/空狀態，OAuth/CMS 也會 fail closed。

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
# 編輯 .env.local，使用你自己的本機/測試 Supabase 值
pnpm dev
```

本機開發網址為 `http://localhost:3000`。要驗證 production build 與 `next start`：

```bash
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm build
pnpm start
```

`pnpm start` 綁定 `0.0.0.0`，預設使用 `PORT` 或 3000。專案目前沒有獨立的 automated unit/e2e test script；以上 lint、TypeScript 與 production build 是可執行的程式檢查，不等同完整瀏覽器/安全稽核。

## 連接正式 Supabase

1. 在 Supabase 建立**新的 production 專案**，確認區域、備份與資料保留設定。不要直接將現有開發/QA 專案當正式資料庫；其中目前留有以 `MUSE-QA-20261011-` 開頭的合成測試列。
2. 安裝 Supabase CLI，登入並連結到新 project。CLI token/DB password 不要寫入 repo：

   ```bash
   npx supabase@latest login
   npx supabase@latest link --project-ref <PRODUCTION_PROJECT_REF>
   npx supabase@latest migration list
   ```

3. 若遠端是全新、空白資料庫，先確認 migration 清單與備份，再套用 repository 內 migrations：

   ```bash
   npx supabase@latest db push
   ```

   第一個 migration 是空白佔位，第二個建立 enums、`public.contents`、24 小時到期 trigger、RLS grants 和公開讀取 policy。沒有 `seed.sql`，不要使用 `--include-seed`。若目標資料庫已存在 `contents` 或曾用 Dashboard 手動套 schema，**先比對 migration history 與實際 schema，勿直接 `db push`**；先備份並按 Supabase 官方 migration reconciliation 流程整理，避免重複建立或資料變更。

4. 在 Supabase Project Settings/API Keys 取得 Project URL 與新式 secret key，僅放入 Vercel Production 的 server-side environment。此 key 可略過 RLS，因此應使用全新 production project、限制 Vercel 專案成員權限，並定期輪替。schema 仍為 `anon`/`authenticated` 啟用 RLS；網站 server query 亦須保留 status、visibility、expiry 條件。
5. 在 Vercel 配置以下 Production variables：`SUPABASE_URL`、`SUPABASE_SECRET_KEY`、`INGEST_API_KEY`、`CMS_ADMIN_EMAILS`、`CMS_ALLOWED_ORIGINS`、`NEXT_PUBLIC_SITE_URL`。若要啟用 CMS，另外需先解決上節所述 Manus OAuth portability，確認後才配置 `MANUS_*`。Production 與 Preview 使用不同 Supabase project/key，避免 Preview 存取正式內容。
6. 部署後驗證資料表/RLS、首頁空狀態、HKO endpoint、ingest 的 401 與合法寫入、OAuth callback 和管理員 allowlist。先用測試環境驗證，不要在 production 以真實新聞測試未審核匯入。

## 部署到 Vercel

### 目前 repository 狀態

此工作目錄的 canonical remote 是 Manus-managed repository，並非 GitHub。因此無法提供現有 GitHub URL，也不能聲稱 Vercel 已連接此專案。若需要 Git 自動部署，需先由擁有人使用正式的 GitHub connection/transfer 流程建立並授權 private repository；不要把 Manus-managed remote URL 當作 GitHub URL。若暫不連 GitHub，可從本 ZIP 解壓後用 Vercel CLI 建立 Vercel 專案。

### 使用 Vercel CLI 從 ZIP 部署

1. 解壓 source ZIP，在專案根目錄安裝鎖定依賴：

   ```bash
   unzip muse-planet-source.zip
   cd muse-planet
   corepack enable
   pnpm install --frozen-lockfile
   ```

2. 登入 Vercel 並連結/建立專案：

   ```bash
   pnpm dlx vercel login
   pnpm dlx vercel link
   ```

3. 在 Vercel Project Settings → Environment Variables 設定上述值，將 secrets 限定於 Production；若要用 Preview，另建 staging Supabase 與不同 keys。先不要為任意 ephemeral `*.vercel.app` host 開啟 CMS allowlist。
4. 先執行 `pnpm dlx vercel` 建立 Preview deployment，檢查 logs 和功能。確認資料來源、domain、OAuth provider redirect 支援及所有 env 後，再由專案擁有人執行 `pnpm dlx vercel --prod`。
5. Vercel 可自動偵測 Next.js；專案根目錄為 `.`、build command 為 `pnpm build`。Vercel 會執行 Next.js server routes，無需在 Vercel 專案設定 `next start` command。自訂網域啟用後，將 Production 的 `NEXT_PUBLIC_SITE_URL` 與 `CMS_ALLOWED_ORIGINS` 設為同一個 exact HTTPS origin，然後重新部署。
6. 如要 Git push 自動產生 Preview/Production deployments，先完成 GitHub repository connection，再於 Vercel 的 Git settings 指定 production branch（通常 `main`）。目前本專案沒有已連接的 GitHub repository。

### 安全清理：Preview bypass 與 production origin

**本專案從未實作 Preview/dev 管理員登入 bypass。** 原先曾討論新增的一鍵假登入按鈕與 API endpoint，沒有加入程式碼；不需要移除假帳號或 bypass secret。`next.config.ts` 的 dev-only loopback HMR allowlist 是 Next.js 開發更新設定，不提供身份驗證，也不是登入旁路。

上線前仍需設定真正的 production 隔離：Production `CMS_ALLOWED_ORIGINS` 只列正式 domain 的 HTTPS origin，不含 Preview、localhost、路徑或 wildcard；Production `CMS_ADMIN_EMAILS` 只列實際管理員；Preview/Development 使用獨立變數與 staging Supabase，或完全不設定管理員 allowlist 使登入拒絕。檢查 Vercel Environment Variables 的每個 scope，移除不需要的 Preview origin/key；更換任何曾暴露或沿用的 API key。不要將 `SUPABASE_SECRET_KEY`、`MANUS_JWT_SECRET` 或 `INGEST_API_KEY` 加上 `NEXT_PUBLIC_`。

**不能承諾任何系統「100% 安全」。** 以上是目前程式和部署可採用的隔離措施；Vercel 上的 Manus OAuth 支援、redirect URI 登記及其 session secret portability 尚未驗證，未完成前不可宣稱 CMS 已在 Vercel 正式可用。

## 上線與維護檢查

- 正式網域、DNS/TLS 與 `NEXT_PUBLIC_SITE_URL` 一致；確認 sitemap、robots 與 Open Graph 產生正確 canonical，並在確認正式公開後才開放索引。
- Production Supabase 為獨立專案；RLS、migration history、備份與服務金鑰 scope 已複核。
- Manus OAuth 在新 host 完成 callback；管理員 email allowlist 和 origin allowlist 最小化。無 bypass route、mock user 或測試 session。
- Ingest API key 隨機且專用，呼叫端秘密獨立保存；所有外來內容先為 `draft`、隱藏，管理員審核後才能刊載。
- HKO 為即時外部資料來源；遇 API 失敗顯示服務狀態，不建立假天氣或新聞。
- 開發/Preview QA 合成內容與 production 正式內容分離。不要把 QA DB 的 `MUSE-QA-20261011-` 記錄當作真實教育資訊。
- 日常修改透過版本化 SQL migrations；先在 staging apply/check，再由授權人員推 production。定期更新 Next.js、React、Supabase client 及依賴，檢查 Vercel/Supabase runtime logs，但不得記錄密鑰或 OAuth tokens。

## 官方部署與維護文件

- [Vercel：Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel：Git deployments](https://vercel.com/docs/deployments/git)
- [Vercel：Environment Variables](https://vercel.com/docs/environment-variables)
- [Supabase：Use Supabase with Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase：API keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase：Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase CLI：`supabase link`](https://supabase.com/docs/reference/cli/supabase-link)
- [專案 Ingest API 契約](docs/ingest-api.md)
- [專案 Supabase 整合筆記](docs/supabase-integration-notes.md)
