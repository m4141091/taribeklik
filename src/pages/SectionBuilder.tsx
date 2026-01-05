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
  Move,
  SeparatorHorizontal,
  Maximize,
  Minimize,
  Grid3X3,
  AlignCenter
} from 'lucide-react';

const ELEMENT_DEFAULTS: Record<ElementType, Partial<SectionElement>> = {
  heading: {
    content: 'כותרת חדשה',
    size: { width: 300, height: 60 },
    styles: { fontSize: 48, fontFamily: 'discovery', color: '#193017', textAlign: 'center' },
    effects: { typewriter: false, typewriterSpeed: 100, typewriterDelay: 500 },
  },
  text: {
    content: 'טקסט חדש',
    size: { width: 300, height: 40 },
    styles: { fontSize: 18, fontFamily: 'discovery', color: '#193017', textAlign: 'right' },
    effects: { typewriter: false, typewriterSpeed: 100, typewriterDelay: 500 },
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
    styles: { borderRadius: 0, objectFit: 'contain', opacity: 100 },
  },
  search: {
    content: 'חיפוש...',
    size: { width: 300, height: 50 },
    styles: { fontSize: 16, backgroundColor: '#ffffff', borderRadius: 25 },
  },
  separator: {
    content: '',
    size: { width: 1200, height: 80 },
    styles: {},
  },
};

const BuilderContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [section, setSection] = useState<Section | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [elements, setElements] = useState<SectionElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [activeTab, setActiveTab] = useState<'elements' | 'settings'>('elements');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Drag state
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // View modes
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showMargins, setShowMargins] = useState(false);

  // Resize state
  const [resizing, setResizing] = useState<{
    elementId: string;
    handle: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's';
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

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
        setSectionName(parsedSection.name);
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
      effects: defaults.effects,
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

  // Resize handlers
  const startResize = (e: React.MouseEvent, elementId: string, handle: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's') => {
    e.stopPropagation();
    e.preventDefault();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    setResizing({
      elementId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.size.width,
      startHeight: element.size.height,
    });
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizing) return;
    
    const deltaX = e.clientX - resizing.startX;
    const deltaY = e.clientY - resizing.startY;
    
    let newWidth = resizing.startWidth;
    let newHeight = resizing.startHeight;
    
    // Calculate new size based on which handle is being dragged
    if (resizing.handle.includes('e')) newWidth = resizing.startWidth + deltaX;
    if (resizing.handle.includes('w')) newWidth = resizing.startWidth - deltaX;
    if (resizing.handle.includes('s')) newHeight = resizing.startHeight + deltaY;
    if (resizing.handle.includes('n')) newHeight = resizing.startHeight - deltaY;
    
    // Minimum size
    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(30, newHeight);
    
    updateElement(resizing.elementId, { 
      size: { width: newWidth, height: newHeight } 
    });
  }, [resizing, updateElement]);

  const handleResizeUp = useCallback(() => {
    setResizing(null);
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

  // Add resize mouse listeners
  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeUp);
    };
  }, [resizing, handleResizeMove, handleResizeUp]);

  // Save section
  const saveSection = async () => {
    if (!id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('sections')
        .update({
          name: sectionName,
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
      
      // Save directly to database
      const { error: updateError } = await supabase
        .from('sections')
        .update({ background_image_url: publicUrl })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      toast({ title: 'רקע הועלה ונשמר בהצלחה!' });
    } catch (error) {
      console.error('Error uploading background:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהעלאת הרקע',
        variant: 'destructive',
      });
    }
  };

  // Remove background image
  const handleRemoveBackground = async () => {
    if (!id) return;
    
    try {
      setBackgroundImage(null);
      
      const { error } = await supabase
        .from('sections')
        .update({ background_image_url: null })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: 'רקע הוסר בהצלחה' });
    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהסרת הרקע',
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
          <Input
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus-visible:ring-1 max-w-xs"
            placeholder="שם הסקשן"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border-l border-border pl-2 ml-2">
            <Button 
              variant={fullScreenMode ? "default" : "outline"} 
              size="icon"
              onClick={() => setFullScreenMode(!fullScreenMode)}
              title="מסך מלא"
            >
              {fullScreenMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            <Button 
              variant={showGrid ? "default" : "outline"} 
              size="icon"
              onClick={() => setShowGrid(!showGrid)}
              title="רשת גריד"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button 
              variant={showMargins ? "default" : "outline"} 
              size="icon"
              onClick={() => setShowMargins(!showMargins)}
              title="קווי שוליים"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
          </div>
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
        {/* Toolbox with Tabs */}
        <aside className="w-72 bg-card border-l border-border flex flex-col overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-border shrink-0">
            <button 
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'elements' 
                  ? 'border-b-2 border-primary text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('elements')}
            >
              אלמנטים
            </button>
            <button 
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'settings' 
                  ? 'border-b-2 border-primary text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              הגדרות
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Elements Tab */}
            {activeTab === 'elements' && (
              <>
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
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Search className="w-6 h-6 text-foreground" />
                    <span className="text-sm">שדה חיפוש</span>
                  </button>
                  <button
                    onClick={() => addElement('separator')}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <SeparatorHorizontal className="w-6 h-6 text-foreground" />
                    <span className="text-sm">מפריד</span>
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
                        onClick={handleRemoveBackground}
                        className="text-sm text-destructive mt-2 hover:underline"
                      >
                        הסר רקע
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <>
                {selectedEl ? (
                  <>
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
                      {selectedEl.type !== 'image' && selectedEl.type !== 'separator' && (
                        <div>
                          <label className="block text-sm mb-2">תוכן</label>
                          <Input
                            value={selectedEl.content}
                            onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                          />
                        </div>
                      )}

                      {/* Image Upload & Settings */}
                      {(selectedEl.type === 'image' || selectedEl.type === 'separator') && (
                        <>
                          {/* Image Preview */}
                          {selectedEl.content && (
                            <div className="mb-4">
                              <label className="block text-sm mb-2">תצוגה מקדימה</label>
                              <div className="w-full h-24 bg-muted rounded overflow-hidden border border-border">
                                <img 
                                  src={selectedEl.content} 
                                  alt="תצוגה מקדימה" 
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <label className="block text-sm mb-2">
                              {selectedEl.content ? 'החלף תמונה' : 'העלה תמונה'}
                            </label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, selectedEl.id)}
                            />
                          </div>
                          
                          {/* Remove Image Button */}
                          {selectedEl.content && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => updateElement(selectedEl.id, { content: '' })}
                            >
                              הסר תמונה
                            </Button>
                          )}
                          
                          {/* Image URL Input */}
                          <div>
                            <label className="block text-sm mb-2">או הזן URL</label>
                            <Input
                              value={selectedEl.content || ''}
                              onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                              dir="ltr"
                              placeholder="https://..."
                            />
                          </div>
                        </>
                      )}

                      {/* Image Advanced Settings */}
                      {selectedEl.type === 'image' && (
                        <>
                          <div>
                            <label className="block text-sm mb-2">התאמת תמונה</label>
                            <select
                              value={selectedEl.styles.objectFit || 'contain'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                styles: { ...selectedEl.styles, objectFit: e.target.value as 'cover' | 'contain' | 'fill' | 'none' }
                              })}
                              className="w-full h-10 rounded-md border border-input bg-background px-3"
                            >
                              <option value="contain">התאם (Contain) - שומר פרופורציות</option>
                              <option value="cover">מילוי (Cover) - חותך במידת הצורך</option>
                              <option value="fill">מתיחה (Fill) - ממלא הכל</option>
                              <option value="none">מקורי (None) - גודל מקורי</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm mb-2">מיקום תמונה</label>
                            <select
                              value={selectedEl.styles.objectPosition || 'center'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                styles: { ...selectedEl.styles, objectPosition: e.target.value }
                              })}
                              className="w-full h-10 rounded-md border border-input bg-background px-3"
                            >
                              <option value="center">מרכז</option>
                              <option value="top">למעלה</option>
                              <option value="bottom">למטה</option>
                              <option value="left">שמאל</option>
                              <option value="right">ימין</option>
                              <option value="top left">למעלה שמאל</option>
                              <option value="top right">למעלה ימין</option>
                              <option value="bottom left">למטה שמאל</option>
                              <option value="bottom right">למטה ימין</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm mb-2">
                              שקיפות: {selectedEl.styles.opacity ?? 100}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedEl.styles.opacity ?? 100}
                              onChange={(e) => updateElement(selectedEl.id, {
                                styles: { ...selectedEl.styles, opacity: Number(e.target.value) }
                              })}
                              className="w-full"
                            />
                          </div>
                        </>
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

                      {/* Typewriter Effect */}
                      {(selectedEl.type === 'heading' || selectedEl.type === 'text') && (
                        <div className="border-t border-border pt-4 mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium">אפקט טייפינג</label>
                            <button
                              type="button"
                              onClick={() => updateElement(selectedEl.id, {
                                effects: { ...selectedEl.effects, typewriter: !selectedEl.effects?.typewriter }
                              })}
                              className={`w-10 h-5 rounded-full transition-colors ${
                                selectedEl.effects?.typewriter ? 'bg-primary' : 'bg-muted'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                  selectedEl.effects?.typewriter ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                          
                          {selectedEl.effects?.typewriter && (
                            <>
                              <div className="mb-3">
                                <label className="block text-sm mb-2">
                                  מהירות כתיבה: {selectedEl.effects?.typewriterSpeed || 100}ms
                                </label>
                                <input
                                  type="range"
                                  min="30"
                                  max="300"
                                  value={selectedEl.effects?.typewriterSpeed || 100}
                                  onChange={(e) => updateElement(selectedEl.id, {
                                    effects: { ...selectedEl.effects, typewriterSpeed: Number(e.target.value) }
                                  })}
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="block text-sm mb-2">
                                  השהיה לפני התחלה: {((selectedEl.effects?.typewriterDelay || 500) / 1000).toFixed(1)} שניות
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="3000"
                                  step="100"
                                  value={selectedEl.effects?.typewriterDelay || 500}
                                  onChange={(e) => updateElement(selectedEl.id, {
                                    effects: { ...selectedEl.effects, typewriterDelay: Number(e.target.value) }
                                  })}
                                  className="w-full"
                                />
                              </div>
                            </>
                          )}
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
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>בחר אלמנט לעריכה</p>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main className={`flex-1 overflow-auto ${fullScreenMode ? '' : 'p-8 flex items-start justify-center'}`}>
          <div
            ref={canvasRef}
            className="relative border-2 border-dashed border-border bg-white shadow-lg"
            style={{
              width: '100%',
              maxWidth: fullScreenMode ? 'none' : '1200px',
              height: `${canvasHeight}px`,
              backgroundColor,
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={() => setSelectedElement(null)}
          >
            {/* Grid Overlay */}
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none z-50"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '50px 50px'
                }}
              />
            )}
            
            {/* Margin Lines */}
            {showMargins && (
              <>
                <div 
                  className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-50"
                  style={{ left: '150px' }}
                />
                <div 
                  className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-50"
                  style={{ right: '150px' }}
                />
              </>
            )}
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
                  setActiveTab('settings');
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
                  <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    {el.content ? (
                      <img
                        src={el.content}
                        alt=""
                        className="w-full h-full"
                        style={{ 
                          borderRadius: el.styles.borderRadius,
                          objectFit: el.styles.objectFit || 'contain',
                          objectPosition: el.styles.objectPosition || 'center',
                          opacity: el.styles.opacity !== undefined ? el.styles.opacity / 100 : 1,
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
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
                {el.type === 'separator' && (
                  <div className="w-full h-full bg-muted/50 flex items-center justify-center overflow-hidden">
                    {el.content ? (
                      <img
                        src={el.content}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <SeparatorHorizontal className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                )}

                {/* Drag Handle Indicator & Resize Handles */}
                {selectedElement === el.id && (
                  <>
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded p-1">
                      <Move className="w-3 h-3" />
                    </div>
                    
                    {/* Corner Resize Handles */}
                    <div 
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-sm cursor-se-resize z-50" 
                      onMouseDown={(e) => startResize(e, el.id, 'se')} 
                    />
                    <div 
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-sm cursor-sw-resize z-50" 
                      onMouseDown={(e) => startResize(e, el.id, 'sw')} 
                    />
                    <div 
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-sm cursor-ne-resize z-50" 
                      onMouseDown={(e) => startResize(e, el.id, 'ne')} 
                    />
                    <div 
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-sm cursor-nw-resize z-50" 
                      onMouseDown={(e) => startResize(e, el.id, 'nw')} 
                    />
                    
                    {/* Side Resize Handles */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2 h-4 bg-primary rounded-sm cursor-e-resize z-50" 
                      onMouseDown={(e) => startResize(e, el.id, 'e')} 
                    />
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2 h-4 bg-primary rounded-sm cursor-w-resize z-50" 
                      onMouseDown={(e) => startResize(e, el.id, 'w')} 
                    />
                    <div 
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-primary rounded-sm cursor-n-resize z-50" 
                      onMouseDown={(e) => startResize(e, el.id, 'n')} 
                    />
                    <div 
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-primary rounded-sm cursor-s-resize z-50" 
                      onMouseDown={(e) => startResize(e, el.id, 's')} 
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </main>

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
