import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { TOOLS_DATA } from '../data/toolsData';

interface ToolPlaceholderProps {
  toolId?: string;
}

export const ToolPlaceholder: React.FC<ToolPlaceholderProps> = ({ toolId: propToolId }) => {
  const params = useParams();
  // Match path from current window location or prop
  const currentPath = window.location.pathname;
  const tool = TOOLS_DATA.find(t => t.path === currentPath || t.id === propToolId);

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Top back button */}
      <Link 
        to="/" 
        className="glass-button" 
        style={{ 
          marginBottom: '2rem', 
          display: 'inline-flex', 
          fontSize: '0.9rem' 
        }}
      >
        <ArrowLeft size={16} />
        <span>返回首頁</span>
      </Link>

      <div 
        className="glass-card" 
        style={{ 
          padding: '3rem 2rem', 
          maxWidth: '800px', 
          margin: '0 auto', 
          textAlign: 'center' 
        }}
      >
        <div 
          style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '20px', 
            background: 'var(--gradient-brand)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#ffffff',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)'
          }}
        >
          <Sparkles size={32} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          {tool ? tool.title : '媒體處理工具'}
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          {tool ? tool.description : '強大的純前端 WASM 多媒體工具'}
        </p>

        {/* Security badge */}
        <div 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#10b981',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '2.5rem'
          }}
        >
          <ShieldCheck size={16} />
          <span>100% 本地 WebAssembly 運算，零檔案上傳</span>
        </div>

        {/* Workspace Placeholder Zone */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '4rem 2rem', 
            border: '2px dashed var(--glass-border)', 
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(0,0,0,0.1)'
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>
            🛠️ 此工具模組即將在後續步驟完整啟用。
          </p>
          <Link to="/" className="glass-button glass-button-primary">
            瀏覽其他工具
          </Link>
        </div>
      </div>
    </div>
  );
};
