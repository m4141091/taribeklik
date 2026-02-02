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
      
      {/* Separators between consecutive sections */}
      {sections.slice(0, -1).map((section, index) => {
        const junctionTop = getCumulativeHeight(index + 1);
        
        return (
          <div 
            key={`separator-${section.id}`}
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
        );
      })}
    </div>
  );
};
