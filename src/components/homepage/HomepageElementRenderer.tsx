import React from 'react';
import { HomepageElement } from '@/types/homepage';
import { Search } from 'lucide-react';
import TypewriterText from '@/components/TypewriterText';
import { isSafeUrl } from '@/lib/urlValidation';
import { ProductGridElement } from './ProductGridElement';

interface HomepageElementRendererProps {
  element: HomepageElement;
}

export const HomepageElementRenderer: React.FC<HomepageElementRendererProps> = ({ element }) => {
  const renderTextContent = (content: string) => {
    if (element.typewriter_enabled) {
      return (
        <TypewriterText
          text={content}
          typingSpeed={element.typewriter_speed || 100}
          initialDelay={(element.typewriter_delay || 500) / 1000}
        />
      );
    }
    return content;
  };

  const getFontFamily = () => {
    switch (element.font_family) {
      case 'discovery-fs': return "'Discovery-Fs', sans-serif";
      case 'cooperative': return "'Cooperative', sans-serif";
      case 'script': return "'Script', cursive";
      default: return "'Discovery', sans-serif";
    }
  };

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    fontFamily: getFontFamily(),
    fontSize: `${element.font_size}px`,
    lineHeight: element.line_height || 1.2,
    color: element.color,
    textAlign: element.text_align,
    borderRadius: `${element.border_radius}px`,
    opacity: element.opacity / 100,
    whiteSpace: 'pre-wrap',
  };

  switch (element.element_type) {
    case 'heading':
      return (
        <h2 style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderTextContent(element.content || '')}
        </h2>
      );

    case 'text':
      return (
        <p style={{ ...baseStyle, display: 'flex', alignItems: 'center' }}>
          {renderTextContent(element.content || '')}
        </p>
      );

    case 'button': {
      const safeHref = element.link_url && isSafeUrl(element.link_url) ? element.link_url : undefined;
      return (
        <a
          href={safeHref || '#'}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            backgroundColor: element.background_color || 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            textDecoration: 'none',
            cursor: safeHref ? 'pointer' : 'default',
            paddingLeft: element.icon_url ? '48px' : '12px',
            paddingRight: '12px',
            paddingTop: '4px',
            paddingBottom: '4px',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
          onClick={safeHref ? undefined : (e) => e.preventDefault()}
        >
          {element.icon_url && (
            <img src={element.icon_url} alt="" style={{ 
              width: `${element.icon_size || 40}px`, 
              height: `${element.icon_size || 40}px`, 
              flexShrink: 0, 
              position: 'absolute', 
              left: `${element.icon_offset_x ?? 4}px`, 
              top: `${element.icon_offset_y ?? 50}%`, 
              transform: 'translateY(-50%)' 
            }} />
          )}
          <span style={{ flex: 1, textAlign: 'center' }}>
            {element.content}
          </span>
        </a>
      );
    }

    case 'image':
      return element.content ? (
        <img
          src={element.content}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: element.object_fit,
            objectPosition: element.object_position,
            borderRadius: `${element.border_radius}px`,
            opacity: element.opacity / 100,
          }}
        />
      ) : null;

    case 'search':
      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            paddingRight: '1rem',
            backgroundColor: element.background_color || '#ffffff',
            border: '1px solid #ccc',
          }}
        >
          <Search className="w-5 h-5 ml-2 flex-shrink-0" />
          <input
            type="text"
            placeholder={element.content || 'חיפוש...'}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: element.font_size }}
          />
        </div>
      );

    case 'separator':
      return element.content ? (
        <img src={element.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', backgroundColor: element.background_color || '#e5e5e5' }} />
      );

    case 'card':
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: element.background_color || '#ffffff',
            padding: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {element.content}
        </div>
      );

    case 'product_grid':
      return <ProductGridElement element={element} />;

    default:
      return null;
  }
};
