# 偏鄉智慧診療支援系統
> LINE BOT 智能問診 + Web 管理系統的整合解決方案

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)
[![n8n](https://img.shields.io/badge/n8n-automation-orange)](https://n8n.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 🎯 專案簡介

這是一套為偏鄉醫療資源有限的小診所設計的智慧診療支援系統。醫師定期上山巡診，但面臨病患透過 LINE 問診時回覆耗時過長（平均 2.5 小時）、無法系統化管理患者症狀等挑戰。

本專案整合 **AI 自動問診**與**智慧患者管理**兩大核心功能：
- 🤖 **LINE BOT 智能問診系統**：使用 n8n + Google Gemini 自動處理常見問題，回覆時間從 2.5 小時降至 < 1 分鐘
- 💻 **智慧醫療管理 Web App**：Next.js 開發的患者症狀管理系統，支援精準篩選與衛教推播

**核心成果：**
- ⬇️ 平均回覆時間降低 99.3%（2.5 小時 → < 1 分鐘）
- ⬇️ 醫師處理訊息量減少 70%
- 📊 4 個月累積可分析的患者數據資產

## 📚 文檔導航

### 🌟 作品集展示
想快速了解專案價值、技術決策與實際成果？

👉 **[完整專案介紹與技術亮點](./docs/PORTFOLIO.md)**

內容包含：
- 專案背景與問題挑戰
- 解決方案與技術架構
- 功能展示與成果數據
- 4 大核心技術細節（AI 設計、Transaction 控制、LINE API、訊息搜集）
- 部署架構與未來優化方向

### 🛠️ 技術文檔

#### 📱 [LINE BOT 智能問診系統](./docs/LINEBOT.md)
- n8n 工作流設計與運作原理
- Google Gemini AI 整合方式
- FAQ 知識庫管理（Google Sheets）
- Transaction 併發控制機制
- LINE Webhook 與 Reply API

#### 💻 [Web 管理系統開發指南](./docs/WEB_APP.md)
- Next.js 14 + TypeScript 架構
- NextAuth.js Google OAuth 認證
- MongoDB 資料模型設計
- 患者搜尋與症狀管理功能
- API 端點與使用方式

#### 🚀 [部署指南](./docs/DEPLOYMENT.md)
- Zeabur 全服務部署（正式環境）
- Render.com + MongoDB Atlas 部署（作品集）
- 環境變數配置說明
- CI/CD 自動化流程

#### 📡 [API 參考文檔](./docs/API.md)
- 認證相關 API（NextAuth）
- 患者管理 API（CRUD）
- 醫療記錄 API（週報告）
- 訊息推播 API（LINE Push）
- LINE 用戶同步 API

## ⚡ 快速開始

### 系統需求
- Node.js 18+
- MongoDB 7.0+（建議使用 MongoDB Atlas）
- LINE Official Account（需開啟 Messaging API）
- Google OAuth 2.0 應用程式（Web App 認證用）
- Google Gemini API Key（AI 分類用）

### 本地開發

```bash
# 1. 複製專案
git clone https://github.com/susan8213/health-ed-system.git
cd health-ed-system

# 2. 安裝依賴
npm install

# 3. 設定環境變數
cp .env.example .env.local
# 編輯 .env.local，填入必要的金鑰和連接字串

# 4. 初始化資料庫
npm run setup-db

# 5. 啟動開發伺服器
npm run dev
```

啟動後請訪問 http://localhost:3000

### 環境變數配置重點

```env
# MongoDB（必填）
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tcm-clinic
MONGODB_DB=tcm-clinic
LINEBOT_MONGODB_DB=linebot

# LINE Messaging API（必填）
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# NextAuth Google OAuth（必填）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Gemini API（必填）
GEMINI_API_KEY=your_gemini_api_key

# Google Sheets FAQ（可選）
GOOGLE_SHEETS_ID=your_sheets_id
GOOGLE_SERVICE_ACCOUNT_KEY=your_service_account_json
```

詳細配置說明請參考 [部署指南](./docs/DEPLOYMENT.md)

## 🏗️ 技術架構概覽

```
┌─────────────────────────────────────────────────────────┐
│                    Zeabur 部署環境                        │
│                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  Next.js     │◄──►│  n8n         │◄───│  MongoDB  │ │
│  │  Web App     │    │  Workflow    │    │           │ │
│  └──────┬───────┘    └──────┬───────┘    └───────────┘ │
│         │                   │                            │
└─────────┼───────────────────┼────────────────────────────┘
          │                   │
    ┌─────▼─────┐       ┌─────▼─────┐
    │  醫師     │       │  患者     │
    │  管理介面  │       │  LINE App │
    └───────────┘       └───────────┘
```

**核心技術棧：**
- **前端框架：** Next.js 14 (App Router) + TypeScript
- **資料庫：** MongoDB 7.0（文檔式資料庫）
- **工作流引擎：** n8n（視覺化自動化）
- **AI 服務：** Google Gemini 1.5 Flash（語意分類）
- **即時通訊：** LINE Messaging API（Webhook + Push）
- **認證系統：** NextAuth.js + Google OAuth 2.0
- **知識庫：** Google Sheets（動態 FAQ 管理）

詳細架構說明請參考 [專案展示文檔](./docs/PORTFOLIO.md#技術架構)

## 📦 專案結構

```
health-ed-system/
├── docs/                      # 📚 文檔資料夾
│   ├── PORTFOLIO.md          # 作品集展示文檔
│   ├── WEB_APP.md            # Web App 技術文檔
│   ├── LINEBOT.md            # LINE BOT 技術文檔
│   ├── DEPLOYMENT.md         # 部署指南
│   └── API.md                # API 參考文檔│
│
├── n8n/                      # 🤖 n8n 工作流定義
│   └── linebot ai (completeness).json
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # NextAuth 認證
│   │   │   ├── users/        # 患者管理
│   │   │   ├── records/      # 醫療記錄
│   │   │   ├── notifications/ # 訊息推播
│   │   │   └── sync/         # LINE 用戶同步
│   │   ├── edit/             # 編輯記錄頁面
│   │   ├── patient/          # 患者詳情頁面
│   │   └── records/          # 週報告頁面
│   │
│   ├── components/           # React 元件
│   ├── lib/                  # 工具函式
│   │   ├── mongodb.ts        # 資料庫連接
│   │   ├── line-api.ts       # LINE API 客戶端
│   │   └── api-client.ts     # API 請求封裝
│   │
│   ├── types/                # TypeScript 型別定義
│   └── scripts/              # 資料庫設定腳本
│
├── .env.example              # 環境變數範本
├── package.json              # 專案依賴
└── next.config.js            # Next.js 配置
```

## 🔧 開發指令

```bash
# 開發模式
npm run dev              # 啟動開發伺服器（localhost:3000）

# 建置部署
npm run build            # 建置生產版本
npm run start            # 啟動生產伺服器

# 程式碼品質
npm run lint             # ESLint 檢查

# 資料庫管理
npm run setup-db         # 初始化資料庫索引
```

---

**專案時間：** 2025年7月 - 10月  
**開發角色：** 全端開發與系統架構規劃設計  
**Built with ❤️ for Traditional Chinese Medicine practitioners**
