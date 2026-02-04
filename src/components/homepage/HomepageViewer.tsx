import React from 'react';
import { usePublicHomepageElements } from '@/hooks/useHomepageElements';
import { HomepageElementRenderer } from './HomepageElementRenderer';

export const HomepageViewer: React.FC = () => {
  const { elements, loading } = usePublicHomepageElements();

  if (loading) {
    return null;
  }

  return (
    <div className="relative h-full mx-auto" style={{ maxWidth: '1200px' }}>
      {elements.map((element) => (
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
      ))}
    </div>
  );
};
