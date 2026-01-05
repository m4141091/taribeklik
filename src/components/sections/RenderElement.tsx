import React from 'react';
import { SectionElement } from '@/types/section';
import { Search } from 'lucide-react';

interface RenderElementProps {
  element: SectionElement;
}

export const RenderElement: React.FC<RenderElementProps> = ({ element }) => {
  const el = element;

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
          {el.content}
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
          {el.content}
        </p>
      );

    case 'button':
      if (el.link) {
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
              className="w-full h-full object-cover"
              style={{ borderRadius: el.styles.borderRadius }}
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

    default:
      return null;
  }
};
