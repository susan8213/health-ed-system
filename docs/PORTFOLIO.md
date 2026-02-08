# 偏鄉智慧診療支援系統
> AI問診與衛教整合解決方案

> 📌 **返回專案首頁：** [README.md](../README.md)  
> 📌 **技術文檔：** [Web App](./WEB_APP.md) | [LINE BOT](./LINEBOT.md) | [API 參考](./API.md) | [部署指南](./DEPLOYMENT.md)

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)
[![n8n](https://img.shields.io/badge/n8n-automation-orange)](https://n8n.io/)

## 📋 目錄
- [專案背景](#專案背景)
- [問題與挑戰](#問題與挑戰)
- [解決方案](#解決方案)
- [技術架構](#技術架構)
- [功能展示](#功能展示)
- [成果與影響](#成果與影響)
- [技術細節](#技術細節)

## 🎯 專案背景

偏鄉醫療資源有限，小診所醫師定期上山巡診，但面臨：
- 病患透過 LINE OA 問診，訊息來回平均耗時 2.5 小時
- 一人醫療團隊無法即時回覆所有問診
- 巡診時間有限，無法完整進行衛教說明
- 缺乏系統化管理患者症狀的工具

**專案時間：** 2025年7月 - 10月  
**我的角色：** 全端開發與系統架構規劃設計

## 🔍 問題與挑戰

### 問診流程痛點
```
病患發問 → 等待2.5小時 → 醫師回覆 → 等待1-2小時 → 病患再回覆
                ❌ 備藥延遲        ❌ 效率低下
```

### 衛教推播困難
- 不知道該推播給哪些患者
- 製作衛教影音耗時耗力
- 缺乏追蹤患者症狀的系統

## 💡 解決方案

我負責開發兩個核心系統：

### 1️⃣ LINE BOT 智能問診系統
自動處理常見問題，減輕醫師負擔

### 2️⃣ 智慧醫療管理 Web App
管理病患症狀，精準推播衛教內容

## 🏗️ 技術架構

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        Zeabur 部署環境                            │
│                                                                   │
│  ┌────────────────┐      ┌─────────────────┐    ┌────────────┐ │
│  │  Next.js App   │◄────►│  n8n Workflow   │◄───│  MongoDB   │ │
│  │                │      │                 │    │            │ │
│  │ - 管理介面      │      │ - LINE Webhook  │    │ - patients │ │
│  │ - 患者搜尋      │      │ - AI 分類        │    │ - patient  │ │
│  │ - 衛教推播      │      │ - 自動回覆       │    │ - 對話記錄 │ │
│  └────────┬───────┘      └────────┬────────┘    └────────────┘ │
│           │                       │                              │
└───────────┼───────────────────────┼──────────────────────────────┘
            │                       │
            │                       │
    ┌───────▼───────┐       ┌───────▼────────┐
    │               │       │                │
┌───┴────┐    ┌────┴────┐   │  ┌──────────┐  │
│ 醫師   │    │ LINE OA │  │  │ Gemini   │  │
│ Web端  │    │         │  │  │ API      │  │
└────────┘    │ - Push  │  │  └──────────┘  │
              │ - Reply │  │                │
              └─────────┘  │  ┌──────────┐  │
                  ▲        │  │ Google   │  │
                  │        │  │ Sheets   │  │
            ┌─────┴─────┐  │  │ (FAQ)    │  │
            │  患者     │  │  └──────────┘  │
            │  LINE App │  │                │
            └───────────┘  └────────────────┘
                              外部服務
```


![系統架構圖](./images/system-structure.png)


### 資料流向

**1. AI 自動回覆流程**
```
患者發送訊息 
  → LINE Webhook 觸發 n8n
  → n8n 讀取 FAQ (Google Sheets)
  → Gemini API 分類訊息
  → 查詢 MongoDB (判斷是否已回覆)
  → Transaction 鎖定機制
  → LINE Reply API 回覆
  → 儲存對話記錄到 MongoDB
```

**2. 衛教推播流程**
```
醫師登入 Web App
  → 查詢 MongoDB 患者症狀
  → 選擇目標患者群
  → Next.js API 呼叫 LINE Push API
  → 批次推播衛教內容
```

**3. 關鍵字萃取流程**
```
爬蟲/LINE API 取得完整對話
  → LLM 萃取症狀關鍵字
  → 匯入 MongoDB patients collection
  → Web App 顯示症狀統計
  → 醫師人工校正關鍵字
```

### 技術選型理由

| 技術 | 用途 | 選擇原因 |
|------|------|---------|
| **Next.js** | 全端框架 | SSR 支援、API Routes、開發效率高 |
| **MongoDB** | 數據庫 | 靈活的文檔結構，適合非結構化醫療數據 |
| **n8n** | 工作流自動化 | 視覺化流程設計，易於維護與擴展 |
| **Google Gemini** | LLM | 多語言支援、回應速度快、成本效益高 |
| **Google Sheets** | FAQ 知識庫 | 非技術人員可直接更新，降低維護成本 |

## ✨ 功能展示

### LINE BOT 智能問診


![LINE BOT 自動回覆範例](./images/line-bot-before-after.png)

**Before：人工回覆**
```
病患: 請問下次巡診時間？
        ⏰ 等待 2.5 小時
醫師: 下週三上午9點
```

**After：AI 自動回覆**
```
病患: 請問下次巡診時間？
BOT: 下週三上午9點（桃園復興鄉）
        ⚡ < 1 分鐘
```

**核心流程**
1. 病患透過 LINE OA 發送訊息
2. n8n 接收 webhook，觸發工作流
3. 從 Google Sheets 讀取 FAQ 知識庫
4. 使用 Gemini API 進行語意匹配
5. 自動回覆 or 轉交醫師處理
6. 儲存對話歷史至 MongoDB

![n8n工作流](./images/n8n-workflow.png)

### 智慧醫療管理 Web App

**主要功能**

#### 📊 症狀管理儀表板
- 顯示所有病患近期症狀關鍵字
- 整合 LLM 輔助的中醫證候分析
- 支援症狀趨勢視覺化

![關鍵字](./images/keyword.png)
![症狀管理儀表板](./images/dashboard.png)


#### 🔍 精準患者篩選

![患者搜尋介面](./images/search-patients.png)

```javascript
// 示例：找出所有「失眠」相關患者
SELECT patients 
WHERE symptoms CONTAINS "失眠" 
   OR tcm_syndrome CONTAINS "心腎不交"
```

#### 📤 一鍵衛教推播
1. 選擇目標症狀（如：失眠）
2. 選擇相關衛教 Podcast
3. 一鍵推播至所有相關患者 LINE

![衛教推播介面](./images/line-push.png)

## 📊 成果與影響

### 量化指標

| 指標 | Before | After | 改善 |
|------|--------|-------|------|
| 平均回覆時間 | 2.5 小時 | < 1 分鐘 | ⬇️ 99.3% |
| 醫師處理訊息數 | 100% | ~30% | ⬇️ 70% |

### 質化成果

✅ **醫師端**
- 減少重複性問答，專注於複雜病例
- 系統化管理病患資料，提升診療品質
- 衛教內容可精準推播，不再浪費時間

✅ **病患端**
- 即時獲得常見問題解答
- 收到針對自身症狀的衛教內容
- 改善醫病溝通效率

✅ **組織端**
- 建立可擴展的數位醫療基礎設施
- 累積 4 個月的病患數據資產
- 為未來 AI 應用奠定基礎

## 🔧 技術細節

### 1. AI 自動回覆的設計思路

#### 為何不使用傳統 LLM + Memory 架構？

**醫療領域的特殊考量：**
- ❌ **不能讓 LLM 自由回答**：醫療建議錯誤可能造成嚴重後果
- ❌ **不能依賴 LLM 記憶**：對話歷史可能斷裂或理解錯誤
- ✅ **只在特定範圍內自動回覆**：僅回答醫師預設的 FAQ 內容

**採用的解決方案：語意分類 + 規則控制**

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

**核心設計：**
1. **LLM 只負責「分類」，不負責「生成回答」**
   - Prompt 嚴格限制：只能從預設的 FAQ 項目中選擇 category
   - 禁止自創分類名稱，無法判斷時必須回傳 `null`
   
2. **Google Sheets 作為動態 FAQ 知識庫**

  ![Google Sheet FAQ知識庫](./images/faq-sheet.png)
  
   - 醫師可直接編輯「項目」、「關鍵字」、「回覆」欄位
   - n8n 每小時同步到系統，無需重啟服務
   - 範例結構：
     ```
     | 項目   | 關鍵字                    | 回覆                        |
     |--------|---------------------------|-----------------------------|
     | 失眠   | 睡不著,睡眠品質差,多夢    | 建議您...                   |
     | 咳嗽   | 咳嗽,痰多,喉嚨不適        | 可以先...                   |
     | 拿藥   | 拿藥,複診,領藥            | 巡診時間是...               |
     ```

3. **AI 語意擴展能力**
   - 不只是關鍵字配對，能理解同義詞、口語表達
   - 例：「睡不好」→「失眠」、「要領藥」→「拿一樣的藥」
   - 結合 4 天對話歷史判斷患者意圖

4. **排除機制避免誤判**
   - 明確告訴 LLM：「睡眠改善很多」→ `category: null`（不是問診）
   - 避免患者回報「好轉」時系統仍推播衛教

### 2. Transaction 併發控制設計

#### 問題背景：n8n 不支援 MongoDB Transaction

**遇到的問題：**
```
患者短時間內發送多則訊息
  ↓
n8n 並發觸發多個 workflow instance
  ↓
同時讀取 MongoDB → 都判斷「未回覆過」
  ↓
結果：同一個 FAQ 被推播 3 次 ❌
```

#### 自行設計的樂觀鎖機制

**核心概念：使用 `transactionId` 模擬分散式鎖**

```javascript
// Step 1: 嘗試取得鎖（使用訊息 timestamp 作為唯一 ID）
db.patient.findOneAndUpdate(
  { userId: "U1234", transactionId: null },  // 只有沒人持有鎖才能取得
  { 
    $set: { 
      transactionId: 1707392847123,  // 當前訊息 timestamp
      transactionStartTime: new Date()
    }
  }
)

// Step 2: 檢查是否成功取得鎖
if (result.transactionId === null) {
  // ✅ 成功取得鎖，可以處理
  processMessage();
  
  // Step 3: 處理完畢後釋放鎖
  db.patient.update({ transactionId: null });
} else {
  // ❌ 其他請求正在處理，等待後重試
  await sleep(random(500, 2500));  // 隨機等待避免同時重試
  retry();
}
```

**設計細節：**
- **超時自動釋放**：超過 30 秒的 transaction 視為異常，自動釋放
  ```javascript
  if ((now - transactionStartTime) > 30000) {
    // 可以強制取得鎖
  }
  ```
- **隨機等待避免 Race Condition**：0.5-2.5 秒隨機延遲，避免多個請求同時重試
- **最多重試 6 次**：避免無限等待造成系統負擔

**為何不用 MongoDB 原生 Transaction？**
- n8n MongoDB Node 不支援 `session` 參數
- 若要使用需要自寫 Code Node 連接 MongoDB，失去視覺化工作流優勢
- 樂觀鎖機制已足夠解決此場景的併發問題

### 3. LINE Message API 整合

#### Webhook API - 接收患者訊息

```javascript
// LINE Platform 設定 Webhook URL
Webhook URL: https://your-n8n-domain.com/webhook/bot

// n8n 接收到的資料結構
{
  events: [{
    type: "message",
    replyToken: "xxx",  // 用於回覆該訊息
    source: { userId: "U1234..." },
    message: { 
      type: "text", 
      text: "我最近失眠很嚴重" 
    },
    timestamp: 1707392847123
  }]
}
```

**用途：**
- 接收患者主動發送的訊息
- 觸發 n8n workflow 進行 AI 分類和自動回覆

#### Push API - 主動推播衛教內容

```javascript
// Web App 呼叫 LINE Messaging API
POST https://api.line.me/v2/bot/message/push
Headers: Authorization: Bearer {CHANNEL_ACCESS_TOKEN}
Body: {
  to: "U1234...",  // LINE User ID
  messages: [{
    type: "text",
    text: "根據您的症狀，推薦收聽：https://podcast.com/sleep"
  }]
}
```

**用途：**
- 醫師從 Web App 選擇患者後，主動推播衛教內容
- 支援批次推播給多位患者

**兩種 API 的差異：**
| 功能 | Webhook (Reply API) | Push API |
|------|---------------------|----------|
| 觸發方式 | 患者發訊息觸發 | 系統主動推播 |
| 限制 | 只能用 replyToken 回覆一次 | 可隨時推播 |
| 使用場景 | AI 自動回覆 | 衛教內容推播 |

### 4. 歷史訊息搜集與關鍵字萃取

#### 問題：Webhook 只能搜集單向訊息

**Webhook 的限制：**
```
患者: 我最近失眠很嚴重        ✅ 可以收到
醫師: 建議您早點休息...        ❌ 收不到（醫師從 LINE OA 後台回覆）
患者: 好的謝謝醫師            ✅ 可以收到
```

**影響：**
- 只有患者的訊息被記錄，無法得知醫師診斷了什麼症狀
- 缺少完整對話脈絡，影響症狀關鍵字萃取準確度

#### 解決方案：補齊歷史對話

**方案 1：使用 LINE 官方 API 取得歷史訊息（需付費方案）**

- ✅ 官方支援，穩定可靠
- ❌ 需升級為付費方案（Messaging API Pro）

**方案 2：爬蟲擷取 LINE OA 後台對話記錄**


- ✅ 免費方案可用
- ❌ 需維護爬蟲腳本，LINE 改版可能失效

#### 對話關鍵字萃取流程

```
完整對話歷史 (User + Doctor)
  ↓
呼叫 LLM 進行關鍵字萃取
  ↓ Prompt: "請從以下對話中萃取患者的症狀關鍵字"
  ↓
LLM 輸出: {symptoms: ["失眠", "頭痛"], syndromes: ["肝鬱氣滯"]}
  ↓
匯入 Web App MongoDB
  ↓ db.patients.update({userId}, {$push: {historyRecords: {...}}})
  ↓
醫師從 Web App 查看患者症狀統計
  ↓
精準推播衛教內容給特定症狀患者
```

**實際執行方式：**
1. **定期批次處理**（每天凌晨）
   - 爬取或 API 取得前一天的所有對話
   - 批次呼叫 LLM 萃取關鍵字
   - 更新到 MongoDB `patients` collection

2. **LLM Prompt 範例**
   ```
   請從以下中醫問診對話中萃取關鍵資訊：
   
   對話內容：
   患者: 我最近睡眠很差，常常半夜醒來
   醫師: 有頭暈或胸悶嗎？
   患者: 有一點頭暈，胸口悶悶的
   醫師: 這是肝鬱氣滯的表現，需要疏肝理氣
   
   請以JSON格式輸出：
   {
     "symptoms": ["失眠", "頭暈", "胸悶"],
     "syndromes": ["肝鬱氣滯"],
     "visitDate": "2024-10-15"
   }
   ```

3. **串接到 Web App**
   - 醫師登入 Web App 查看「本週失眠患者」
   - 系統從 MongoDB 查詢 `historyRecords.symptoms` 包含「失眠」的患者
   - 一鍵推播失眠衛教 Podcast 給這些患者

## 🚀 部署與維護

### 部署架構

**正式產品環境（客戶端）：**
- **平台：** Zeabur 全服務部署
  - Next.js Web App (SSR)
  - n8n Workflow Engine
  - MongoDB Database
- **優勢：**
  - 一站式部署，降低維運複雜度
  - 自動化 CI/CD 流程
  - 內部網路高效通訊

**個人作品集環境：**
- **前端/後端：** Render.com (Next.js)
- **數據庫：** MongoDB Atlas
- **n8n：** 獨立部署

> 本 README 技術細節以正式產品環境為主

### 環境變數配置

**核心環境變數：**
```env
# MongoDB (Zeabur 內部連接)
MONGODB_URI=mongodb://username:password@mongodb:27017/tcm-clinic
MONGODB_DB=tcm-clinic
LINEBOT_MONGODB_DB=linebot

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Google Sheets (FAQ 知識庫)
GOOGLE_SHEETS_ID=1sbZSO2KTBMWKnMMmP9ysx03kfYi6yP_WJ_aati-vW64
GOOGLE_SERVICE_ACCOUNT_KEY=your_service_account_json
```

**n8n 憑證配置：**
- **LINE Message API Bearer Auth**
- **Google Service Account** (存取 Google Sheets FAQ)
- **Google Gemini API** (AI 分類與語意理解)
- **MongoDB Connection** (對話歷史與患者資料)

**部署注意事項：**
- Zeabur 環境下，服務間可透過內部網路直接通訊
- n8n 使用檔案系統快取 FAQ (`/home/node/data-sop.json`)
- MongoDB 需支援 Aggregation Pipeline 進行時間窗口查詢
- LINE Webhook URL 設定為 n8n 公開端點

## 💭 技術挑戰與解決

### 挑戰 1：AI 誤判「改善回報」為「新問診」
**解決：** Prompt 明確排除規則 + 歷史訊息上下文（4天對話）判斷患者意圖

### 挑戰 2：並發請求造成重複回覆
**解決：** Transaction 鎖機制（transactionId + 30秒超時）+ 隨機等待重試

### 挑戰 3：長訊息不應自動回覆
**解決：** 字數閾值判斷（≤30字自動回覆，>30字轉醫師）

### 挑戰 4：FAQ 更新需重啟服務
**解決：** 定時任務每小時同步 Google Sheets → data-sop.json

### 挑戰 5：特定時間才啟用自動回覆
**解決：** Filter Node 檢查星期（activeDayList: [0,1,2,3]）

## 🎓 個人收穫

### 技術成長
- 🤖 首次整合 LLM API，學習 prompt engineering
- ⚙️ 掌握 n8n 複雜工作流設計
- 📊 MongoDB aggregation pipeline 實戰經驗
- 🔐 處理敏感醫療數據的安全實踐

### 跨領域協作
- 與醫療專業人員溝通需求
- 理解中醫問診邏輯與術語
- 平衡技術可行性與業務需求

### 產品思維
- 從真實痛點出發設計解決方案
- 量化成果追蹤（Before/After）
- 考慮非技術使用者的體驗

## 🔮 未來優化方向

### AI 能力提升

> **關於 RAG 技術**  
> 目前因患者訊息短（如「我失眠」、「要拿藥」）且醫師嚴格限制 AI 只能回答預設 FAQ，現有「語意分類 + 規則控制」已足夠。  
> **未來若情境改變**（如開放更多範圍給 AI 自動回覆、處理更複雜的中醫問診），RAG 將是關鍵優化方向。

- [ ] **RAG 技術整合**（前提：開放更多自動回覆範圍）
  - 建立中醫知識庫向量資料庫，讓 LLM 能參考專業文獻回答
  - 收集中醫證候、症狀對應、用藥建議等權威資料
  - 使用 Embedding 技術建立語意搜尋引擎
  - 適用場景：複雜症狀諮詢、用藥說明、養生建議等

- [ ] **解決 AI 幻覺問題**
  - 強化 Prompt Engineering：增加更多正反例訓練案例
  - 實作信心度動態閾值：confidence < 0.7 自動轉人工審核
  - 建立回覆品質監控機制：追蹤誤判案例並持續優化 Prompt

- [ ] **改善關鍵字萃取準確度**
  - 建立中醫症狀標準詞典，過濾不合理萃取結果（如「耳朵會呼吸」）
  - 使用 Few-shot Learning 提供更多萃取範例
  - 實作多輪對話萃取：結合患者多次就診紀錄，理解症狀變化趨勢
  - **已實作：醫師人工校正** ✅ Web App 提供介面讓醫師修正 LLM 萃取的關鍵字
  - 建立回饋迴圈：將醫師校正的資料用於 Fine-tuning LLM，持續提升萃取準確度

## 📞 聯絡方式

如果對這個專案有任何問題，歡迎聯絡我：
- Portfolio: https://susan8213.github.io/my-simple-portfolio/

## 🔗 相關文檔

- [專案總覽](../README.md)
- [Web App 開發指南](./WEB_APP.md)
- [LINE BOT 技術文檔](./LINEBOT.md)
- [API 參考文檔](./API.md)
- [部署指南](./DEPLOYMENT.md)

---

⭐ 如果這個專案對你有幫助，歡迎給個 Star！