import React, { useRef, useState } from 'react';
import { useHomepageElements } from '@/hooks/useHomepageElements';
import { HomepageElement, HomepageElementType } from '@/types/homepage';
import { ElementToolbar } from '@/components/homepage/editor/ElementToolbar';
import { ElementPropertiesPanel } from '@/components/homepage/editor/ElementPropertiesPanel';
import { DraggableElement } from '@/components/homepage/editor/DraggableElement';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import homepageBackground from '@/assets/homepage-background.png';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { toast } from 'sonner';

const HomepageEditorContent = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { elements, loading, createElement, updateElement, deleteElement, duplicateElement } = useHomepageElements();
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const selectedElement = elements.find(e => e.id === selectedElementId) || null;

  const handleAddElement = async (type: HomepageElementType) => {
    try {
      const newElement = await createElement(type, 50, 50);
      if (newElement) {
        setSelectedElementId(newElement.id);
        toast.success('אלמנט נוסף בהצלחה');
      }
    } catch (error) {
      console.error('Error creating element:', error);
      toast.error('שגיאה בהוספת אלמנט');
    }
  };

  const handlePositionChange = (id: string, x: number, y: number) => {
    updateElement(id, { position_x: x, position_y: y });
  };

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
      await duplicateElement(id);
      toast.success('אלמנט שוכפל');
    } catch (error) {
      console.error('Error duplicating element:', error);
      toast.error('שגיאה בשכפול אלמנט');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">עורך דף הבית</h1>
        </div>
        <Button onClick={() => navigate('/')} variant="outline">
          צפייה בדף
        </Button>
      </div>

      {/* Toolbar */}
      <ElementToolbar onAddElement={handleAddElement} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-muted p-4">
          <div
            ref={containerRef}
            className="relative mx-auto bg-no-repeat"
            style={{
              width: '1200px',
              height: '6000px',
              backgroundImage: `url(${homepageBackground})`,
              backgroundSize: '100% auto',
              backgroundPosition: 'top center',
            }}
            onClick={() => setSelectedElementId(null)}
          >
            {elements.map((element) => (
              <DraggableElement
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                onClick={() => setSelectedElementId(element.id)}
                onPositionChange={(x, y) => handlePositionChange(element.id, x, y)}
                containerRef={containerRef}
              />
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-background border-r overflow-y-auto">
          <ElementPropertiesPanel
            element={selectedElement}
            onUpdate={updateElement}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
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
