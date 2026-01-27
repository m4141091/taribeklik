import React from 'react';
import { useActiveSections } from '@/hooks/useSections';
import { SectionViewer } from './SectionViewer';
import sectionSeparator from '@/assets/section-separator.png';

export const DynamicSections: React.FC = () => {
  const { sections, loading } = useActiveSections();

  if (loading) {
    return null;
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          {/* Add overlap extension for first section to eliminate white line */}
          {index === 0 && sections.length > 1 && (
            <div 
              className="absolute left-0 right-0 z-5"
              style={{
                top: `${section.height - 20}px`,
                height: '40px',
                backgroundColor: section.background_color || 'transparent',
                backgroundImage: section.background_image_url 
                  ? `url(${section.background_image_url})` 
                  : undefined,
                backgroundSize: section.background_size || 'cover',
                backgroundPosition: 'center bottom',
              }}
            />
          )}
          {/* Add overlap extension for second section to eliminate white line */}
          {index === 1 && (
            <div 
              className="absolute left-0 right-0 z-5"
              style={{
                top: `${sections[0].height - 20}px`,
                height: '40px',
                backgroundColor: section.background_color || 'transparent',
              }}
            />
          )}
          <SectionViewer section={section} />
        </React.Fragment>
      ))}
      {/* Separator positioned at the junction between sections */}
      {sections.length > 1 && (
        <div 
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{ 
            top: `${sections[0].height}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <img 
            src={sectionSeparator} 
            alt="" 
            className="w-full"
            style={{ 
              display: 'block',
              height: 'auto',
            }}
          />
        </div>
      )}
    </div>
  );
};
