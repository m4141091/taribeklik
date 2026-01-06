import React from 'react';
import { Section, SectionElement } from '@/types/section';
import { isSafeUrl } from '@/lib/urlValidation';

interface SectionViewerProps {
  section: Section;
}

const RenderElement = ({ element }: { element: SectionElement }) => {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    fontFamily:
      element.styles.fontFamily === 'cooperative'
        ? "'Cooperative', sans-serif"
        : element.styles.fontFamily === 'script'
        ? "'Script', cursive"
        : "'Discovery', sans-serif",
    fontSize: `${element.styles.fontSize}px`,
    color: element.styles.color,
    textAlign: element.styles.textAlign as 'right' | 'center' | 'left',
    borderRadius: `${element.styles.borderRadius}px`,
    boxSizing: 'border-box',
  };

  switch (element.type) {
    case 'heading':
      return (
        <h2 style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {element.content}
        </h2>
      );
    case 'text':
      return (
        <p style={{ ...baseStyle, display: 'flex', alignItems: 'center' }}>
          {element.content}
        </p>
      );
    case 'button': {
      const safeHref = isSafeUrl(element.link) ? element.link : undefined;
      return (
        <a
          href={safeHref || '#'}
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: element.styles.backgroundColor,
            textDecoration: 'none',
            cursor: safeHref ? 'pointer' : 'default',
          }}
          onClick={safeHref ? undefined : (e) => e.preventDefault()}
        >
          {element.content}
        </a>
      );
    }
    case 'image':
      return (
        <img
          src={element.content}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: element.styles.objectFit || 'contain',
            objectPosition: element.styles.objectPosition || 'center',
            borderRadius: `${element.styles.borderRadius}px`,
            opacity: (element.styles.opacity ?? 100) / 100,
          }}
        />
      );
    case 'search':
      return (
        <div
          style={{
            ...baseStyle,
            display: 'flex',
            alignItems: 'center',
            paddingRight: '1rem',
            backgroundColor: element.styles.backgroundColor || '#ffffff',
            border: '1px solid #ccc',
          }}
        >
          🔍 {element.content}
        </div>
      );
    case 'separator':
      return element.content ? (
        <img src={element.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#e5e5e5' }} />
      );
    default:
      return null;
  }
};

export const SectionViewer: React.FC<SectionViewerProps> = ({ section }) => {
  return (
    <section
      className="w-full relative"
      style={{
        height: `${section.height}px`,
        backgroundColor: section.background_color || undefined,
        backgroundImage: section.background_image_url
          ? `url(${section.background_image_url})`
          : undefined,
        backgroundSize: section.background_size || 'cover',
        backgroundPosition: section.background_position || 'center',
        backgroundRepeat: 'no-repeat',
      }}
      dir="rtl"
    >
      {/* Container בגודל מקסימלי קבוע - זהה לעריכה */}
      <div
        className="relative h-full mx-auto"
        style={{ maxWidth: '1200px' }}
      >
        {section.elements
          ?.sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
          .map((el) => {
            const isFullWidth = el.size.width === '100%';
            
            const width =
              typeof el.size.width === 'string'
                ? el.size.width
                : `${el.size.width}px`;
            const height =
              typeof el.size.height === 'string'
                ? el.size.height
                : `${el.size.height}px`;

            return (
              <div
                key={el.id}
                className="absolute"
                style={{
                  left: isFullWidth ? '0' : `${el.position.x}%`,
                  top: `${el.position.y}%`,
                  transform: isFullWidth ? 'translateY(-50%)' : 'translate(-50%, -50%)',
                  width,
                  height,
                  zIndex: el.zIndex || 1,
                }}
              >
                <RenderElement element={el} />
              </div>
            );
          })}
      </div>
    </section>
  );
};
