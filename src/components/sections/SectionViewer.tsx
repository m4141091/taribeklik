import React from 'react';
import { Section, SectionElement } from '@/types/section';

interface SectionViewerProps {
  section: Section;
}

export const SectionViewer: React.FC<SectionViewerProps> = ({ section }) => {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: `${section.height}px`,
        backgroundColor: section.background_color || '#ffffff',
        backgroundImage: section.background_image_url ? `url(${section.background_image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {section.elements
        ?.sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
        .map((el) => (
          <div
            key={el.id}
            className="absolute"
            style={{
              left: `${el.position.x}%`,
              top: `${el.position.y}%`,
              width: `${el.size.width}%`,
              height: `${el.size.height}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: el.zIndex || 1,
            }}
          >
            <RenderElement element={el} />
          </div>
        ))}
    </div>
  );
};

const RenderElement: React.FC<{ element: SectionElement }> = ({ element: el }) => {
  const baseStyle: React.CSSProperties = {
    fontFamily:
      el.styles.fontFamily === 'cooperative'
        ? "'Cooperative', sans-serif"
        : el.styles.fontFamily === 'script'
        ? "'Script', cursive"
        : "'Discovery', sans-serif",
    fontSize: `${el.styles.fontSize}px`,
    color: el.styles.color,
    textAlign: el.styles.textAlign,
    borderRadius: `${el.styles.borderRadius}px`,
    boxSizing: 'border-box',
  };

  switch (el.type) {
    case 'heading':
      return (
        <h2 className="w-full h-full flex items-center justify-center" style={baseStyle}>
          {el.content}
        </h2>
      );
    case 'text':
      return (
        <p className="w-full h-full flex items-center" style={baseStyle}>
          {el.content}
        </p>
      );
    case 'button':
      return (
        <button
          className="w-full h-full flex items-center justify-center transition-opacity hover:opacity-90"
          style={{ ...baseStyle, backgroundColor: el.styles.backgroundColor }}
        >
          {el.content}
        </button>
      );
    case 'image':
      return (
        <img
          src={el.content}
          alt=""
          className="w-full h-full"
          style={{
            borderRadius: `${el.styles.borderRadius}px`,
            objectFit: el.styles.objectFit || 'contain',
            objectPosition: el.styles.objectPosition || 'center',
            opacity: el.styles.opacity !== undefined ? el.styles.opacity / 100 : 1,
          }}
        />
      );
    case 'search':
      return (
        <div
          className="w-full h-full flex items-center px-4 gap-2"
          style={{ ...baseStyle, backgroundColor: el.styles.backgroundColor }}
        >
          🔍 {el.content}
        </div>
      );
    case 'separator':
      return el.content ? (
        <img src={el.content} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-border" />
      );
    default:
      return null;
  }
};
