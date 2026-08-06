# Task 3 執行報告：PDF 工具模組實作 (PDF Tools Implementation Report)

## 執行狀態
**STATUS: DONE**

## 完成項目概要
1. **`src/utils/pdfEngine.ts` 核心運算引擎：**
   - 整合 `pdf-lib` 實作 `mergePdfFiles` 支援多 PDF 檔案合併與自動頁面複製。
   - 實作 `splitPdfFile` 支援指定頁碼範圍 (例如 "1-3, 5, 7-10") 或個別頁面陣列抽取獨立 PDF。
   - 整合 `pdfjs-dist` 實作 `pdfToImages` 支援高畫質 Canvas 渲染、格式切換 (PNG/JPG) 與解析度倍率 (1x/2x/3x) 設定。
   - 整合 `jszip` 實作 `createZipFromImages` 支援將所有轉換後之圖片打包下載。
   - 實作 `downloadFile` 純前端 Blob 觸發下載工具函式。

2. **`src/pages/pdf/PdfMerge.tsx` PDF 合併頁面：**
   - 支援拖曳或多選上傳多個 PDF 檔案。
   - 支援獨立顯示檔案大小與總頁數預覽。
   - 提供上下移動按鈕讓使用者調整合併順序，支援刪除單一檔案與一鍵清空。
   - 提供「一鍵合併 PDF」按鈕並整合 Loading 狀態與自動下載機制。

3. **`src/pages/pdf/PdfSplit.tsx` PDF 分割頁面：**
   - 支援單一 PDF 拖曳上傳與檔名頁數統計。
   - 整合 `pdfjs-dist` 自動產生 PDF 各頁縮圖網格供預覽。
   - 提供兩種分割模式切換：「指定頁碼範圍」與互動式「選擇特定頁面」點擊多選。
   - 提供「分割並下載 PDF」按鈕與載入指示器。

4. **`src/pages/pdf/PdfToImage.tsx` PDF 轉圖片頁面：**
   - 支援 PNG / JPG 格式切換與 1x / 2x / 3x 解析度倍率切換。
   - 顯示轉檔進度條（當前頁數 / 總頁數）。
   - 繪製高畫質圖片預覽網格，支援個別頁面下載與「下載全部圖片 (ZIP)」一鍵打包。

5. **`src/App.tsx` 路由整合：**
   - 成功將 `/pdf-merge`、`/pdf-split` 與 `/pdf-to-image` 路由連接至專屬頁面組件。
