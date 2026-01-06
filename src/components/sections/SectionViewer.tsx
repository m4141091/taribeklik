import React from 'react';
import { Section, SectionElement } from '@/types/section';
import { Search } from 'lucide-react';
import TypewriterText from '@/components/TypewriterText';

interface SectionViewerProps {
  section: Section;
}

export const SectionViewer: React.FC<SectionViewerProps> = ({ section }) => {
  return (
    <section
      className="relative w-full mx-auto overflow-hidden"
      style={{
        height: `${section.height}px`,
        backgroundColor: section.background_color || undefined,
        backgroundImage: section.background_image_url 
          ? `url(${section.background_image_url})` 
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {section.elements
        ?.sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
        .map((el) => {
          const isLeftEdge = el.position.x <= 5;
          const isRightEdge = el.position.x >= 95;
          const isFullWidth = el.size.width === '100%';
          
          const widthValue = typeof el.size.width === 'number' 
            ? `${el.size.width}px` 
            : el.size.width;
          const heightValue = typeof el.size.height === 'number' 
            ? `${el.size.height}px` 
            : el.size.height;

          // Calculate position and transform based on edge proximity
          let leftStyle: string;
          let transformStyle: string;

          if (isFullWidth) {
            leftStyle = '0';
            transformStyle = 'translateY(-50%)';
          } else if (isLeftEdge) {
            leftStyle = `${el.position.x}%`;
            transformStyle = 'translateY(-50%)';
          } else if (isRightEdge) {
            leftStyle = `${el.position.x}%`;
            transformStyle = 'translate(-100%, -50%)';
          } else {
            leftStyle = `${el.position.x}%`;
            transformStyle = 'translate(-50%, -50%)';
          }

          return (
            <div
              key={el.id}
              className="absolute"
              style={{
                left: leftStyle,
                top: `${el.position.y}%`,
                transform: transformStyle,
                width: widthValue,
                height: heightValue,
                zIndex: el.zIndex || 1,
              }}
            >
              <RenderElement element={el} />
            </div>
          );
        })}
    </section>
  );
};

interface RenderElementProps {
  element: SectionElement;
}

const RenderElement: React.FC<RenderElementProps> = ({ element: el }) => {
  const renderTextContent = (content: string) => {
    if (el.effects?.typewriter) {
      return (
        <TypewriterText
          text={content}
          typingSpeed={el.effects.typewriterSpeed || 100}
          initialDelay={(el.effects.typewriterDelay || 500) / 1000}
        />
      );
    }
    return content;
  };

  const baseStyle: React.CSSProperties = {
    fontFamily: el.styles.fontFamily === 'cooperative' ? 'Cooperative' : 
                el.styles.fontFamily === 'script' ? 'Script' : 'Discovery',
    fontSize: el.styles.fontSize ? `${el.styles.fontSize}px` : undefined,
    color: el.styles.color,
    textAlign: el.styles.textAlign,
    borderRadius: el.styles.borderRadius ? `${el.styles.borderRadius}px` : undefined,
  };

  switch (el.type) {
    case 'heading':
      return (
        <h2
          className="w-full h-full flex items-center justify-center"
          style={baseStyle}
        >
          {renderTextContent(el.content)}
        </h2>
      );

    case 'text':
      return (
        <p
          className="w-full h-full flex items-center"
          style={baseStyle}
        >
          {renderTextContent(el.content)}
        </p>
      );

    case 'button':
      if (el.link) {
        return (
          <a
            href={el.link}
            className="w-full h-full flex items-center justify-center transition-opacity hover:opacity-90"
            style={{
              ...baseStyle,
              backgroundColor: el.styles.backgroundColor,
            }}
          >
            {el.content}
          </a>
        );
      }
      return (
        <button
          className="w-full h-full flex items-center justify-center transition-opacity hover:opacity-90"
          style={{
            ...baseStyle,
            backgroundColor: el.styles.backgroundColor,
          }}
        >
          {el.content}
        </button>
      );

    case 'image':
      return (
        <div className="w-full h-full overflow-hidden">
          {el.content ? (
            <img
              src={el.content}
              alt=""
              className="w-full h-full"
              style={{ 
                borderRadius: el.styles.borderRadius ? `${el.styles.borderRadius}px` : undefined,
                objectFit: el.styles.objectFit || 'contain',
                objectPosition: el.styles.objectPosition || 'center',
                opacity: el.styles.opacity !== undefined ? el.styles.opacity / 100 : 1,
              }}
            />
          ) : null}
        </div>
      );

    case 'search':
      return (
        <form 
          className="w-full h-full flex items-center px-4 border border-border"
          style={{
            backgroundColor: el.styles.backgroundColor,
            borderRadius: el.styles.borderRadius ? `${el.styles.borderRadius}px` : undefined,
          }}
          onSubmit={(e) => e.preventDefault()}
        >
          <Search className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
          <input
            type="text"
            placeholder={el.content}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            style={{ fontSize: el.styles.fontSize ? `${el.styles.fontSize}px` : undefined }}
          />
        </form>
      );

    case 'separator':
      return (
        <div className="w-full h-full">
          {el.content ? (
            <img
              src={el.content}
              alt=""
              className="w-full h-full object-cover"
              aria-hidden="true"
            />
          ) : null}
        </div>
      );

    default:
      return null;
  }
};
