import React, { useRef, useState, useEffect, useCallback } from 'react';
import { HomepageElement } from '@/types/homepage';
import { HomepageElementRenderer } from '../HomepageElementRenderer';

interface DraggableElementProps {
  element: HomepageElement;
  isSelected: boolean;
  onClick: () => void;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange?: (width: string, height: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  isSelected,
  onClick,
  onPositionChange,
  onSizeChange,
  containerRef,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });

  const parseSize = (size: string): number => {
    return parseInt(size.replace(/[^0-9]/g, ''), 10) || 100;
  };

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

  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    onClick();
    
    setIsResizing(handle);
    setInitialSize({
      width: parseSize(element.width),
      height: parseSize(element.height),
    });
    setInitialPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = ((e.clientX - containerRect.left - dragOffset.x) / containerRect.width) * 100;
      const newY = ((e.clientY - containerRect.top - dragOffset.y) / containerRect.height) * 100;
      
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

  useEffect(() => {
    if (!isResizing || !onSizeChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - initialPos.x;
      const deltaY = e.clientY - initialPos.y;
      
      let newWidth = initialSize.width;
      let newHeight = initialSize.height;
      
      // Handle different resize directions
      if (isResizing.includes('e')) {
        newWidth = Math.max(50, initialSize.width + deltaX);
      }
      if (isResizing.includes('w')) {
        newWidth = Math.max(50, initialSize.width - deltaX);
      }
      if (isResizing.includes('s')) {
        newHeight = Math.max(30, initialSize.height + deltaY);
      }
      if (isResizing.includes('n')) {
        newHeight = Math.max(30, initialSize.height - deltaY);
      }
      
      onSizeChange(`${Math.round(newWidth)}px`, `${Math.round(newHeight)}px`);
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, initialSize, initialPos, onSizeChange]);

  const resizeHandleClass = "absolute w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm";

  return (
    <div
      ref={elementRef}
      className={`absolute transition-shadow ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${isDragging ? 'opacity-80 cursor-grabbing' : 'cursor-grab'}`}
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
          {/* Corner handles */}
          <div 
            className={`${resizeHandleClass} -top-1.5 -left-1.5 cursor-nw-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div 
            className={`${resizeHandleClass} -top-1.5 -right-1.5 cursor-ne-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div 
            className={`${resizeHandleClass} -bottom-1.5 -left-1.5 cursor-sw-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div 
            className={`${resizeHandleClass} -bottom-1.5 -right-1.5 cursor-se-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          {/* Edge handles */}
          <div 
            className={`${resizeHandleClass} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div 
            className={`${resizeHandleClass} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize`}
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div 
            className={`${resizeHandleClass} top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div 
            className={`${resizeHandleClass} top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
          
          {/* Position indicator */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded whitespace-nowrap">
            {Math.round(element.position_x)}%, {Math.round(element.position_y)}%
          </div>
        </>
      )}
    </div>
  );
};
