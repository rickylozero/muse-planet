# 內容匯入 API（Phase 2）

## 端點

```text
POST /api/v1/ingest
Content-Type: application/json
X-API-Key: <與 INGEST_API_KEY 相同的高熵密鑰>
```

請求本文最多 32 KB，接受一筆內容物件：

| 欄位 | 規則 |
| --- | --- |
| `category` | `daily_news`、`edb_official`、`weekly_topic`、`study_skill`、`health_tip`、`parenting_eq` 其一 |
| `title` | 必填純文字，1–200 字元 |
| `summary` | 必填純文字，60–100 個 Unicode 字元 |
| `source_name` | 必填，1–120 字元 |
| `source_url` | 必填且有效的 HTTP/HTTPS 原文連結，不可帶 URL 帳密 |

額外欄位（包括 `status`、`is_visible`、`id`、`created_at`、`expires_at`）會被拒絕。新內容固定以 `status: "draft"` 及 `is_visible: false` 寫入，須經後台審核才會公開。`daily_news` 的 `expires_at` 由 PostgreSQL 自動設為 `created_at` 後 24 小時。

## 回應

成功新增回傳 HTTP `201`，包含記錄 ID、類別、草稿狀態、可見開關與時間欄位。常見錯誤狀態：

- `401`：缺少或錯誤的 API key。
- `400`：JSON 格式錯誤。
- `413`：本文超過 32 KB。
- `415`：非 `application/json`。
- `422`：欄位或摘要長度未通過驗證。
- `502` / `503`：資料庫寫入、連線或伺服器設定問題。

請勿將 API key 放入程式碼倉庫、前端、日誌或對話中；在 GAS 使用 Script Properties，在 Python 使用部署環境的 secret/environment variable。

## Python 範例

```python
import json
import os
import urllib.request

payload = {
    "category": "weekly_topic",
    "title": "API 格式示例：請勿直接匯入",
    "summary": "本段僅作 API 格式示例，沒有提供真實教育消息。實際匯入時請換成已核對來源的純文字摘要，並確保全段長度介於六十至一百字之間。",
    "source_name": "示例來源（請替換）",
    "source_url": "https://example.com/replace-with-original-link",
}

request = urllib.request.Request(
    os.environ["SITE_API_BASE"].rstrip("/") + "/api/v1/ingest",
    data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "X-API-Key": os.environ["INGEST_API_KEY"],
    },
    method="POST",
)

with urllib.request.urlopen(request, timeout=20) as response:
    print(response.status, response.read().decode("utf-8"))
```

## Google Apps Script 範例

先在 Apps Script 的 **Project Settings → Script Properties** 設定 `INGEST_API_KEY`，並替換下方 `SITE_API_BASE`、原文與摘要。摘要應是經人工或可信流程核對的 60–100 字純文字。

```javascript
function ingestContent() {
  const payload = {
    category: "weekly_topic",
    title: "API 格式示例：請勿直接匯入",
    summary: "本段僅作 API 格式示例，沒有提供真實教育消息。實際匯入時請換成已核對來源的純文字摘要，並確保全段長度介於六十至一百字之間。",
    source_name: "示例來源（請替換）",
    source_url: "https://example.com/replace-with-original-link",
  };

  const response = UrlFetchApp.fetch(
    SITE_API_BASE.replace(/\\/$/, "") + "/api/v1/ingest",
    {
      method: "post",
      contentType: "application/json",
      headers: {
        "X-API-Key": PropertiesService.getScriptProperties().getProperty("INGEST_API_KEY"),
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    },
  );

  console.log(response.getResponseCode(), response.getContentText());
}
```

> 以上的 `example.com` 及「示例來源」都是文件範例，不應當作真實新聞或官方資料匯入。
