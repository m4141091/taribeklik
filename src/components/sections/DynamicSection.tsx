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
      {section.elements.map((element) => (
        <div
          key={element.id}
          className="absolute"
          style={{
            left: `${element.position.x}%`,
            top: `${element.position.y}%`,
            transform: 'translate(-50%, -50%)',
            width: element.size.width,
            height: element.size.height,
            zIndex: element.zIndex || 1,
          }}
        >
          <RenderElement element={element} />
        </div>
      ))}
    </section>
  );
};
