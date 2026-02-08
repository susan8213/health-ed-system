# API 參考文檔

> 偏鄉智慧診療支援系統 RESTful API 完整規格

## 📋 目錄
- [API 概述](#api-概述)
- [認證系統](#認證系統)
- [患者管理](#患者管理)
- [醫療記錄](#醫療記錄)
- [LINE 訊息推播](#line-訊息推播)
- [系統工具](#系統工具)
- [錯誤處理](#錯誤處理)

## 🎯 API 概述

### Base URL
```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

### 認證方式
- **NextAuth.js Session-based Authentication**
- 所有 API（除了認證端點）都需要有效的 Session Cookie
- Session 有效期：30 天（可自動更新）

### 通用回應格式

**成功回應：**
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**錯誤回應：**
```json
{
  "success": false,
  "error": "錯誤訊息",
  "code": "ERROR_CODE"
}
```

### HTTP 狀態碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 請求成功 |
| 201 | 資源建立成功 |
| 400 | 請求參數錯誤 |
| 401 | 未認證（需登入） |
| 403 | 無權限訪問 |
| 404 | 資源不存在 |
| 500 | 伺服器內部錯誤 |

## 🔐 認證系統

### Google OAuth 登入頁面

```http
GET /api/auth/signin
```

**描述：** 導向 Google OAuth 登入頁面

**回應：** HTML 登入頁面

**範例：**
```bash
curl https://your-domain.com/api/auth/signin
```

---

### Google OAuth Callback

```http
POST /api/auth/callback/google
```

**描述：** Google OAuth 回調端點（由 NextAuth 自動處理）

**參數：**
- `code`: OAuth authorization code (query parameter)
- `state`: CSRF protection state (query parameter)

**回應：** 重定向至應用程式首頁（含 Session Cookie）

---

### 取得當前 Session

```http
GET /api/auth/session
```

**描述：** 取得當前使用者的 Session 資訊

**回應：**
```json
{
  "user": {
    "name": "Dr. Wang",
    "email": "doctor@example.com",
    "image": "https://lh3.googleusercontent.com/..."
  },
  "expires": "2026-03-10T12:00:00.000Z"
}
```

**未登入回應：**
```json
{}
```

**範例：**
```bash
curl -X GET https://your-domain.com/api/auth/session \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 登出

```http
POST /api/auth/signout
```

**描述：** 登出並清除 Session

**回應：**
```json
{
  "url": "/api/auth/signin"
}
```

---

## 👥 患者管理

### 搜尋患者

```http
GET /api/users
```

**描述：** 搜尋患者（支援多關鍵字 OR 邏輯）

**Query 參數：**
| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `keyword` | string | 否 | 搜尋關鍵字（支援多關鍵字空格分隔） |
| `symptom` | string | 否 | 症狀篩選 |
| `syndrome` | string | 否 | 證候篩選 |
| `limit` | number | 否 | 返回數量限制（預設：50） |

**搜尋邏輯：**
- **單一關鍵字**：`keyword=王` → 找出姓名包含「王」的患者
- **多關鍵字 OR**：`keyword=王 明` → 找出姓名包含「王」**或**「明」的患者
- **跨欄位 AND**：`keyword=王&symptom=失眠` → 姓名包含「王」**且**症狀包含「失眠」

**回應：**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "王小明",
      "lineUserId": "Uabc123...",
      "historyRecords": [
        {
          "visitDate": "2026-02-01T00:00:00.000Z",
          "symptoms": ["失眠", "頭痛"],
          "syndromes": ["肝鬱氣滯"],
          "notes": "患者訴說壓力大",
          "createdAt": "2026-02-01T10:30:00.000Z",
          "updatedAt": "2026-02-01T10:30:00.000Z"
        }
      ],
      "createdAt": "2025-10-15T08:00:00.000Z",
      "updatedAt": "2026-02-01T10:30:00.000Z",
      "lastSyncedAt": "2026-02-08T12:00:00.000Z"
    }
  ]
}
```

**範例：**
```bash
# 搜尋姓名包含「王」或「李」的患者
curl -X GET "https://your-domain.com/api/users?keyword=王 李" \
  -H "Cookie: next-auth.session-token=xxx"

# 搜尋失眠患者
curl -X GET "https://your-domain.com/api/users?symptom=失眠" \
  -H "Cookie: next-auth.session-token=xxx"

# 組合搜尋：姓王且有失眠症狀
curl -X GET "https://your-domain.com/api/users?keyword=王&symptom=失眠" \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 取得患者詳情

```http
GET /api/users/[id]
```

**描述：** 取得單一患者的完整資訊

**路徑參數：**
- `id`: 患者 MongoDB ObjectId

**回應：**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "王小明",
  "lineUserId": "Uabc123...",
  "historyRecords": [
    {
      "visitDate": "2026-02-01T00:00:00.000Z",
      "symptoms": ["失眠", "頭痛"],
      "syndromes": ["肝鬱氣滯"],
      "notes": "患者訴說壓力大"
    }
  ],
  "createdAt": "2025-10-15T08:00:00.000Z",
  "updatedAt": "2026-02-01T10:30:00.000Z"
}
```

**錯誤回應（404）：**
```json
{
  "error": "Patient not found"
}
```

**範例：**
```bash
curl -X GET https://your-domain.com/api/users/507f1f77bcf86cd799439011 \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 建立患者

```http
POST /api/users
```

**描述：** 建立新患者記錄

**Request Body：**
```json
{
  "name": "王小明",
  "lineUserId": "Uabc123...",  // 可選
  "historyRecords": [           // 可選
    {
      "visitDate": "2026-02-08",
      "symptoms": ["失眠"],
      "syndromes": ["心腎不交"],
      "notes": "初診"
    }
  ]
}
```

**必填欄位：**
- `name`: 患者姓名（string）

**回應（201）：**
```json
{
  "message": "Patient created successfully",
  "userId": "507f1f77bcf86cd799439011"
}
```

**錯誤回應（400）：**
```json
{
  "error": "Name is required"
}
```

**範例：**
```bash
curl -X POST https://your-domain.com/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "name": "王小明",
    "lineUserId": "Uabc123..."
  }'
```

---

### 更新患者最新記錄

```http
PUT /api/users/[id]/record
```

**描述：** 更新患者最新一筆的醫療記錄

**路徑參數：**
- `id`: 患者 MongoDB ObjectId

**Request Body：**
```json
{
  "visitDate": "2026-02-08",
  "symptoms": ["失眠", "頭痛"],     // 陣列
  "syndromes": ["肝鬱氣滯"],        // 陣列
  "notes": "患者回報睡眠改善"       // 可選
}
```

**症狀/證候陣列處理：**
- 前端可傳入逗號分隔字串：`"失眠, 頭痛"`
- 或直接傳入陣列：`["失眠", "頭痛"]`
- API 會自動處理空白與格式化

**回應（200）：**
```json
{
  "message": "Record updated successfully"
}
```

**錯誤回應（404）：**
```json
{
  "error": "Patient not found or no records to update"
}
```

**範例：**
```bash
curl -X PUT https://your-domain.com/api/users/507f1f77bcf86cd799439011/record \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "visitDate": "2026-02-08",
    "symptoms": ["失眠", "多夢"],
    "syndromes": ["心腎不交"],
    "notes": "改善中"
  }'
```

---

## 📊 醫療記錄

### 取得本週記錄統計

```http
GET /api/records/weekly
```

**描述：** 取得本週（週一至週日）的就診記錄統計

**回應：**
```json
{
  "weekStart": "2026-02-03",  // 本週一
  "weekEnd": "2026-02-09",    // 本週日
  "totalPatients": 12,
  "records": [
    {
      "patientId": "507f1f77bcf86cd799439011",
      "patientName": "王小明",
      "visitDate": "2026-02-05T00:00:00.000Z",
      "symptoms": ["失眠", "頭痛"],
      "syndromes": ["肝鬱氣滯"],
      "notes": "患者訴說壓力大"
    }
  ]
}
```

**日期計算規則：**
- 週一為一週的開始（符合台灣習慣）
- 包含當週週一 00:00 至週日 23:59:59 的記錄

**範例：**
```bash
curl -X GET https://your-domain.com/api/records/weekly \
  -H "Cookie: next-auth.session-token=xxx"
```

---

## 📱 LINE 訊息推播

### 同步 LINE 使用者

```http
POST /api/sync/line-users
```

**描述：** 從 LINE BOT 資料庫同步患者的 LINE User ID 到 Web App 資料庫

**運作邏輯：**
1. 查詢 `linebot` 資料庫的 `patient` collection
2. 根據患者姓名比對 `patients` collection
3. 更新 `lineUserId` 欄位和 `lastSyncedAt` 時間戳

**回應：**
```json
{
  "message": "LINE users synced successfully",
  "syncedCount": 15,
  "updatedUsers": [
    {
      "name": "王小明",
      "lineUserId": "Uabc123..."
    }
  ]
}
```

**錯誤回應（500）：**
```json
{
  "error": "Failed to sync LINE users",
  "details": "Connection refused to linebot database"
}
```

**範例：**
```bash
curl -X POST https://your-domain.com/api/sync/line-users \
  -H "Cookie: next-auth.session-token=xxx"
```

---

### 發送批次推播通知

```http
POST /api/notifications/send
```

**描述：** 透過 LINE Push API 批次推播衛教內容給選定的患者

**Request Body：**
```json
{
  "userIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "message": "根據您的症狀，推薦收聽這則衛教內容：\nhttps://podcast.com/tcm-sleep"
}
```

**必填欄位：**
- `userIds`: 患者 ID 陣列（MongoDB ObjectId[]）
- `message`: 推播訊息內容（string）

**回應：**
```json
{
  "message": "Notifications sent successfully",
  "successCount": 2,
  "failedCount": 0,
  "results": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "userName": "王小明",
      "status": "success"
    },
    {
      "userId": "507f1f77bcf86cd799439012",
      "userName": "李小華",
      "status": "success"
    }
  ]
}
```

**部分失敗範例：**
```json
{
  "message": "Notifications sent with some failures",
  "successCount": 1,
  "failedCount": 1,
  "results": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "userName": "王小明",
      "status": "success"
    },
    {
      "userId": "507f1f77bcf86cd799439012",
      "userName": "李小華",
      "status": "failed",
      "error": "LINE User ID not found"
    }
  ]
}
```

**錯誤處理：**
- 沒有 `lineUserId` 的患者會被跳過並標記為失敗
- LINE API 錯誤會被捕捉並回報

**範例：**
```bash
curl -X POST https://your-domain.com/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "userIds": ["507f1f77bcf86cd799439011"],
    "message": "本週衛教推播：失眠改善技巧\nhttps://example.com/video"
  }'
```

---

### 取得連結預覽

```http
POST /api/link-preview
```

**描述：** 擷取 URL 的 Open Graph 資訊（標題、描述、縮圖）

**Request Body：**
```json
{
  "url": "https://www.youtube.com/watch?v=xxx"
}
```

**回應：**
```json
{
  "title": "失眠改善的中醫觀點",
  "description": "中醫師講解失眠的常見證候與改善方法...",
  "image": "https://i.ytimg.com/vi/xxx/maxresdefault.jpg",
  "url": "https://www.youtube.com/watch?v=xxx"
}
```

**無法取得預覽時：**
```json
{
  "title": "https://www.youtube.com/watch?v=xxx",
  "description": "",
  "image": "",
  "url": "https://www.youtube.com/watch?v=xxx"
}
```

**範例：**
```bash
curl -X POST https://your-domain.com/api/link-preview \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

---

## 🛠️ 系統工具

### Health Check

```http
GET /api/health
```

**描述：** 檢查系統健康狀態

**回應：**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-08T12:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

**資料庫連接失敗：**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-02-08T12:00:00.000Z",
  "database": "disconnected",
  "error": "MongoServerError: Connection refused"
}
```

**範例：**
```bash
curl -X GET https://your-domain.com/api/health
```

---

## ⚠️ 錯誤處理

### 認證錯誤（401）

**情境：** 未登入或 Session 過期

**回應：**
```json
{
  "error": "Unauthorized",
  "message": "Please sign in to access this resource",
  "code": "AUTH_REQUIRED"
}
```

**處理方式：**
- 前端導向 `/api/auth/signin`
- 或顯示登入提示

---

### 參數錯誤（400）

**情境：** 必填欄位缺失或格式錯誤

**回應：**
```json
{
  "error": "Bad Request",
  "message": "Name is required",
  "code": "VALIDATION_ERROR"
}
```

**常見驗證錯誤：**
- `Name is required` - 姓名欄位必填
- `Invalid user ID format` - 使用者 ID 格式錯誤
- `Invalid date format` - 日期格式錯誤（應為 ISO 8601）

---

### 資源不存在（404）

**情境：** 查詢的患者或記錄不存在

**回應：**
```json
{
  "error": "Not Found",
  "message": "Patient not found",
  "code": "RESOURCE_NOT_FOUND"
}
```

---

### 伺服器錯誤（500）

**情境：** 資料庫連接失敗、第三方 API 錯誤等

**回應：**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "code": "SERVER_ERROR"
}
```

**處理方式：**
- 檢查伺服器日誌
- 確認資料庫連接狀態
- 驗證環境變數配置

---

## 📝 使用範例

### 完整工作流：建立患者並推播訊息

```bash
# 1. 登入（瀏覽器自動處理，取得 Session Cookie）
# 訪問: https://your-domain.com/api/auth/signin

# 2. 建立患者
PATIENT_ID=$(curl -X POST https://your-domain.com/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "name": "王小明",
    "lineUserId": "Uabc123...",
    "historyRecords": [{
      "visitDate": "2026-02-08",
      "symptoms": ["失眠"],
      "syndromes": ["心腎不交"],
      "notes": "初診"
    }]
  }' | jq -r '.userId')

# 3. 更新醫療記錄
curl -X PUT https://your-domain.com/api/users/$PATIENT_ID/record \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "visitDate": "2026-02-15",
    "symptoms": ["失眠", "多夢"],
    "syndromes": ["心腎不交"],
    "notes": "症狀改善中"
  }'

# 4. 搜尋失眠患者
INSOMNIA_PATIENTS=$(curl -X GET "https://your-domain.com/api/users?symptom=失眠" \
  -H "Cookie: next-auth.session-token=xxx" \
  | jq -r '.users[].id')

# 5. 批次推播衛教內容
curl -X POST https://your-domain.com/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d "{
    \"userIds\": $(echo $INSOMNIA_PATIENTS | jq -R 'split("\n")'),
    \"message\": \"失眠改善衛教：https://example.com/sleep-tips\"
  }"
```

---

## 🔗 相關資源

- [專案總覽](../README.md)
- [Web App 開發指南](./WEB_APP.md)
- [LINE BOT 技術文檔](./LINEBOT.md)
- [部署指南](./DEPLOYMENT.md)
- [作品集展示](./PORTFOLIO.md)

---

**API 版本：** v1.0  
**最後更新：** 2026/02/08  
**維護者：** susan8213
