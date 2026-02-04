import React, { useRef, useState, useEffect } from 'react';
import { HomepageElement } from '@/types/homepage';
import { HomepageElementRenderer } from '../HomepageElementRenderer';

interface DraggableElementProps {
  element: HomepageElement;
  isSelected: boolean;
  onClick: () => void;
  onPositionChange: (x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  isSelected,
  onClick,
  onPositionChange,
  containerRef,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    
    if (!elementRef.current || !containerRef.current) return;
    
    const rect = elementRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = ((e.clientX - containerRect.left - dragOffset.x) / containerRect.width) * 100;
      const newY = ((e.clientY - containerRect.top - dragOffset.y) / containerRect.height) * 100;
      
      // Clamp values between 0 and 100
      const clampedX = Math.max(0, Math.min(100, newX));
      const clampedY = Math.max(0, Math.min(100, newY));
      
      onPositionChange(clampedX, clampedY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, containerRef, onPositionChange]);

  return (
    <div
      ref={elementRef}
      className={`absolute cursor-move transition-shadow ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${isDragging ? 'opacity-80' : ''}`}
      style={{
        left: `${element.position_x}%`,
        top: `${element.position_y}%`,
        transform: 'translate(-50%, -50%)',
        width: element.width,
        height: element.height,
        zIndex: element.z_index + (isSelected ? 1000 : 0),
      }}
      onMouseDown={handleMouseDown}
    >
      <HomepageElementRenderer element={element} />
      
      {/* Resize handles - shown when selected */}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize" />
        </>
      )}
    </div>
  );
};
