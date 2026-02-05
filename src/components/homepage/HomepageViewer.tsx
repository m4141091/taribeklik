import React from 'react';
import { usePublicHomepageElements } from '@/hooks/useHomepageElements';
import { HomepageElementRenderer } from './HomepageElementRenderer';

export const HomepageViewer: React.FC = () => {
  const { elements, loading } = usePublicHomepageElements();

  console.log('HomepageViewer - loading:', loading);
  console.log('HomepageViewer - elements count:', elements.length);
  console.log('HomepageViewer - elements:', elements);

  if (loading) {
    console.log('HomepageViewer - still loading...');
    return null;
  }

  console.log('Container rendering with', elements.length, 'elements');

  return (
    <div className="relative h-full w-full mx-auto" style={{ maxWidth: '1200px' }}>
      {elements.map((element) => {
        console.log('Rendering element:', element.id, element.element_type, 'at', element.position_x + '%', element.position_y + '%');
        return (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: `${element.position_x}%`,
              top: `${element.position_y}%`,
              transform: 'translate(-50%, -50%)',
              width: element.width,
              height: element.height,
              zIndex: element.z_index,
            }}
          >
            <HomepageElementRenderer element={element} />
          </div>
        );
      })}
    </div>
  );
};
