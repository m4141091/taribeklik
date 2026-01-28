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

  // Calculate cumulative heights for positioning
  const getCumulativeHeight = (upToIndex: number) => {
    return sections.slice(0, upToIndex).reduce((acc, s) => acc + s.height, 0);
  };

  return (
    <div className="relative overflow-hidden">
      {sections.map((section, index) => {
        const topPosition = getCumulativeHeight(index);
        
        return (
          <React.Fragment key={section.id}>
            <SectionViewer section={section} />
          </React.Fragment>
        );
      })}
      
      {/* Separators between consecutive sections - positioned on top of section backgrounds */}
      {sections.slice(0, -1).map((section, index) => {
        const nextSection = sections[index + 1];
        const junctionTop = getCumulativeHeight(index + 1);
        
        return (
          <React.Fragment key={`separator-${section.id}`}>
            {/* First section background extension - extends DOWN to cover separator area */}
            <div 
              className="absolute left-0 right-0"
              style={{
                top: `${junctionTop - 100}px`,
                height: '120px',
                zIndex: 5,
                backgroundColor: section.background_color || 'transparent',
                backgroundImage: section.background_image_url 
                  ? `url(${section.background_image_url})` 
                  : undefined,
                backgroundSize: section.background_size || 'cover',
                backgroundPosition: 'center bottom',
              }}
            />
            
            {/* Second section background extension - extends UP to meet separator */}
            <div 
              className="absolute left-0 right-0"
              style={{
                top: `${junctionTop - 20}px`,
                height: '120px',
                zIndex: 6,
                backgroundColor: nextSection.background_color || 'transparent',
              }}
            />
            
            {/* Torn paper separator - sits exactly at junction with high z-index */}
            <div 
              className="absolute left-0 right-0 pointer-events-none"
              style={{ 
                top: `${junctionTop}px`,
                transform: 'translateY(-50%)',
                zIndex: 20,
              }}
            >
              <img 
                src={sectionSeparator} 
                alt="" 
                style={{ 
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                }}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
