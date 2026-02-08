import React, { useRef, useState } from 'react';
import { HomepageElement } from '@/types/homepage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Copy, Eye, EyeOff, Upload, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ElementPropertiesPanelProps {
  element: HomepageElement | null;
  onUpdate: (id: string, updates: Partial<HomepageElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const ElementPropertiesPanel: React.FC<ElementPropertiesPanelProps> = ({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !element) return;

    if (!file.type.startsWith('image/')) {
      toast.error('נא להעלות קובץ תמונה בלבד');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `homepage/${element.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('section-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('section-assets')
        .getPublicUrl(fileName);

      onUpdate(element.id, { content: publicUrl });
      toast.success('התמונה הועלתה בהצלחה');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!element) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        בחר אלמנט לעריכה
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">עריכת אלמנט</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUpdate(element.id, { is_visible: !element.is_visible })}
            title={element.is_visible ? 'הסתר' : 'הצג'}
          >
            {element.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDuplicate(element.id)}
            title="שכפל"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(element.id)}
            className="text-destructive"
            title="מחק"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label>שם האלמנט</Label>
        <Input
          value={element.name || ''}
          onChange={(e) => onUpdate(element.id, { name: e.target.value })}
        />
      </div>

      {/* Content */}
      {element.element_type !== 'image' && element.element_type !== 'separator' && (
        <div className="space-y-2">
          <Label>תוכן</Label>
          <Textarea
            value={element.content || ''}
            onChange={(e) => onUpdate(element.id, { content: e.target.value })}
            rows={3}
          />
        </div>
      )}

      {/* Image URL & Upload */}
      {(element.element_type === 'image' || element.element_type === 'separator') && (
        <div className="space-y-3">
          <Label>תמונה</Label>
          
          {/* Upload Button */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  העלאת תמונה
                </>
              )}
            </Button>
          </div>

          {/* Or URL Input */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">או הכנס כתובת URL</Label>
            <Input
              value={element.content || ''}
              onChange={(e) => onUpdate(element.id, { content: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Preview */}
          {element.content && (
            <div className="mt-2 rounded-lg overflow-hidden border">
              <img 
                src={element.content} 
                alt="תצוגה מקדימה" 
                className="w-full h-24 object-contain bg-muted"
              />
            </div>
          )}
        </div>
      )}

      {/* Link URL */}
      {element.element_type === 'button' && (
        <div className="space-y-2">
          <Label>קישור</Label>
          <Input
            value={element.link_url || ''}
            onChange={(e) => onUpdate(element.id, { link_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      )}

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>X (%)</Label>
          <Input
            type="number"
            value={element.position_x}
            onChange={(e) => onUpdate(element.id, { position_x: Number(e.target.value) })}
            min={0}
            max={100}
          />
        </div>
        <div className="space-y-2">
          <Label>Y (%)</Label>
          <Input
            type="number"
            value={element.position_y}
            onChange={(e) => onUpdate(element.id, { position_y: Number(e.target.value) })}
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>רוחב</Label>
          <Input
            value={element.width}
            onChange={(e) => onUpdate(element.id, { width: e.target.value })}
            placeholder="200px או 50%"
          />
        </div>
        <div className="space-y-2">
          <Label>גובה</Label>
          <Input
            value={element.height}
            onChange={(e) => onUpdate(element.id, { height: e.target.value })}
            placeholder="100px או 50%"
          />
        </div>
      </div>

      {/* Font Size */}
      {['heading', 'text', 'button', 'search'].includes(element.element_type) && (
        <div className="space-y-2">
          <Label>גודל גופן</Label>
          <Input
            type="number"
            value={element.font_size}
            onChange={(e) => onUpdate(element.id, { font_size: Number(e.target.value) })}
            min={8}
            max={200}
          />
        </div>
      )}

      {/* Line Height */}
      {['heading', 'text'].includes(element.element_type) && (
        <div className="space-y-2">
          <Label>גובה שורה</Label>
          <Input
            type="number"
            step="0.1"
            value={element.line_height || 1.2}
            onChange={(e) => onUpdate(element.id, { line_height: Number(e.target.value) })}
            min={0.5}
            max={3}
          />
          <p className="text-xs text-muted-foreground">1.0 = צפוף, 1.5 = רגיל, 2.0 = מרווח</p>
        </div>
      )}

      {/* Font Family */}
      {['heading', 'text', 'button'].includes(element.element_type) && (
        <div className="space-y-2">
          <Label>גופן</Label>
          <Select
            value={element.font_family}
            onValueChange={(v) => onUpdate(element.id, { font_family: v as 'discovery' | 'cooperative' | 'script' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discovery">Discovery</SelectItem>
              <SelectItem value="cooperative">Cooperative</SelectItem>
              <SelectItem value="script">Script</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Text Align */}
      {['heading', 'text', 'button'].includes(element.element_type) && (
        <div className="space-y-2">
          <Label>יישור טקסט</Label>
          <Select
            value={element.text_align}
            onValueChange={(v) => onUpdate(element.id, { text_align: v as 'right' | 'center' | 'left' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="right">ימין</SelectItem>
              <SelectItem value="center">מרכז</SelectItem>
              <SelectItem value="left">שמאל</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>צבע טקסט</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={element.color}
              onChange={(e) => onUpdate(element.id, { color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <Input
              value={element.color}
              onChange={(e) => onUpdate(element.id, { color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>צבע רקע</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={element.background_color || '#ffffff'}
              onChange={(e) => onUpdate(element.id, { background_color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <Input
              value={element.background_color || ''}
              onChange={(e) => onUpdate(element.id, { background_color: e.target.value || null })}
              className="flex-1"
              placeholder="ללא"
            />
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label>עיגול פינות</Label>
        <Input
          type="number"
          value={element.border_radius}
          onChange={(e) => onUpdate(element.id, { border_radius: Number(e.target.value) })}
          min={0}
        />
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <Label>שקיפות (%)</Label>
        <Input
          type="number"
          value={element.opacity}
          onChange={(e) => onUpdate(element.id, { opacity: Number(e.target.value) })}
          min={0}
          max={100}
        />
      </div>

      {/* Z-Index */}
      <div className="space-y-2">
        <Label>שכבה (Z-Index)</Label>
        <Input
          type="number"
          value={element.z_index}
          onChange={(e) => onUpdate(element.id, { z_index: Number(e.target.value) })}
        />
      </div>

      {/* Typewriter Effect */}
      {['heading', 'text'].includes(element.element_type) && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>אפקט מכונת כתיבה</Label>
            <Switch
              checked={element.typewriter_enabled}
              onCheckedChange={(v) => onUpdate(element.id, { typewriter_enabled: v })}
            />
          </div>
          {element.typewriter_enabled && (
            <>
              <div className="space-y-2">
                <Label>מהירות (ms)</Label>
                <Input
                  type="number"
                  value={element.typewriter_speed}
                  onChange={(e) => onUpdate(element.id, { typewriter_speed: Number(e.target.value) })}
                  min={10}
                />
              </div>
              <div className="space-y-2">
                <Label>עיכוב התחלה (ms)</Label>
                <Input
                  type="number"
                  value={element.typewriter_delay}
                  onChange={(e) => onUpdate(element.id, { typewriter_delay: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
