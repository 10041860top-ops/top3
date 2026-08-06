import React from 'react';
import { Link } from 'react-router-dom';
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
  RefreshCw, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  category: 'video' | 'pdf' | 'audio' | 'converter';
  categoryName?: string;
  path: string;
  tag?: string;
  iconName?: string;
}

const renderIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Video':
      return <Video size={24} />;
    case 'Crop':
      return <Crop size={24} />;
    case 'FileVideo':
      return <FileVideo size={24} />;
    case 'Music2':
      return <Music2 size={24} />;
    case 'FileText':
      return <FileText size={24} />;
    case 'Split':
      return <Split size={24} />;
    case 'Image':
      return <ImageIcon size={24} />;
    case 'Music':
      return <Music size={24} />;
    case 'Mic':
      return <Mic size={24} />;
    case 'RefreshCw':
      return <RefreshCw size={24} />;
    default:
      return <Sparkles size={24} />;
  }
};

const getCategoryGradient = (category: string) => {
  switch (category) {
    case 'video':
      return 'var(--gradient-video)';
    case 'audio':
      return 'var(--gradient-audio)';
    case 'pdf':
      return 'var(--gradient-pdf)';
    case 'converter':
      return 'var(--gradient-converter)';
    default:
      return 'var(--gradient-brand)';
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  category,
  categoryName,
  path,
  tag,
  iconName
}) => {
  const gradient = getCategoryGradient(category);

  return (
    <Link 
      to={path} 
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
    >
      <div 
        className="glass-card" 
        style={{ 
          padding: '1.5rem', 
          width: '100%',
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
      >
        {/* Top bar with icon and tag badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div 
            style={{ 
              width: '52px', 
              height: '52px', 
              borderRadius: '16px', 
              background: gradient, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'transform var(--transition-fast)'
            }}
          >
            {renderIcon(iconName)}
          </div>

          {tag && (
            <span 
              style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                padding: '0.25rem 0.65rem', 
                borderRadius: '20px', 
                background: 'rgba(139, 92, 246, 0.15)', 
                color: 'var(--accent-primary)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                letterSpacing: '0.5px'
              }}
            >
              {tag}
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div style={{ flex: 1 }}>
          <h3 
            style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {title}
          </h3>
          <p 
            style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.875rem',
              lineHeight: 1.5,
              marginBottom: '1rem'
            }}
          >
            {description}
          </p>
        </div>

        {/* Footer link row */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--glass-border)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontWeight: 600
          }}
        >
          <span>{categoryName || '工具'}</span>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.25rem',
              color: 'var(--accent-primary)' 
            }}
          >
            <span>立即使用</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
};
