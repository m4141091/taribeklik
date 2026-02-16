import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useHomepageElements } from '@/hooks/useHomepageElements';
import { HomepageElement, HomepageElementType } from '@/types/homepage';
import { ElementToolbar } from '@/components/homepage/editor/ElementToolbar';
import { ElementPropertiesPanel } from '@/components/homepage/editor/ElementPropertiesPanel';
import { DraggableElement } from '@/components/homepage/editor/DraggableElement';
import { ElementsList } from '@/components/homepage/editor/ElementsList';
import { CanvasMinimap } from '@/components/homepage/editor/CanvasMinimap';
import { Button } from '@/components/ui/button';
import { ArrowRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import homepageBackground from '@/assets/homepage-background.png';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBackgroundImageHeight } from '@/hooks/useBackgroundImageHeight';

const CANVAS_WIDTH = 1920;
const VIEWPORT_HEIGHT = 900;

const HomepageEditorContent = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { elements, loading, createElement, updateElement, deleteElement, duplicateElement } = useHomepageElements();
  const BG_HEIGHT = useBackgroundImageHeight(homepageBackground, CANVAS_WIDTH);
  const CANVAS_HEIGHT = BG_HEIGHT + 2000; // Extra scroll space for editing comfort
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [zoom, setZoom] = useState(0.5);

  const editingElement = elements.find(e => e.id === editingElementId) || null;

  const handleAddElement = async (type: HomepageElementType) => {
    try {
      // Calculate position based on current scroll to place in visible area
      const visibleY = (scrollPosition / CANVAS_HEIGHT) * 100 + 10;
      const newElement = await createElement(type, 50, Math.min(visibleY, 95));
      if (newElement) {
        setSelectedElementId(newElement.id);
        toast.success('אלמנט נוסף בהצלחה');
      }
    } catch (error) {
      console.error('Error creating element:', error);
      toast.error('שגיאה בהוספת אלמנט');
    }
  };

  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    updateElement(id, { position_x: x, position_y: y });
  }, [updateElement]);

  const handleSizeChange = useCallback((id: string, width: string, height: string) => {
    updateElement(id, { width, height });
  }, [updateElement]);

  const handleDelete = async (id: string) => {
    try {
      await deleteElement(id);
      setSelectedElementId(null);
      toast.success('אלמנט נמחק');
    } catch (error) {
      console.error('Error deleting element:', error);
      toast.error('שגיאה במחיקת אלמנט');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const newElement = await duplicateElement(id);
      if (newElement) {
        setSelectedElementId(newElement.id);
      }
      toast.success('אלמנט שוכפל');
    } catch (error) {
      console.error('Error duplicating element:', error);
      toast.error('שגיאה בשכפול אלמנט');
    }
  };

  const handleToggleVisibility = (id: string, visible: boolean) => {
    updateElement(id, { is_visible: visible });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition(e.currentTarget.scrollTop);
  };

  const handleMinimapScrollTo = (percentage: number) => {
    if (scrollContainerRef.current) {
      const targetScroll = percentage * CANVAS_HEIGHT * zoom;
      scrollContainerRef.current.scrollTop = targetScroll;
    }
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.2, Math.min(1, prev + delta)));
  };

  const handleFitToScreen = () => {
    setZoom(0.5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-background border-b flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">עורך דף הבית</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={() => handleZoom(-0.1)} className="h-8 w-8">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => handleZoom(0.1)} className="h-8 w-8">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleFitToScreen} className="h-8 w-8">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => navigate('/')} variant="outline" size="sm">
            צפייה בדף
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <ElementToolbar onAddElement={handleAddElement} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - Elements List */}
        <div className="w-64 bg-background border-l flex flex-col flex-shrink-0">
          <div className="flex-1 min-h-0">
            <ElementsList
              elements={elements}
              selectedId={selectedElementId}
              onSelect={setSelectedElementId}
              onToggleVisibility={handleToggleVisibility}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          </div>
          <CanvasMinimap
            elements={elements}
            scrollPosition={scrollPosition}
            totalHeight={CANVAS_HEIGHT * zoom}
            viewportHeight={VIEWPORT_HEIGHT}
            onScrollTo={handleMinimapScrollTo}
          />
        </div>

        {/* Canvas */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative"
          onScroll={handleScroll}
        >
          <div
            style={{
              width: CANVAS_WIDTH * zoom,
              height: CANVAS_HEIGHT * zoom,
              margin: '0 auto',
            }}
          >
            <div
            ref={containerRef}
            className="relative bg-no-repeat"
            style={{
              width: CANVAS_WIDTH,
              height: BG_HEIGHT,
              backgroundImage: `url(${homepageBackground})`,
              backgroundSize: '100% auto',
              backgroundPosition: 'top center',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
              onClick={() => { setSelectedElementId(null); setEditingElementId(null); }}
            >
              {/* Viewport guidelines */}
              <div 
                className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-primary/50 pointer-events-none"
                style={{ height: 900 }}
              >
                <span className="absolute top-2 right-2 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                  אזור נראה (Viewport)
                </span>
              </div>

              {elements.map((element) => (
                <DraggableElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElementId === element.id}
                  onClick={() => { setSelectedElementId(element.id); setEditingElementId(element.id); }}
                  onPositionChange={(x, y) => handlePositionChange(element.id, x, y)}
                  onSizeChange={(w, h) => handleSizeChange(element.id, w, h)}
                  containerRef={containerRef}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel (slides in when element selected) */}
        <div
          className={`bg-background border-r flex-shrink-0 transition-all duration-300 overflow-hidden ${
            editingElement ? 'w-80' : 'w-0'
          }`}
        >
          <div className="w-80">
            <ScrollArea className="h-full">
              <ElementPropertiesPanel
                element={editingElement}
                onUpdate={updateElement}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomepageEditor = () => {
  return (
    <AdminGuard>
      <HomepageEditorContent />
    </AdminGuard>
  );
};

export default HomepageEditor;
