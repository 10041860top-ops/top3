import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Layers,
  Video,
  FileText,
  Music,
  RefreshCw,
  X
} from 'lucide-react';
import { CATEGORIES, TOOLS_DATA, CategoryId, ToolItem } from '../data/toolsData';
import { ToolCard } from '../components/ToolCard';

export const Dashboard: React.FC = () => {
  const { category: urlCategory } = useParams<{ category?: string }>();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<CategoryId>(
    (urlCategory as CategoryId) || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state if URL category changes
  useEffect(() => {
    if (urlCategory && ['video', 'pdf', 'audio', 'converter'].includes(urlCategory)) {
      setActiveCategory(urlCategory as CategoryId);
    } else if (!urlCategory) {
      setActiveCategory('all');
    }
  }, [urlCategory]);

  const handleCategorySelect = (catId: CategoryId) => {
    setActiveCategory(catId);
    if (catId === 'all') {
      navigate('/');
    } else {
      navigate(`/category/${catId}`);
    }
  };

  // Filter tools based on category and search query
  const filteredTools = TOOLS_DATA.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Group tools by category for structured rendering when viewing "all" with no search
  const categoriesToDisplay = [
    { id: 'video', title: '🎬 影片工具', description: '影片剪輯、畫面裁切、動態 GIF 轉換與背景音訊提取', icon: Video },
    { id: 'pdf', title: '📄 PDF 工具', description: 'PDF 文件合併、獨立頁碼分割與高品質轉圖檔', icon: FileText },
    { id: 'audio', title: '🎵 音訊工具', description: '波形圖視覺化剪輯與線上麥克風高清錄音', icon: Music },
    { id: 'converter', title: '🔄 轉檔工具', description: '批次圖片多格式快速轉換與質量優化', icon: RefreshCw },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', margin: '2rem 0 3.5rem' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          {/* Tag badge */}
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.4rem 1rem', 
              borderRadius: '30px', 
              background: 'rgba(139, 92, 246, 0.12)', 
              border: '1px solid rgba(139, 92, 246, 0.25)',
              color: 'var(--accent-primary)',
              fontSize: '0.875rem',
              fontWeight: 700,
              marginBottom: '1.25rem'
            }}
          >
            <Zap size={16} />
            <span>100% 瀏覽器 WebAssembly 純本地運算</span>
          </div>

          {/* Main Title */}
          <h1 
            style={{ 
              fontSize: 'clamp(2rem, 5vw, 3.25rem)', 
              fontWeight: 800, 
              lineHeight: 1.2, 
              marginBottom: '1.25rem',
              letterSpacing: '-1px'
            }}
          >
            一站式 WebAssembly <span className="gradient-text">多媒體工具箱</span>
          </h1>

          {/* Subtitle */}
          <p 
            style={{ 
              color: 'var(--text-secondary)', 
              fontSize: 'clamp(1rem, 2vw, 1.15rem)', 
              maxWidth: '680px', 
              margin: '0 auto 2.25rem',
              lineHeight: 1.6
            }}
          >
            100% 本地瀏覽器端運算，零檔案上傳，隱私安全無虞。快速完成影片剪輯、音訊切割、PDF 處理與圖片轉檔。
          </p>

          {/* Large Hero Search Bar */}
          <div 
            style={{ 
              position: 'relative', 
              maxWidth: '620px', 
              margin: '0 auto 2.5rem' 
            }}
          >
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '1.25rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }} 
            />
            <input 
              type="text" 
              className="glass-input" 
              placeholder="搜尋你需要的媒體工具 (例如：剪輯, 轉檔, 合併 PDF)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                paddingLeft: '3.25rem', 
                paddingRight: searchQuery ? '3rem' : '1.5rem',
                height: '56px',
                fontSize: '1.05rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="清除搜尋"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Feature Highlights Pills */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '1.5rem',
              flexWrap: 'wrap',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={16} style={{ color: '#10b981' }} />
              <span>隱私 100% 保密</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={16} style={{ color: '#f59e0b' }} />
              <span>毫秒級本地處理</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} style={{ color: '#3b82f6' }} />
              <span>免安裝零廣告</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container">
        {/* Category Navigation Badges */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.75rem',
            marginBottom: '3rem',
            flexWrap: 'wrap'
          }}
        >
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="glass-button"
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '30px',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--gradient-brand)' : 'var(--glass-bg)',
                  color: isActive ? '#ffffff' : 'var(--text-primary)',
                  border: isActive ? 'none' : '1px solid var(--glass-border)',
                  boxShadow: isActive ? '0 4px 15px rgba(139, 92, 246, 0.35)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* If user is filtering by search or a specific category */}
        {(searchQuery.trim() !== '' || activeCategory !== 'all') ? (
          <div>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}
            >
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {searchQuery.trim() !== '' 
                  ? `搜尋結果：${searchQuery}` 
                  : CATEGORIES.find(c => c.id === activeCategory)?.label}
              </h2>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                共找到 {filteredTools.length} 款工具
              </span>
            </div>

            {filteredTools.length > 0 ? (
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '1.5rem' 
                }}
              >
                {filteredTools.map(tool => (
                  <ToolCard key={tool.id} {...tool} />
                ))}
              </div>
            ) : (
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '3rem 1.5rem', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)' 
                }}
              >
                <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  沒有找到符合條件的工具
                </h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  請嘗試搜尋其他關鍵字或切換類別
                </p>
                <button 
                  className="glass-button" 
                  onClick={() => {
                    setSearchQuery('');
                    handleCategorySelect('all');
                  }}
                >
                  重置搜尋條件
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Default Dashboard View: Structured Category Grids */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            {categoriesToDisplay.map(cat => {
              const categoryTools = TOOLS_DATA.filter(t => t.category === cat.id);
              return (
                <section key={cat.id} id={cat.id}>
                  {/* Category Header */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '1.25rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid var(--glass-border)'
                    }}
                  >
                    <div>
                      <h2 
                        style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 800, 
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {cat.title}
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {cat.description}
                      </p>
                    </div>

                    <button 
                      className="glass-button" 
                      onClick={() => handleCategorySelect(cat.id as CategoryId)}
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                    >
                      查看全部 ({categoryTools.length})
                    </button>
                  </div>

                  {/* Cards Grid */}
                  <div 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                      gap: '1.5rem' 
                    }}
                  >
                    {categoryTools.map(tool => (
                      <ToolCard key={tool.id} {...tool} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
