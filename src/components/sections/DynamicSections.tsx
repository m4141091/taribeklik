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
    <div className="relative">
      {sections.map((section, index) => {
        const topPosition = getCumulativeHeight(index);
        
        return (
          <React.Fragment key={section.id}>
            <SectionViewer section={section} />
          </React.Fragment>
        );
      })}
      
      {/* Background overlaps and separators between consecutive sections */}
      {sections.slice(0, -1).map((section, index) => {
        const nextSection = sections[index + 1];
        const junctionTop = getCumulativeHeight(index + 1);
        
        return (
          <React.Fragment key={`separator-${section.id}`}>
            {/* First section background extension (below its natural end) */}
            <div 
              className="absolute left-0 right-0"
              style={{
                top: `${junctionTop - 60}px`,
                height: '80px',
                zIndex: 5,
                backgroundColor: section.background_color || 'transparent',
                backgroundImage: section.background_image_url 
                  ? `url(${section.background_image_url})` 
                  : undefined,
                backgroundSize: section.background_size || 'cover',
                backgroundPosition: 'center bottom',
              }}
            />
            
            {/* Second section background extension (above its natural start) */}
            <div 
              className="absolute left-0 right-0"
              style={{
                top: `${junctionTop - 30}px`,
                height: '80px',
                zIndex: 6,
                backgroundColor: nextSection.background_color || 'transparent',
              }}
            />
            
            {/* Torn paper separator image */}
            <div 
              className="absolute left-0 right-0 pointer-events-none"
              style={{ 
                top: `${junctionTop}px`,
                transform: 'translateY(-50%)',
                zIndex: 20,
                marginLeft: '-2px',
                marginRight: '-2px',
                width: 'calc(100% + 4px)',
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
