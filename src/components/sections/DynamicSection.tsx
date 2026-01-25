import React from 'react';
import { Section } from '@/types/section';
import { RenderElement } from './RenderElement';
import logoPattern from '@/assets/logo-pattern.png';

interface DynamicSectionProps {
  section: Section;
}

export const DynamicSection: React.FC<DynamicSectionProps> = ({ section }) => {
  // Check if this is the "about" section that needs the pattern overlay
  const isAboutSection = section.slug === 'ktzat-alenu' || section.display_order === 1;
  
  return (
    <div className="w-full flex justify-center">
      <section
        className="relative w-full"
        style={{
          maxWidth: '1200px',
          height: `${section.height}px`,
          backgroundColor: section.background_color || undefined,
          backgroundImage: section.background_image_url 
            ? `url(${section.background_image_url})` 
            : undefined,
          backgroundSize: section.background_size || 'cover',
          backgroundPosition: section.background_position || 'center',
        }}
      >
        {/* Pattern overlay for about section */}
        {isAboutSection && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${logoPattern})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '80px 80px',
              opacity: 0.03,
            }}
          />
        )}
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
    </div>
  );
};
