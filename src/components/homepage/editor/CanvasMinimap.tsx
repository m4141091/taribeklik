import React from 'react';
import { HomepageElement } from '@/types/homepage';

interface CanvasMinimapProps {
  elements: HomepageElement[];
  scrollPosition: number;
  totalHeight: number;
  viewportHeight: number;
  onScrollTo: (percentage: number) => void;
}

export const CanvasMinimap: React.FC<CanvasMinimapProps> = ({
  elements,
  scrollPosition,
  totalHeight,
  viewportHeight,
  onScrollTo,
}) => {
  const minimapHeight = 200;
  const scale = minimapHeight / totalHeight;
  const viewportIndicatorHeight = Math.max((viewportHeight / totalHeight) * minimapHeight, 20);
  const viewportPosition = scrollPosition * scale;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = clickY / minimapHeight;
    onScrollTo(percentage);
  };

  return (
    <div className="p-3 border-t">
      <h4 className="text-xs font-medium mb-2">מפת ניווט</h4>
      <div
        className="relative bg-muted rounded cursor-pointer border"
        style={{ height: minimapHeight }}
        onClick={handleClick}
      >
        {/* Elements dots */}
        {elements.filter(e => e.is_visible).map((element) => (
          <div
            key={element.id}
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{
              left: `${element.position_x}%`,
              top: `${element.position_y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            title={element.name || element.element_type}
          />
        ))}
        
        {/* Viewport indicator */}
        <div
          className="absolute left-0 right-0 bg-primary/20 border border-primary/50 rounded"
          style={{
            top: viewportPosition,
            height: viewportIndicatorHeight,
          }}
        />
      </div>
      <div className="mt-2 text-xs text-muted-foreground text-center">
        {Math.round((scrollPosition / totalHeight) * 100)}%
      </div>
    </div>
  );
};
