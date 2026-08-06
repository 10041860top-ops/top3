# Task 1 執行報告：專案骨架與 Glassmorphism 設計系統搭建

## 執行狀態
**DONE** (已完成)

## 變更摘要
1. **專案結構初始化**：
   - 建立 Vite + React + TypeScript 專案架構與組態設定。
   - 建立 `package.json`，配置所需依賴項：`react`, `react-dom`, `react-router-dom`, `lucide-react`, `pdf-lib`, `pdfjs-dist`, `jszip`, `@ffmpeg/ffmpeg`, `@ffmpeg/util` 等。
   - 配置 `vite.config.ts` 加入 WASM 所需之 Cross-Origin Header（`COOP` 與 `COEP`）。
   - 配置 `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` 與 `index.html`。

2. **設計系統與 CSS Custom Properties (`src/index.css`)**：
   - 定義全域 Glassmorphism 暗黑 / 明亮雙主題色系與毛玻璃效果（`backdrop-filter: blur(16px)`）。
   - 包含漸層色彩（`gradient-brand`, `gradient-video`, `gradient-audio`, `gradient-pdf`, `gradient-converter`）。
   - 提供微互動 Hover 動畫、glow 發光效應與按鈕、卡片、輸入框等通用 Glass 樣式類別。

3. **基礎佈局與路由組件 (`src/App.tsx` & `src/main.tsx`)**：
   - 使用 `react-router-dom` 的 `BrowserRouter` 配置核心路由。
   - 實現頂部導航列（包含品牌 Logo 與明暗主題即時切換按鈕）。
   - 實現首頁四款核心工具分類卡片示範展示（影片工具、音訊工具、PDF 工具、圖片轉檔工具）。
   - 所有 UI 文字均 100% 採用繁體中文 (zh-TW)。

## 產出檔案
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `index.html`
- `src/vite-env.d.ts`
- `src/index.css`
- `src/main.tsx`
- `src/App.tsx`
- `docs/task-1-report.md`
