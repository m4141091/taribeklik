import React from 'react';
import { Button } from '@/components/ui/button';
import { Type, Square, Image, MousePointer, Search, Minus, LayoutGrid } from 'lucide-react';
import { HomepageElementType } from '@/types/homepage';

interface ElementToolbarProps {
  onAddElement: (type: HomepageElementType) => void;
}

const elementTypes: { type: HomepageElementType; icon: React.ReactNode; label: string }[] = [
  { type: 'heading', icon: <Type className="w-4 h-4" />, label: 'כותרת' },
  { type: 'text', icon: <Type className="w-4 h-4" />, label: 'טקסט' },
  { type: 'button', icon: <Square className="w-4 h-4" />, label: 'כפתור' },
  { type: 'image', icon: <Image className="w-4 h-4" />, label: 'תמונה' },
  { type: 'search', icon: <Search className="w-4 h-4" />, label: 'חיפוש' },
  { type: 'separator', icon: <Minus className="w-4 h-4" />, label: 'מפריד' },
  { type: 'product_grid', icon: <LayoutGrid className="w-4 h-4" />, label: 'מוצרים' },
];

export const ElementToolbar: React.FC<ElementToolbarProps> = ({ onAddElement }) => {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-background border-b">
      <span className="text-sm font-medium ml-4 flex items-center">הוסף אלמנט:</span>
      {elementTypes.map(({ type, icon, label }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          onClick={() => onAddElement(type)}
          className="gap-2"
        >
          {icon}
          {label}
        </Button>
      ))}
    </div>
  );
};
