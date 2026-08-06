import React from 'react';
import { 
  Video, 
  Crop, 
  FileVideo, 
  Music2, 
  FileText, 
  Split, 
  Image as ImageIcon, 
  Music, 
  Mic, 
  RefreshCw 
} from 'lucide-react';

export type CategoryId = 'all' | 'video' | 'pdf' | 'audio' | 'converter';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: 'video' | 'pdf' | 'audio' | 'converter';
  categoryName: string;
  path: string;
  tag: string;
  iconName: string;
}

export const CATEGORIES = [
  { id: 'all' as CategoryId, label: '全部', icon: 'Sparkles' },
  { id: 'video' as CategoryId, label: '🎬 影片工具', icon: 'Video' },
  { id: 'pdf' as CategoryId, label: '📄 PDF 工具', icon: 'FileText' },
  { id: 'audio' as CategoryId, label: '🎵 音訊工具', icon: 'Music' },
  { id: 'converter' as CategoryId, label: '🔄 轉檔工具', icon: 'RefreshCw' },
];

export const TOOLS_DATA: ToolItem[] = [
  // 影片工具
  {
    id: 'video-cutter',
    title: '影片剪輯',
    description: '精準裁剪影片片段，自訂開始與結束時間，快速導出',
    category: 'video',
    categoryName: '影片工具',
    path: '/video-cutter',
    tag: '熱門',
    iconName: 'Video',
  },
  {
    id: 'video-crop',
    title: '影片裁切',
    description: '自由調整影片畫面比例與裁切區域，移除邊框',
    category: 'video',
    categoryName: '影片工具',
    path: '/video-crop',
    tag: '免安裝',
    iconName: 'Crop',
  },
  {
    id: 'video-to-gif',
    title: '影片轉 GIF',
    description: '將影片精彩段落轉換為高畫質動態 GIF 圖檔',
    category: 'video',
    categoryName: '影片工具',
    path: '/video-to-gif',
    tag: '推薦',
    iconName: 'FileVideo',
  },
  {
    id: 'audio-extractor',
    title: '提取音訊',
    description: '一鍵從影片檔中抽離背景音樂或對白，輸出 MP3 音訊',
    category: 'video',
    categoryName: '影片工具',
    path: '/audio-extractor',
    tag: '快速',
    iconName: 'Music2',
  },

  // PDF 工具
  {
    id: 'pdf-merge',
    title: 'PDF 合併',
    description: '多個 PDF 文件按指定順序合併為單一文件',
    category: 'pdf',
    categoryName: 'PDF 工具',
    path: '/pdf-merge',
    tag: '熱門',
    iconName: 'FileText',
  },
  {
    id: 'pdf-split',
    title: 'PDF 分割',
    description: '自訂頁碼範圍分割 PDF 文件或提取特定頁面',
    category: 'pdf',
    categoryName: 'PDF 工具',
    path: '/pdf-split',
    tag: '免安裝',
    iconName: 'Split',
  },
  {
    id: 'pdf-to-image',
    title: 'PDF 轉圖片',
    description: '將 PDF 頁面高品質轉換為 PNG 或 JPG 圖片',
    category: 'pdf',
    categoryName: 'PDF 工具',
    path: '/pdf-to-image',
    tag: '高畫質',
    iconName: 'Image',
  },

  // 音訊工具
  {
    id: 'audio-cutter',
    title: '音訊剪輯',
    description: '視覺化聲波圖形裁切音訊檔，輕鬆製作手機鈴聲',
    category: 'audio',
    categoryName: '音訊工具',
    path: '/audio-cutter',
    tag: '熱門',
    iconName: 'Music',
  },
  {
    id: 'voice-recorder',
    title: '錄音機',
    description: '線上麥克風高音質錄音，支援即時聲波顯示與下載',
    category: 'audio',
    categoryName: '音訊工具',
    path: '/voice-recorder',
    tag: '免安裝',
    iconName: 'Mic',
  },

  // 轉檔工具
  {
    id: 'image-converter',
    title: '圖片轉檔',
    description: '批次轉換 JPG, PNG, WEBP, GIF 等常見圖片格式',
    category: 'converter',
    categoryName: '轉檔工具',
    path: '/image-converter',
    tag: '熱門',
    iconName: 'RefreshCw',
  },
];
