import React from 'react';
import { useActiveSections } from '@/hooks/useSections';
import { SectionViewer } from './SectionViewer';

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
        <SectionViewer 
          key={section.id} 
          section={section} 
          showTopSeparator={index > 0}
        />
      ))}
    </>
  );
};
