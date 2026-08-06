import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Wand2, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer 
      style={{ 
        borderTop: '1px solid var(--glass-border)', 
        background: 'rgba(11, 15, 25, 0.4)', 
        backdropFilter: 'blur(10px)',
        padding: '3rem 0 2rem', 
        marginTop: 'auto'
      }}
    >
      <div className="container">
        {/* Main Footer Row */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '2.5rem',
            marginBottom: '2.5rem'
          }}
        >
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '10px', 
                  background: 'var(--gradient-brand)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#ffffff'
                }}
              >
                <Wand2 size={18} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                MediaTools <span className="gradient-text">TW</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              打造全台最流暢且重視個人隱私的純前端媒體線上工具箱。所有影片、音訊與 PDF 檔案均在瀏覽器端完全運算。
            </p>
            
            {/* Security Badge */}
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 0.85rem', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <ShieldCheck size={16} />
              <span>100% 本地運算，零檔案上傳保密安全</span>
            </div>
          </div>

          {/* Quick Links: Video & Audio */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              🎬 影片與音訊工具
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                <Link to="/video-cutter" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  影片剪輯 (Video Cutter)
                </Link>
              </li>
              <li>
                <Link to="/video-crop" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  影片裁切 (Video Crop)
                </Link>
              </li>
              <li>
                <Link to="/video-to-gif" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  影片轉 GIF (Video to GIF)
                </Link>
              </li>
              <li>
                <Link to="/audio-extractor" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  提取音訊 (Audio Extractor)
                </Link>
              </li>
              <li>
                <Link to="/audio-cutter" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  音訊剪輯 (Audio Cutter)
                </Link>
              </li>
              <li>
                <Link to="/voice-recorder" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  線上錄音機 (Voice Recorder)
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links: PDF & Converter */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              📄 PDF 與轉檔工具
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                <Link to="/pdf-merge" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  PDF 合併 (Merge PDF)
                </Link>
              </li>
              <li>
                <Link to="/pdf-split" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  PDF 分割 (Split PDF)
                </Link>
              </li>
              <li>
                <Link to="/pdf-to-image" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  PDF 轉圖片 (PDF to Image)
                </Link>
              </li>
              <li>
                <Link to="/image-converter" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  圖片轉檔 (Image Converter)
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology Stack Info */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              ⚡ 核心技術
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              本系統由 React 18, WebAssembly (FFmpeg WASM), pdf-lib, pdfjs-dist 與 Web Audio API 強力驅動。
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              不需要安裝軟體、無須訂閱，開啟瀏覽器即可隨時高效處理多媒體。
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div 
          style={{ 
            borderTop: '1px solid var(--glass-border)', 
            paddingTop: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            © 2026 MediaTools 繁體中文全能媒體工具箱. 保留所有權利。
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Made with</span>
            <Heart size={14} style={{ color: '#ec4899', fill: '#ec4899' }} />
            <span>for Web Privacy & Efficiency</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
