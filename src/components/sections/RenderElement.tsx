import React from 'react';
import { SectionElement } from '@/types/section';
import { Search } from 'lucide-react';
import TypewriterText from '@/components/TypewriterText';
import { isSafeUrl } from '@/lib/urlValidation';

interface RenderElementProps {
  element: SectionElement;
}

export const RenderElement: React.FC<RenderElementProps> = ({ element }) => {
  const el = element;

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

  switch (el.type) {
    case 'heading':
      return (
        <h2
          className="w-full h-full flex items-center justify-center"
          style={{
            fontSize: el.styles.fontSize,
            fontFamily: el.styles.fontFamily === 'cooperative' ? 'Cooperative' : 
                        el.styles.fontFamily === 'script' ? 'Script' : 'Discovery',
            color: el.styles.color,
            textAlign: el.styles.textAlign,
          }}
        >
          {renderTextContent(el.content)}
        </h2>
      );

    case 'text':
      return (
        <p
          className="w-full h-full flex items-center"
          style={{
            fontSize: el.styles.fontSize,
            fontFamily: el.styles.fontFamily === 'cooperative' ? 'Cooperative' : 
                        el.styles.fontFamily === 'script' ? 'Script' : 'Discovery',
            color: el.styles.color,
            textAlign: el.styles.textAlign,
          }}
        >
          {renderTextContent(el.content)}
        </p>
      );

    case 'button':
      if (el.link && isSafeUrl(el.link)) {
        return (
          <a
            href={el.link}
            className="w-full h-full flex items-center justify-center transition-opacity hover:opacity-90"
            style={{
              fontSize: el.styles.fontSize,
              backgroundColor: el.styles.backgroundColor,
              color: el.styles.color,
              borderRadius: el.styles.borderRadius,
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
            fontSize: el.styles.fontSize,
            backgroundColor: el.styles.backgroundColor,
            color: el.styles.color,
            borderRadius: el.styles.borderRadius,
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
                borderRadius: el.styles.borderRadius,
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
            borderRadius: el.styles.borderRadius,
          }}
          onSubmit={(e) => e.preventDefault()}
        >
          <Search className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
          <input
            type="text"
            placeholder={el.content}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            style={{ fontSize: el.styles.fontSize }}
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
