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
    <>
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          <SectionViewer section={section} />
          {/* Separator between first and second section */}
          {index === 0 && sections.length > 1 && (
            <div className="w-full relative" style={{ marginTop: '-60px', zIndex: 10 }}>
              <img 
                src={sectionSeparator} 
                alt="" 
                className="w-full h-auto"
                style={{ display: 'block' }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
};
