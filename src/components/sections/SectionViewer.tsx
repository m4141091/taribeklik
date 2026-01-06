import React from 'react';
import { Section, SectionElement } from '@/types/section';

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
        <h2 className="w-full h-full flex items-center justify-center" style={baseStyle}>
          {element.content}
        </h2>
      );
    case 'text':
      return (
        <p className="w-full h-full flex items-center" style={baseStyle}>
          {element.content}
        </p>
      );
    case 'button':
      return (
        <button
          className="w-full h-full flex items-center justify-center transition-opacity hover:opacity-90"
          style={{ ...baseStyle, backgroundColor: element.styles.backgroundColor }}
        >
          {element.content}
        </button>
      );
    case 'image':
      return (
        <img
          src={element.content}
          alt=""
          className="w-full h-full"
          style={{
            borderRadius: `${element.styles.borderRadius}px`,
            objectFit: element.styles.objectFit || 'contain',
            objectPosition: element.styles.objectPosition || 'center',
            opacity: element.styles.opacity !== undefined ? element.styles.opacity / 100 : 1,
          }}
        />
      );
    case 'search':
      return (
        <div
          className="w-full h-full flex items-center px-4 gap-2"
          style={{ ...baseStyle, backgroundColor: element.styles.backgroundColor }}
        >
          🔍 {element.content}
        </div>
      );
    case 'separator':
      return element.content ? (
        <img src={element.content} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-border" />
      );
    default:
      return null;
  }
};

export const SectionViewer: React.FC<SectionViewerProps> = ({ section }) => {
  return (
    <div className="w-full flex justify-center">
      {/* Container בגודל מקסימלי קבוע כמו בעריכה */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: '1200px',
          height: `${section.height}px`,
          backgroundColor: section.background_color || '#ffffff',
          backgroundImage: section.background_image_url ? `url(${section.background_image_url})` : undefined,
          backgroundSize: section.background_size || 'cover',
          backgroundPosition: section.background_position || 'center',
        }}
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
    </div>
  );
};
