# 123apps 繁體中文全能媒體工具網站 (MediaTools WebApp) 設計規格書

- **日期**：2026-08-06
- **狀態**：已批准 (Approved)
- **架構**：Vite + React + TypeScript + WASM (FFmpeg.wasm, pdf-lib, Web Audio API, Canvas)

---

## 1. 專案目標與願景 (Project Goals)
打造一款媲美 123apps (tw) 介面質感與功能的繁體中文媒體工具平台。
- **100% 前端運算**：免去伺服器處理成本與檔案大小限制，所有運算在使用者瀏覽器本地執行。
- **高質感 UI/UX**：採用深色玻璃擬態 (Dark Glassmorphic) 與微動畫設計，支援明暗主題切換。
- **極致速度與隱私保護**：檔案無需上傳至雲端伺服器，安全且極速。

---

## 2. 系統架構與模組設計 (Architecture & Component Design)

### 2.1 科技堆疊 (Tech Stack)
- **前端框架**：Vite + React + TypeScript
- **樣式系統**：Vanilla Modern CSS (CSS Custom Properties, Glassmorphism, CSS Grid/Flexbox)
- **核心媒體處理庫**：
  - `@ffmpeg/ffmpeg` + `@ffmpeg/util` (FFmpeg.wasm WebAssembly 引擎)
  - `pdf-lib` + `pdfjs-dist` (PDF 解析、合併、分割與渲染引擎)
  - Web Audio API + AudioContext (音訊解碼、繪製波形與音訊剪輯)
  - HTML5 MediaRecorder API (麥克風錄音)
  - HTML5 Canvas API (圖片格式轉換、影片裁切區域繪製、動態聲波頻譜)

---

## 3. 工具模組詳細規格 (Tool Specifications)

### 3.1 🎬 影片工具類 (Video Tools)
1. **影片剪輯 (Video Cutter / Trim)**
   - **路由**：`/video-cutter`
   - **功能**：雙向時間軸選擇器，精準設定開始與結束時間，免重編碼快速切片輸出 MP4。
2. **影片裁切 (Video Crop)**
   - **路由**：`/video-crop`
   - **功能**：互動 Canvas 選擇框，調整長寬比例 (16:9, 4:3, 1:1, 自訂)，產出裁切後影片。
3. **影片轉 GIF (Video to GIF)**
   - **路由**：`/video-to-gif`
   - **功能**：自訂 FPS 與解析度，將指定影片片段導出為高品質 GIF。
4. **抽音訊 (Extract Audio)**
   - **路由**：`/audio-extractor`
   - **功能**：一鍵提取影片中的聲音軌，輸出為 MP3 或 WAV 音訊檔。

### 3.2 📄 PDF 工具類 (PDF Tools)
1. **PDF 合併 (Merge PDF)**
   - **路由**：`/pdf-merge`
   - **功能**：支援多檔案拖曳上傳、卡片縮圖拖曳排序，合成單一 PDF 文件。
2. **PDF 分割 (Split PDF)**
   - **路由**：`/pdf-split`
   - **功能**：預覽 PDF 頁面縮圖，可單頁勾選或指定範圍抽取頁面生成新文件。
3. **PDF 轉圖片 (PDF to Image)**
   - **路由**：`/pdf-to-image`
   - **功能**：使用 `pdfjs-dist` 逐頁渲染為高解析度 PNG/JPG，打包成 ZIP 免費下載。

### 3.3 🎵 音訊工具類 (Audio Tools)
1. **音訊剪輯 (Audio Cutter)**
   - **路由**：`/audio-cutter`
   - **功能**：Web Audio API 繪製動態波形圖 (Waveform)，可微調起止時間並加入淡入/淡出效果。
2. **錄音機 (Voice Recorder)**
   - **路由**：`/voice-recorder`
   - **功能**：即時錄音，動態繪製聲波頻譜圖 (Visualizer)，錄製後可直接播放與下載 MP3/WAV。

### 3.4 🔄 轉檔與其他工具 (Converters & Utilities)
1. **圖片格式轉換 (Image Converter)**
   - **路由**：`/image-converter`
   - **功能**：支援 JPG, PNG, WEBP 等格式多檔批次轉換與品質調整。

---

## 4. UI/UX 與導航結構 (Layout & Navigation)
- **Header Topbar**：包含品牌 Logo、搜尋欄、四大分類選單 (影片、音訊、PDF、轉檔)、暗黑模式 Toggle。
- **Dashboard 儀表板**：123apps 經典卡片網格，附動態 Hover 效果與類別篩選標籤。
- **SEO 最佳化**：每頁動態配置 `document.title` 與 `meta description`。

---

## 5. 部署與託管 (Deployment)
- 靜態 Build (`npm run build`) 輸出可無縫部署至 Vercel, Cloudflare Pages, GitHub Pages。
