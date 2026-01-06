import React from 'react';
import { Section } from '@/types/section';
import { RenderElement } from './RenderElement';

interface DynamicSectionProps {
  section: Section;
}

export const DynamicSection: React.FC<DynamicSectionProps> = ({ section }) => {
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
      }}
    >
      {/* Container פנימי לאלמנטים - ממורכז */}
      <div 
        className="relative h-full mx-auto"
        style={{ maxWidth: '1200px' }}
      >
        {section.elements.map((element) => {
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
                left: `${element.position.x}%`,
                top: `${element.position.y}%`,
                transform: 'translate(-50%, -50%)',
                width: widthValue,
                height: heightValue,
                zIndex: element.zIndex || 1,
              }}
            >
              <RenderElement element={element} />
            </div>
          );
        })}
      </div>
    </section>
  );
};
