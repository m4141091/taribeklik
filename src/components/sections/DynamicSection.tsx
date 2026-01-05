import React from 'react';
import { Section } from '@/types/section';
import { RenderElement } from './RenderElement';

interface DynamicSectionProps {
  section: Section;
}

export const DynamicSection: React.FC<DynamicSectionProps> = ({ section }) => {
  return (
    <section
      className="relative w-full"
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
      {section.elements.map((element) => {
        const isFullWidth = element.size.width === '100%';
        const widthValue = typeof element.size.width === 'number' 
          ? `${element.size.width}px` 
          : element.size.width;
        const heightValue = typeof element.size.height === 'number' 
          ? `${element.size.height}px` 
          : element.size.height;

        return (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: isFullWidth ? '0' : `${element.position.x}%`,
              top: `${element.position.y}%`,
              transform: isFullWidth ? 'translateY(-50%)' : 'translate(-50%, -50%)',
              width: widthValue,
              height: heightValue,
              zIndex: element.zIndex || 1,
            }}
          >
            <RenderElement element={element} />
          </div>
        );
      })}
    </section>
  );
};
