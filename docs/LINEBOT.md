# LINE BOT 智能問診系統技術文檔

> n8n 工作流 + Google Gemini AI 的自動問診解決方案

## 📋 目錄
- [系統概述](#系統概述)
- [技術架構](#技術架構)
- [n8n 工作流設計](#n8n-工作流設計)
- [AI 分類設計](#ai-分類設計)
- [FAQ 知識庫管理](#faq-知識庫管理)
- [併發控制機制](#併發控制機制)
- [LINE API 整合](#line-api-整合)
- [部署配置](#部署配置)
- [監控與維護](#監控與維護)

## 🎯 系統概述

### 設計目標
解決偏鄉診所醫師無法即時回覆患者 LINE 問診的痛點，透過 AI 自動處理常見問題，將平均回覆時間從 2.5 小時降至 < 1 分鐘。

### 核心特色
- ✅ **語意分類 + 規則控制**：不讓 LLM 自由回答，確保醫療安全
- ✅ **動態 FAQ 知識庫**：醫師可直接編輯 Google Sheets 更新回覆內容
- ✅ **併發控制機制**：自行設計的 Transaction 鎖避免重複回覆
- ✅ **上下文理解**：結合 4 天對話歷史判斷患者意圖
- ✅ **條件式觸發**：特定時間、特定訊息長度才自動回覆

### 系統限制
- ❌ LLM 不生成醫療建議內容，僅分類
- ❌ 只回答醫師預設的 FAQ 範圍
- ⚠️ 超過 30 字的訊息轉交醫師處理
- ⚠️ 4 天內已回覆相同問題不再重複推播

## 🏗️ 技術架構

### 系統流程圖
```
LINE 患者發訊息
  │
  ▼
LINE Webhook 觸發 n8n
  │
  ▼
讀取 Google Sheets FAQ 知識庫
  │
  ▼
Gemini 1.5 Flash 語意分類
  │
  ├─ Output: {category: "失眠", confidence: 85}
  │
  ▼
查詢 MongoDB (4天內對話歷史)
  │
  ├─ 檢查: 已回覆過該 category？
  ├─ 檢查: 訊息長度 ≤ 30 字？
  ├─ 檢查: 是否為改善回報？
  │
  ▼
Transaction 鎖定機制 (避免並發)
  │
  ▼
LINE Reply API 自動回覆
  │
  ▼
儲存對話記錄到 MongoDB
```

### 技術選型

| 技術 | 用途 | 選擇原因 |
|------|------|---------|
| **n8n** | 工作流引擎 | 視覺化流程設計，非技術人員可理解維護 |
| **Google Gemini 1.5 Flash** | LLM 語意分類 | 多語言支援、回應速度快（< 500ms）、成本低 |
| **Google Sheets** | FAQ 知識庫 | 醫師可直接編輯，無需程式碼更新 |
| **MongoDB** | 對話歷史存儲 | Aggregation Pipeline 支援複雜時間窗口查詢 |
| **LINE Messaging API** | 即時通訊 | 患者慣用平台，Webhook + Reply API |

## ⚙️ n8n 工作流設計

### 工作流版本
- **當前版本：** v2.3
- **工作流檔案：** `n8n/linebot ai (completeness).json`
- **總節點數：** 25+ nodes

### 核心節點流程

#### 1. Webhook 接收
```javascript
// Node: LINE Webhook
// 接收 LINE Platform Webhook 事件
{
  events: [{
    type: "message",
    replyToken: "xxx",
    source: { userId: "Uabc123..." },
    message: { 
      type: "text", 
      text: "我最近失眠很嚴重" 
    },
    timestamp: 1707392847123
  }]
}
```

#### 2. Filter Node - 條件過濾
```javascript
// 只在特定條件下自動回覆
if (
  message.length > 30 || 
  !activeDayList.includes(dayOfWeek) ||  // 例：週四～日不自動回覆
  isGroupMessage
) {
  return false;  // 轉交醫師處理
}
```

#### 3. 讀取 FAQ 知識庫
```javascript
// Node: 讀取本地快取或 Google Sheets
// 優先讀取 /home/node/data-sop.json (每小時同步)
const faqData = JSON.parse(
  fs.readFileSync('/home/node/data-sop.json', 'utf8')
);

// FAQ 結構範例
[
  {
    "項目": "失眠",
    "關鍵字": "睡不著,睡眠品質差,多夢,淺眠",
    "回覆": "失眠可能與心腎不交有關，建議..."
  },
  {
    "項目": "拿藥",
    "關鍵字": "拿藥,領藥,複診,藥吃完了",
    "回覆": "下次巡診時間是..."
  }
]
```

#### 4. Gemini AI 分類
```javascript
// Node: Gemini AI Agent
// Prompt 範例
`你是中醫診所的問診助手。請根據以下資訊判斷患者的問診分類：

【患者本次訊息】
${userMessage}

【4天內對話歷史】
${conversationHistory}

【可用的 FAQ 分類】
${faqCategories}  // ["失眠", "咳嗽", "拿藥", "巡診時間", ...]

【回覆格式】
{
  "category": "失眠",  // 必須從FAQ分類中選擇，無法判斷時回傳 null
  "confidence": 85,    // 信心度 0-100
  "reason": "患者提到睡眠品質差"
}

【重要規則】
- 如果患者是回報「改善」或「好轉」，category 必須回傳 null
- 不可自創分類名稱，只能從提供的 FAQ 分類中選擇
- 結合對話歷史理解患者意圖（例如對話中提過失眠，現在說「還是一樣」）
`

// Gemini 回應範例
{
  category: "失眠",
  confidence: 85,
  reason: "患者明確提到睡眠困擾"
}
```

#### 5. MongoDB 對話歷史查詢
```javascript
// Node: MongoDB Aggregation
// 查詢 4 天內的對話與回覆記錄
db.patient.aggregate([
  { $match: { userId: "Uabc123..." } },
  { $unwind: "$messages" },
  { $match: { 
    "messages.timestamp": { 
      $gte: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) 
    }
  }},
  { $sort: { "messages.timestamp": -1 } },
  { $limit: 20 }
])

// 檢查: 4 天內是否已回覆過該 category
const alreadyReplied = repliedCategories.includes(category);
if (alreadyReplied) {
  return "skip";  // 不重複推播
}
```

#### 6. Transaction 鎖定
詳見 [併發控制機制](#併發控制機制) 章節

#### 7. LINE Reply API 回覆
```javascript
// Node: LINE Reply Message
POST https://api.line.me/v2/bot/message/reply
Headers: {
  Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
  Content-Type: 'application/json'
}
Body: {
  replyToken: "xxx",
  messages: [{
    type: "text",
    text: faqData.find(f => f.項目 === category).回覆
  }]
}
```

#### 8. 儲存對話記錄
```javascript
// Node: MongoDB Update
db.patient.updateOne(
  { userId: "Uabc123..." },
  {
    $push: {
      messages: {
        text: userMessage,
        timestamp: new Date(),
        isFromUser: true
      },
      replied: {
        category: "失眠",
        timestamp: new Date(),
        replyText: "失眠可能與..."
      }
    },
    $set: { transactionId: null }  // 釋放鎖
  }
)
```

### Schedule Trigger - FAQ 同步
```javascript
// Node: Schedule Trigger (每小時執行)
// Cron: 0 * * * * (整點執行)

// 從 Google Sheets 讀取最新 FAQ
const faqData = await fetchGoogleSheets({
  spreadsheetId: process.env.GOOGLE_SHEETS_ID,
  range: 'FAQ!A2:C50'
});

// 寫入本地快取
fs.writeFileSync(
  '/home/node/data-sop.json', 
  JSON.stringify(faqData, null, 2)
);
```

## 🤖 AI 分類設計

### 為何不使用傳統 LLM + Memory 架構？

#### 醫療領域的特殊考量
- ❌ **不能讓 LLM 自由回答**：醫療建議錯誤可能造成嚴重後果
- ❌ **不能依賴 LLM 記憶**：對話歷史可能斷裂或理解錯誤
- ✅ **只在特定範圍內自動回覆**：僅回答醫師預設的 FAQ 內容

#### 採用的解決方案：語意分類 + 規則控制

```
患者訊息 
  ↓
AI 語意分類 (Google Gemini)
  ↓ 輸出: {category: "失眠", confidence: 85}
  ↓
規則引擎判斷
  ├─ 字數 ≤ 30 字？
  ├─ 4天內未回覆過該 category？
  ├─ 不是改善回報？
  ↓
取得對應的 FAQ 回覆內容 (從 Google Sheets)
  ↓
自動回覆 or 轉醫師處理
```

### Prompt Engineering 關鍵設計

#### 1. 嚴格限制分類範圍
```javascript
【可用的 FAQ 分類】
${faqCategories}  // 動態從 Google Sheets 讀取

【重要】
- 必須從上述分類中選擇
- 不可自創分類名稱
- 無法判斷時回傳 category: null
```

#### 2. 結合對話歷史上下文
```javascript
【4天內對話歷史】
患者: 我最近失眠很嚴重
醫師: 建議您睡前泡腳、不要滑手機
患者: 好的謝謝
患者: 還是一樣 (當前訊息)

// AI 判斷: category: "失眠" (因為上下文提到失眠)
```

#### 3. 排除「改善回報」
```javascript
// 明確告訴 LLM 排除規則
【排除情境】
- 患者回報「好多了」「改善很多」「睡得很好」
- 這些情況 category 必須回傳 null

// 範例
患者: 吃了藥之後睡眠改善很多
→ category: null (不是新問診，是好轉回報)
```

#### 4. 信心度動態閾值
```javascript
if (confidence < 70) {
  // 信心度低，轉交醫師處理
  return "forward_to_doctor";
}
```

### AI 語意擴展能力

**關鍵字匹配 vs AI 語意理解**

| 患者訊息 | 關鍵字匹配結果 | AI 語意分類 |
|---------|--------------|------------|
| 我最近睡不著 | ✅ 失眠（關鍵字：睡不著） | ✅ 失眠 |
| 晚上睡眠品質很差 | ✅ 失眠（關鍵字：睡眠品質差） | ✅ 失眠 |
| 每天都睡不好 | ❌ 無匹配（沒有"睡不著"） | ✅ 失眠（語意理解） |
| 要領一樣的藥 | ❌ 無匹配（沒有"拿藥"） | ✅ 拿藥（同義詞理解） |
| 藥快吃完了 | ❌ 無匹配 | ✅ 拿藥（意圖理解） |

## 📚 FAQ 知識庫管理

### Google Sheets 結構

**試算表範例：**

| 項目 | 關鍵字 | 回覆 |
|------|--------|------|
| 失眠 | 睡不著,睡眠品質差,多夢,淺眠 | 失眠可能與心腎不交有關，建議您：<br>1. 睡前泡腳20分鐘<br>2. 避免睡前滑手機<br>3. 可服用酸棗仁湯<br>下次巡診可進一步診斷 |
| 咳嗽 | 咳嗽,痰多,喉嚨不適,喉嚨痛 | 咳嗽分為寒咳、熱咳，建議您：<br>1. 多喝溫水<br>2. 避免冰冷食物<br>3. 可服用川貝枇杷膏<br>若持續超過一週請回診 |
| 拿藥 | 拿藥,領藥,複診,藥吃完了 | 下次巡診時間：<br>📅 2/15 (週三) 上午9:00<br>📍 桃園復興鄉衛生室<br>請攜帶健保卡 |

**編輯權限：**
- 醫師可直接編輯試算表
- n8n 每小時自動同步到系統
- 無需重啟服務即可更新

### 本地快取機制

```javascript
// n8n 快取檔案位置
/home/node/data-sop.json

// 讀取策略
1. 優先讀取本地快取 (避免每次 API 請求)
2. Schedule Trigger 每小時同步 Google Sheets
3. 快取失效時 fallback 到 Google Sheets API
```

## 🔒 併發控制機制

### 問題背景：n8n 不支援 MongoDB Transaction

**遇到的問題：**
```
患者短時間內發送多則訊息（例如：3 則間隔 < 5 秒）
  ↓
n8n 並發觸發多個 workflow instance
  ↓
同時讀取 MongoDB → 都判斷「未回覆過」
  ↓
結果：同一個 FAQ 被推播 3 次 ❌
```

### 自行設計的樂觀鎖機制

#### 核心概念：使用 `transactionId` 模擬分散式鎖

```javascript
// Step 1: 嘗試取得鎖（使用訊息 timestamp 作為唯一 ID）
const updateResult = await db.patient.findOneAndUpdate(
  { 
    userId: "Uabc123...", 
    transactionId: null  // 只有沒人持有鎖才能取得
  },
  { 
    $set: { 
      transactionId: 1707392847123,  // 當前訊息 timestamp
      transactionStartTime: new Date()
    }
  },
  { returnDocument: 'before' }  // 回傳更新前的文檔
)

// Step 2: 檢查是否成功取得鎖
if (updateResult.transactionId === null) {
  // ✅ 成功取得鎖，可以處理訊息
  await processMessage();
  
  // Step 3: 處理完畢後釋放鎖
  await db.patient.updateOne(
    { userId: "Uabc123..." },
    { $set: { transactionId: null } }
  );
} else {
  // ❌ 其他請求正在處理，等待後重試
  await sleep(random(500, 2500));  // 隨機等待避免同時重試
  retry();
}
```

#### 設計細節

**1. 超時自動釋放**
```javascript
// 檢查鎖是否超時（超過 30 秒視為異常）
const now = new Date();
const lockAge = now - doc.transactionStartTime;

if (lockAge > 30000) {
  // 超時鎖自動釋放，可以強制取得
  await db.patient.updateOne(
    { userId: "Uabc123..." },
    { $set: { 
      transactionId: currentTimestamp,
      transactionStartTime: now
    }}
  );
}
```

**2. 隨機等待避免 Race Condition**
```javascript
// 0.5 - 2.5 秒隨機延遲
const randomDelay = Math.random() * 2000 + 500;
await sleep(randomDelay);
```

**3. 最多重試 6 次**
```javascript
let retryCount = 0;
const MAX_RETRY = 6;

while (retryCount < MAX_RETRY) {
  const locked = await tryAcquireLock();
  if (locked) break;
  
  retryCount++;
  await sleep(random(500, 2500));
}

if (retryCount >= MAX_RETRY) {
  console.error('無法取得鎖，放棄處理');
}
```

#### 為何不用 MongoDB 原生 Transaction？

- ❌ n8n MongoDB Node 不支援 `session` 參數
- ❌ 若要使用需自寫 Code Node 連接 MongoDB
- ⚠️ 失去視覺化工作流優勢，增加維護成本
- ✅ 樂觀鎖機制已足夠解決併發問題

## 📱 LINE API 整合

### Webhook API - 接收患者訊息

#### LINE Platform 設定
```
Messaging API Settings:
  Webhook URL: https://your-n8n-domain.com/webhook/bot
  Use webhook: ✅ Enabled
  Webhook redelivery: ✅ Enabled (失敗自動重送)
```

#### n8n 接收到的資料結構
```javascript
{
  destination: "Uxxxxxxx",  // Bot 的 User ID
  events: [{
    type: "message",
    message: {
      type: "text",
      id: "xxx",
      text: "我最近失眠很嚴重"
    },
    timestamp: 1707392847123,
    source: {
      type: "user",
      userId: "Uabc123..."
    },
    replyToken: "xxx",  // 用於回覆該訊息（限用一次）
    mode: "active"
  }]
}
```

#### 用途
- 接收患者主動發送的訊息
- 觸發 n8n workflow 進行 AI 分類和自動回覆

### Reply API - 回覆患者訊息

```javascript
// API Endpoint
POST https://api.line.me/v2/bot/message/reply

// Headers
Authorization: Bearer {CHANNEL_ACCESS_TOKEN}
Content-Type: application/json

// Request Body
{
  replyToken: "xxx",  // 從 Webhook 事件取得
  messages: [{
    type: "text",
    text: "失眠可能與心腎不交有關，建議您..."
  }]
}

// 限制
- replyToken 只能使用一次
- 必須在 Webhook 接收後 1 分鐘內回覆
- 一次最多回覆 5 則訊息
```

### Push API - 主動推播訊息

```javascript
// API Endpoint
POST https://api.line.me/v2/bot/message/push

// Headers
Authorization: Bearer {CHANNEL_ACCESS_TOKEN}
Content-Type: application/json

// Request Body
{
  to: "Uabc123...",  // LINE User ID
  messages: [{
    type: "text",
    text: "根據您的症狀，推薦收聽：https://podcast.com/sleep"
  }]
}

// 用途
- Web App 醫師主動推播衛教內容
- 不需要 replyToken
- 可隨時推播
```

### 兩種 API 的差異對照

| 功能 | Webhook + Reply API | Push API |
|------|---------------------|----------|
| **觸發方式** | 患者發訊息觸發 | 系統主動推播 |
| **Token** | 需要 replyToken（一次性） | 直接使用 User ID |
| **時間限制** | 1 分鐘內回覆 | 無限制 |
| **使用場景** | AI 自動回覆 | 衛教內容推播 |
| **費用** | 免費 | 收費（免費額度內可用） |

## 🚀 部署配置

### Zeabur 環境變數

```env
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Google Sheets (FAQ 知識庫)
GOOGLE_SHEETS_ID=1sbZSO2KTBMWKnMMmP9ysx03kfYi6yP_WJ_aati-vW64
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# MongoDB (Zeabur 內部連接)
MONGODB_URI=mongodb://username:password@mongodb:27017/linebot
MONGODB_DB=linebot
```

### n8n 憑證配置

在 n8n Credentials 頁面設定：

1. **LINE Message API** (Bearer Auth)
   - Token: `${LINE_CHANNEL_ACCESS_TOKEN}`

2. **Google Service Account** (OAuth2)
   - Service Account Email: xxx@xxx.iam.gserviceaccount.com
   - Private Key: 從 JSON 檔案複製

3. **Google Gemini API** (Header Auth)
   - Name: `x-goog-api-key`
   - Value: `${GEMINI_API_KEY}`

4. **MongoDB** (MongoDB Connection)
   - Connection String: `${MONGODB_URI}`
   - Database: `${MONGODB_DB}`

### 匯入工作流

```bash
# 1. 登入 n8n
# 2. 進入 Workflows → Import from File
# 3. 選擇 n8n/linebot ai (completeness).json
# 4. 更新所有憑證配置
# 5. Activate Workflow
```

## 📊 監控與維護

### n8n 執行記錄

查看方式：
1. n8n Dashboard → Executions
2. 篩選條件：
   - Status: Success / Error / Running
   - Time Range: Last 24 hours

### 常見錯誤排查

#### 1. Gemini API 錯誤
```
Error: 429 Too Many Requests
解決：檢查 API 配額，升級方案或增加 rate limit 延遲
```

#### 2. MongoDB 連接失敗
```
Error: MongoServerError: Authentication failed
解決：檢查 MONGODB_URI 連接字串是否正確
```

#### 3. LINE Reply Token 過期
```
Error: Invalid reply token
解決：Reply Token 必須在 1 分鐘內使用，檢查工作流執行時間
```

#### 4. Transaction 鎖超時
```
Warning: Lock timeout after 30 seconds
解決：檢查 MongoDB 更新操作是否異常，手動釋放鎖
```

### 效能監控指標

| 指標 | 目標值 | 監控方式 |
|------|--------|---------|
| Gemini API 回應時間 | < 500ms | n8n Execution Time |
| MongoDB 查詢時間 | < 100ms | n8n Execution Time |
| 端到端回覆時間 | < 3 秒 | LINE Webhook 到 Reply 完成 |
| Transaction 鎖取得成功率 | > 95% | 計算重試次數 |

### 定期維護任務

- [ ] **每週**：檢查 n8n 執行錯誤記錄
- [ ] **每月**：檢查 Gemini API 使用量與費用
- [ ] **每月**：清理 MongoDB 90 天前的對話記錄
- [ ] **每季**：更新 FAQ 知識庫內容
- [ ] **每季**：檢視 AI 分類準確率（人工抽樣）

## 🔮 未來優化方向

### AI 能力提升

- [ ] **Fine-tuning 專屬模型**
  - 使用累積的對話數據 Fine-tune Gemini
  - 提升中醫術語的理解能力

- [ ] **多輪對話支援**
  - 當前設計為單輪問答
  - 未來可支援「追問」式對話

- [ ] **RAG 整合**（條件式）
  - 前提：開放更多自動回覆範圍
  - 建立中醫知識庫向量資料庫

### 系統功能擴展

- [ ] **多語言支援**
  - 客家語、原住民語言（偏鄉需求）
  - Gemini 多語言能力已支援

- [ ] **語音訊息處理**
  - 整合 Speech-to-Text API
  - 高齡患者友善設計

- [ ] **圖片辨識**
  - 舌診照片分析
  - 處方籤 OCR 識別

## 📞 相關資源

- [專案總覽](../README.md)
- [Web App 技術文檔](./WEB_APP.md)
- [API 參考文檔](./API.md)
- [部署指南](./DEPLOYMENT.md)
- [作品集展示](./PORTFOLIO.md)

---

**維護者：** susan8213  
**最後更新：** 2026/02/08
