import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { supabase } from '@/integrations/supabase/client';
import { Section, SectionElement, ElementType } from '@/types/section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowRight, 
  Save, 
  Eye, 
  Type, 
  Heading1, 
  MousePointer, 
  Image, 
  Search,
  Trash2,
  Settings,
  Move
} from 'lucide-react';

const ELEMENT_DEFAULTS: Record<ElementType, Partial<SectionElement>> = {
  heading: {
    content: 'כותרת חדשה',
    size: { width: 300, height: 60 },
    styles: { fontSize: 48, fontFamily: 'discovery', color: '#193017', textAlign: 'center' },
  },
  text: {
    content: 'טקסט חדש',
    size: { width: 300, height: 40 },
    styles: { fontSize: 18, fontFamily: 'discovery', color: '#193017', textAlign: 'right' },
  },
  button: {
    content: 'לחץ כאן',
    size: { width: 150, height: 50 },
    styles: { fontSize: 16, backgroundColor: '#F25F40', color: '#ffffff', borderRadius: 8 },
    link: '#',
  },
  image: {
    content: '',
    size: { width: 200, height: 200 },
    styles: { borderRadius: 0 },
  },
  search: {
    content: 'חיפוש...',
    size: { width: 300, height: 50 },
    styles: { fontSize: 16, backgroundColor: '#ffffff', borderRadius: 25 },
  },
};

const BuilderContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [section, setSection] = useState<Section | null>(null);
  const [elements, setElements] = useState<SectionElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Drag state
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Fetch section
  useEffect(() => {
    const fetchSection = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('sections')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        const parsedSection: Section = {
          ...data,
          elements: (data.elements as unknown as SectionElement[]) || [],
        };

        setSection(parsedSection);
        setElements(parsedSection.elements);
        setCanvasHeight(parsedSection.height);
        setBackgroundColor(parsedSection.background_color || '#ffffff');
        setBackgroundImage(parsedSection.background_image_url);
      } catch (error) {
        console.error('Error fetching section:', error);
        toast({
          title: 'שגיאה',
          description: 'שגיאה בטעינת הסקשן',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSection();
  }, [id, toast]);

  // Add element
  const addElement = (type: ElementType) => {
    const defaults = ELEMENT_DEFAULTS[type];
    const newElement: SectionElement = {
      id: crypto.randomUUID(),
      type,
      position: { x: 50, y: 50 }, // Center
      size: defaults.size || { width: 200, height: 50 },
      content: defaults.content || '',
      styles: defaults.styles || {},
      link: defaults.link,
      zIndex: elements.length + 1,
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    setElements(elements.filter((el) => el.id !== elementId));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  // Update element
  const updateElement = (elementId: string, updates: Partial<SectionElement>) => {
    setElements(elements.map((el) => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  // Handle mouse down on element
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    const element = elements.find((el) => el.id === elementId);
    if (!element || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const elementX = (element.position.x / 100) * canvasRect.width;
    const elementY = (element.position.y / 100) * canvasRect.height;

    setDragOffset({
      x: e.clientX - canvasRect.left - elementX,
      y: e.clientY - canvasRect.top - elementY,
    });
    setDragging(elementId);
    setSelectedElement(elementId);
  };

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - canvasRect.left - dragOffset.x) / canvasRect.width) * 100;
    const y = ((e.clientY - canvasRect.top - dragOffset.y) / canvasRect.height) * 100;

    // Clamp values
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    updateElement(dragging, { position: { x: clampedX, y: clampedY } });
  }, [dragging, dragOffset]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Add global mouse listeners
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Save section
  const saveSection = async () => {
    if (!id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('sections')
        .update({
          height: canvasHeight,
          background_color: backgroundColor,
          background_image_url: backgroundImage,
          elements: JSON.parse(JSON.stringify(elements)),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'נשמר!',
        description: 'הסקשן נשמר בהצלחה',
      });
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בשמירת הסקשן',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Upload background image
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}/background.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('section-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('section-assets')
        .getPublicUrl(fileName);

      setBackgroundImage(publicUrl);
      toast({ title: 'רקע הועלה בהצלחה!' });
    } catch (error) {
      console.error('Error uploading background:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהעלאת הרקע',
        variant: 'destructive',
      });
    }
  };

  // Upload image for image element
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, elementId: string) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}/${elementId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('section-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('section-assets')
        .getPublicUrl(fileName);

      updateElement(elementId, { content: publicUrl });
      toast({ title: 'תמונה הועלתה בהצלחה!' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהעלאת התמונה',
        variant: 'destructive',
      });
    }
  };

  const selectedEl = elements.find((el) => el.id === selectedElement);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            {section?.name || 'עריכת סקשן'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open(`/?preview=${id}`, '_blank')}>
            <Eye className="w-4 h-4 ml-2" />
            תצוגה מקדימה
          </Button>
          <Button onClick={saveSection} disabled={saving}>
            <Save className="w-4 h-4 ml-2" />
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbox */}
        <aside className="w-64 bg-card border-l border-border p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4 text-foreground">הוסף אלמנט</h2>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => addElement('heading')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Heading1 className="w-6 h-6 text-foreground" />
              <span className="text-sm">כותרת</span>
            </button>
            <button
              onClick={() => addElement('text')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Type className="w-6 h-6 text-foreground" />
              <span className="text-sm">טקסט</span>
            </button>
            <button
              onClick={() => addElement('button')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <MousePointer className="w-6 h-6 text-foreground" />
              <span className="text-sm">כפתור</span>
            </button>
            <button
              onClick={() => addElement('image')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Image className="w-6 h-6 text-foreground" />
              <span className="text-sm">תמונה</span>
            </button>
            <button
              onClick={() => addElement('search')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted transition-colors col-span-2"
            >
              <Search className="w-6 h-6 text-foreground" />
              <span className="text-sm">שדה חיפוש</span>
            </button>
          </div>

          <h2 className="font-semibold mb-4 text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4" />
            הגדרות קנבס
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">גובה (פיקסלים)</label>
              <Input
                type="number"
                value={canvasHeight}
                onChange={(e) => setCanvasHeight(Number(e.target.value))}
                min={200}
                max={2000}
              />
            </div>
            <div>
              <label className="block text-sm mb-2">צבע רקע</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">תמונת רקע</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
              />
              {backgroundImage && (
                <button
                  onClick={() => setBackgroundImage(null)}
                  className="text-sm text-destructive mt-2 hover:underline"
                >
                  הסר רקע
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 p-8 overflow-auto flex items-start justify-center">
          <div
            ref={canvasRef}
            className="relative border-2 border-dashed border-border bg-white shadow-lg"
            style={{
              width: '100%',
              maxWidth: '1200px',
              height: `${canvasHeight}px`,
              backgroundColor,
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={() => setSelectedElement(null)}
          >
            {elements.map((el) => (
              <div
                key={el.id}
                className={`absolute cursor-move select-none ${
                  selectedElement === el.id ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                style={{
                  left: `${el.position.x}%`,
                  top: `${el.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: el.size.width,
                  height: el.size.height,
                  zIndex: el.zIndex || 1,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, el.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement(el.id);
                }}
              >
                {/* Element Content */}
                {el.type === 'heading' && (
                  <h2
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      fontSize: el.styles.fontSize,
                      fontFamily: el.styles.fontFamily === 'cooperative' ? 'Cooperative' : 
                                  el.styles.fontFamily === 'script' ? 'Script' : 'Discovery',
                      color: el.styles.color,
                      textAlign: el.styles.textAlign,
                    }}
                  >
                    {el.content}
                  </h2>
                )}
                {el.type === 'text' && (
                  <p
                    className="w-full h-full flex items-center"
                    style={{
                      fontSize: el.styles.fontSize,
                      fontFamily: el.styles.fontFamily === 'cooperative' ? 'Cooperative' : 
                                  el.styles.fontFamily === 'script' ? 'Script' : 'Discovery',
                      color: el.styles.color,
                      textAlign: el.styles.textAlign,
                    }}
                  >
                    {el.content}
                  </p>
                )}
                {el.type === 'button' && (
                  <button
                    className="w-full h-full flex items-center justify-center transition-opacity hover:opacity-90"
                    style={{
                      fontSize: el.styles.fontSize,
                      backgroundColor: el.styles.backgroundColor,
                      color: el.styles.color,
                      borderRadius: el.styles.borderRadius,
                    }}
                  >
                    {el.content}
                  </button>
                )}
                {el.type === 'image' && (
                  <div className="w-full h-full bg-muted flex items-center justify-center overflow-hidden">
                    {el.content ? (
                      <img
                        src={el.content}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ borderRadius: el.styles.borderRadius }}
                      />
                    ) : (
                      <Image className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                )}
                {el.type === 'search' && (
                  <div
                    className="w-full h-full flex items-center px-4 border border-border"
                    style={{
                      backgroundColor: el.styles.backgroundColor,
                      borderRadius: el.styles.borderRadius,
                    }}
                  >
                    <Search className="w-5 h-5 text-muted-foreground ml-2" />
                    <span className="text-muted-foreground">{el.content}</span>
                  </div>
                )}

                {/* Drag Handle Indicator */}
                {selectedElement === el.id && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded p-1">
                    <Move className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* Settings Panel */}
        {selectedEl && (
          <aside className="w-72 bg-card border-r border-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">הגדרות אלמנט</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteElement(selectedEl.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Content */}
              {selectedEl.type !== 'image' && (
                <div>
                  <label className="block text-sm mb-2">תוכן</label>
                  <Input
                    value={selectedEl.content}
                    onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                  />
                </div>
              )}

              {/* Image Upload */}
              {selectedEl.type === 'image' && (
                <div>
                  <label className="block text-sm mb-2">תמונה</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, selectedEl.id)}
                  />
                </div>
              )}

              {/* Link for buttons */}
              {selectedEl.type === 'button' && (
                <div>
                  <label className="block text-sm mb-2">קישור</label>
                  <Input
                    value={selectedEl.link || ''}
                    onChange={(e) => updateElement(selectedEl.id, { link: e.target.value })}
                    dir="ltr"
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-2">רוחב</label>
                  <Input
                    type="number"
                    value={selectedEl.size.width}
                    onChange={(e) => updateElement(selectedEl.id, {
                      size: { ...selectedEl.size, width: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">גובה</label>
                  <Input
                    type="number"
                    value={selectedEl.size.height}
                    onChange={(e) => updateElement(selectedEl.id, {
                      size: { ...selectedEl.size, height: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>

              {/* Font Size */}
              {(selectedEl.type === 'heading' || selectedEl.type === 'text' || selectedEl.type === 'button') && (
                <div>
                  <label className="block text-sm mb-2">גודל גופן</label>
                  <Input
                    type="number"
                    value={selectedEl.styles.fontSize || 16}
                    onChange={(e) => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, fontSize: Number(e.target.value) }
                    })}
                  />
                </div>
              )}

              {/* Font Family */}
              {(selectedEl.type === 'heading' || selectedEl.type === 'text') && (
                <div>
                  <label className="block text-sm mb-2">גופן</label>
                  <select
                    value={selectedEl.styles.fontFamily || 'discovery'}
                    onChange={(e) => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, fontFamily: e.target.value as 'discovery' | 'cooperative' | 'script' }
                    })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                  >
                    <option value="discovery">Discovery</option>
                    <option value="cooperative">Cooperative</option>
                    <option value="script">Script</option>
                  </select>
                </div>
              )}

              {/* Text Color */}
              {(selectedEl.type === 'heading' || selectedEl.type === 'text' || selectedEl.type === 'button') && (
                <div>
                  <label className="block text-sm mb-2">צבע טקסט</label>
                  <input
                    type="color"
                    value={selectedEl.styles.color || '#000000'}
                    onChange={(e) => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, color: e.target.value }
                    })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Background Color */}
              {(selectedEl.type === 'button' || selectedEl.type === 'search') && (
                <div>
                  <label className="block text-sm mb-2">צבע רקע</label>
                  <input
                    type="color"
                    value={selectedEl.styles.backgroundColor || '#ffffff'}
                    onChange={(e) => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, backgroundColor: e.target.value }
                    })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Text Align */}
              {(selectedEl.type === 'heading' || selectedEl.type === 'text') && (
                <div>
                  <label className="block text-sm mb-2">יישור</label>
                  <select
                    value={selectedEl.styles.textAlign || 'center'}
                    onChange={(e) => updateElement(selectedEl.id, {
                      styles: { ...selectedEl.styles, textAlign: e.target.value as 'right' | 'center' | 'left' }
                    })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                  >
                    <option value="right">ימין</option>
                    <option value="center">מרכז</option>
                    <option value="left">שמאל</option>
                  </select>
                </div>
              )}

              {/* Border Radius */}
              <div>
                <label className="block text-sm mb-2">עיגול פינות</label>
                <Input
                  type="number"
                  value={selectedEl.styles.borderRadius || 0}
                  onChange={(e) => updateElement(selectedEl.id, {
                    styles: { ...selectedEl.styles, borderRadius: Number(e.target.value) }
                  })}
                  min={0}
                />
              </div>

              {/* Z-Index */}
              <div>
                <label className="block text-sm mb-2">שכבה (Z-Index)</label>
                <Input
                  type="number"
                  value={selectedEl.zIndex || 1}
                  onChange={(e) => updateElement(selectedEl.id, { zIndex: Number(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

const SectionBuilder = () => {
  return (
    <AdminGuard>
      <BuilderContent />
    </AdminGuard>
  );
};

export default SectionBuilder;
