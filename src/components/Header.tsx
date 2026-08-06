import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Wand2, 
  Search, 
  Sun, 
  Moon, 
  X, 
  Video, 
  Music, 
  FileText, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { TOOLS_DATA, ToolItem } from '../data/toolsData';

export const Header: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('mediatools_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mediatools_theme', theme);
  }, [theme]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const filteredTools = searchQuery.trim() === '' 
    ? [] 
    : TOOLS_DATA.filter(tool => 
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSelectTool = (path: string) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    navigate(path);
  };

  const categoryLinks = [
    { label: '🎬 影片工具', path: '/category/video' },
    { label: '📄 PDF 工具', path: '/category/pdf' },
    { label: '🎵 音訊工具', path: '/category/audio' },
    { label: '🔄 轉檔工具', path: '/category/converter' },
  ];

  return (
    <header className="glass-header" style={{ padding: '0.85rem 0' }}>
      <div 
        className="container" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Brand Logo */}
        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            textDecoration: 'none' 
          }}
        >
          <div 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '14px', 
              background: 'var(--gradient-brand)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
            }}
          >
            <Wand2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              MediaTools <span className="gradient-text">TW</span>
            </span>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '-3px' }}>
              全能 WebAssembly 媒體工具箱
            </div>
          </div>
        </Link>

        {/* Category Nav Links */}
        <nav 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            overflowX: 'auto',
            padding: '0.25rem 0'
          }}
        >
          {categoryLinks.map(cat => {
            const isActive = location.pathname === cat.path;
            return (
              <Link
                key={cat.path}
                to={cat.path}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {cat.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Quick Search & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }} ref={searchRef}>
          {/* Quick Search Input */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '0.85rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }} 
            />
            <input 
              type="text" 
              className="glass-input" 
              placeholder="搜尋工具 (例如 PDF, 剪輯)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              style={{ 
                paddingLeft: '2.4rem', 
                paddingRight: searchQuery ? '2rem' : '1rem',
                height: '38px',
                fontSize: '0.85rem'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="清除搜尋"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div 
              className="glass-card" 
              style={{ 
                position: 'absolute', 
                top: 'calc(100% + 8px)', 
                right: 0, 
                width: '320px', 
                maxHeight: '380px', 
                overflowY: 'auto',
                zIndex: 100,
                padding: '0.75rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
                搜尋結果 ({filteredTools.length})
              </div>
              {filteredTools.length > 0 ? (
                filteredTools.map(tool => (
                  <div 
                    key={tool.id}
                    onClick={() => handleSelectTool(tool.path)}
                    style={{ 
                      padding: '0.6rem 0.75rem', 
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background var(--transition-fast)',
                      marginBottom: '0.25rem'
                    }}
                    className="search-item-hover"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {tool.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                        {tool.description}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  未找到符合「{searchQuery}」的工具
                </div>
              )}
            </div>
          )}

          {/* Dark / Light Theme Toggle */}
          <button 
            className="glass-button" 
            onClick={toggleTheme} 
            aria-label="切換主題"
            style={{ 
              height: '38px', 
              padding: '0 0.85rem',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            {theme === 'dark' ? <Sun size={16} style={{ color: '#fbbf24' }} /> : <Moon size={16} style={{ color: '#6366f1' }} />}
            <span style={{ display: 'inline' }}>{theme === 'dark' ? '明亮' : '暗黑'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
