import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MetaConfig {
  title: string;
  description: string;
}

const SEO_MAP: Record<string, MetaConfig> = {
  '/': {
    title: '123apps 繁體中文版 - 100% 免費線上 WebAssembly 多媒體工具箱 (影片剪輯、PDF 合併、音訊剪輯、錄音機)',
    description: '100% 免費線上 WebAssembly 多媒體工具箱，提供影片剪輯、PDF 合併與分割、音訊剪輯、麥克風錄音機及圖片格式轉換等功能，純本地瀏覽器運算，零隱私外洩風險。',
  },
  '/video-cutter': {
    title: '免費線上影片剪輯工具 - 極速切片 MP4 (100% 本地運算)',
    description: '免費線上影片剪輯與切片工具，支援 MP4/WebM/MOV，無需上傳伺服器，100% 於瀏覽器內極速剪輯影片。',
  },
  '/video-crop': {
    title: '線上影片畫面裁切工具 - 支援 16:9, 4:3, 1:1, 9:16',
    description: '線上影片畫面裁切工具，靈活調整畫面比例 16:9, 4:3, 1:1, 9:16，一鍵輸出自訂比例影片。',
  },
  '/video-to-gif': {
    title: '影片轉 GIF 動圖工具 - 線上轉檔高畫質 GIF',
    description: '將 MP4 或影片剪輯片段快速轉換為高畫質動態 GIF，支援解析度與畫質設定。',
  },
  '/audio-extractor': {
    title: '影片抽出音訊工具 - 免費提取 MP3/WAV/AAC 聲軌',
    description: '線上從 MP4 或影片中抽取背景音樂與聲音檔，匯出高品質 MP3 或 WAV 音訊。',
  },
  '/video-auto-subtitle': {
    title: '影片自動上字幕工具 - AI 語音轉文字 SRT/VTT 導出',
    description: '線上 AI 語音辨識自動生成繁體中文影片字幕，支援即時預覽、字幕時間軸編輯與 SRT/VTT 檔案導出。',
  },
  '/pdf-merge': {
    title: '線上 PDF 合併工具 - 多檔案拖曳一鍵合成單一 PDF',
    description: '線上將多個 PDF 檔案快速合併為單一文件，支援拖曳排序與預覽，100% 本地隱私安全。',
  },
  '/pdf-split': {
    title: '線上 PDF 分割工具 - 自由抽頁或按範圍分割 PDF',
    description: '線上抽離 PDF 指定頁碼或按頁數範圍拆分 PDF 檔案，簡單快捷且不遺漏內容。',
  },
  '/pdf-to-image': {
    title: 'PDF 轉圖片工具 - 高畫質 PNG/JPG 渲染包裝下載',
    description: '將 PDF 各頁面高畫質渲染為 PNG 或 JPG 圖片，支援單頁下載與一鍵 ZIP 打包。',
  },
  '/audio-cutter': {
    title: '線上音訊剪輯工具 - Canvas 波形選擇與淡入淡出',
    description: '線上裁切 MP3 與音訊檔案，視覺化波形選擇、支援淡入淡出效果與即時試聽。',
  },
  '/voice-recorder': {
    title: '線上麥克風錄音機 - 即時頻譜視覺化與聲音錄製',
    description: '免費線上麥克風錄音工具，具備即時音訊頻譜視覺化與高品質 MP3/WAV 匯出。',
  },
  '/image-converter': {
    title: '圖片格式轉換工具 - 支援 JPG/PNG/WEBP 批次轉換',
    description: '線上批次轉換圖片格式，支援 JPG、PNG、WEBP、GIF、BMP、SVG 互轉，自由調整畫質與打包 ZIP 下載。',
  },
};

const DEFAULT_META: MetaConfig = {
  title: '123apps 繁體中文版 - 100% 免費線上 WebAssembly 多媒體工具箱',
  description: '免費線上 WebAssembly 多媒體工具箱，包含影片剪輯、PDF 合併、音訊剪輯、聲音錄製與圖片格式轉換工具，100% 本地運算，保障個人隱私。',
};

export function SeoMeta() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const meta = SEO_MAP[pathname] || DEFAULT_META;

    // Update document title
    document.title = meta.title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', meta.description);
  }, [location.pathname]);

  return null;
}
