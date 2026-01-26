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
          {/* Separator positioned at the top of the second section */}
          {index === 1 && (
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
                className="w-full h-auto"
                style={{ display: 'block' }}
              />
            </div>
          )}
          <SectionViewer section={section} />
        </React.Fragment>
      ))}
    </div>
  );
};
