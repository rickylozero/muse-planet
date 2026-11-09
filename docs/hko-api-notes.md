# 香港天文台 API 整合備註（Phase 3）

最後核對：2026-10-09（香港時間）。

## 已核實端點與欄位

香港天文台官方文件將 `https://data.weather.gov.hk/weatherAPI/opendata/weather.php` 定義為天氣資訊 API，使用 GET、回傳 JSON；`dataType` 可選 `rhrread`（Current Weather Report）及 `warnsum`（Weather Warning Summary），`lang=tc` 代表繁體中文。[1]

- 即時觀測：`?dataType=rhrread&lang=tc`。`temperature.data` 是測站陣列，項目含 `place`、`value`、`unit`，並由 `temperature.recordTime` 提供觀測時間；`humidity.data` 同樣是測站陣列，項目含 `place`、`value`、`unit`；`icon` 和 `iconUpdateTime` 提供天氣圖示代碼與更新時間。介面以「香港天文台」測站的溫度與濕度作為顯示值，並明示該測站，缺測時不假造數字。
- 生效警告：`?dataType=warnsum&lang=tc`。回應為以警告識別碼為 key 的 JSON object；警告包含繁體中文 `name`、`code`、可能存在的 `type`、`actionCode` 及時間欄位。文件列出 `ISSUE`、`REISSUE`、`CANCEL`、`EXTEND`、`UPDATE` 等 action code。UI 只展示目前有效項目；空 object 表示本次查詢沒有回傳生效警告，不可把暫時無法連線誤報成「沒有警告」。[1]
- 官方資料總覽將 Current Weather Report 標為每小時及有更新時發布；Weather Warning Summary 為有更新時發布。前端採低頻重整並由伺服器快取，避免每次瀏覽都重複抓取。[2]
- 香港政府資料一站通亦列出香港天文台 Weather Warning Information dataset，以及繁體中文 API 資源，可作來源交叉參考；本階段使用官方 HKO `warnsum` 摘要 API。[3]

## 整合原則

使用香港天文台官方端點且設定 `lang=tc`；只在伺服器端呼叫，透過同源 Next.js Route Handler 正規化傳給前端。`rhrread` 為必要資料；若警告端點失敗，保留溫濕度並清楚顯示警告資料暫不可用，不能以空清單掩蓋錯誤。天氣區需標示「香港天文台」來源與 HKO 更新時間。若 API 回傳欄位暫缺，提供明確未能取得的狀態，不放入假數值。值會隨天文台更新，不可將本文件中的即時樣本硬編碼。

## 參考來源

[1] 香港天文台，《Hong Kong Observatory Open Data API Documentation》，Version 1.12（Nov 2024）。<https://www.hko.gov.hk/en/weatherAPI/doc/files/HKO_Open_Data_API_Documentation.pdf>

[2] 香港天文台，Hong Kong Observatory Open Data，資料集與更新頻率。<https://www.hko.gov.hk/en/abouthko/opendata_intro.htm>

[3] data.gov.hk，Weather warning information。<https://data.gov.hk/en-data/dataset/hk-hko-rss-weather-warning-information>
