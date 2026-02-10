import React from 'react';
import { HomepageElement } from '@/types/homepage';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2, GripVertical, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ElementsListProps {
  elements: HomepageElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const getElementIcon = (type: string) => {
  switch (type) {
    case 'heading': return 'H';
    case 'text': return 'T';
    case 'button': return 'B';
    case 'image': return '🖼';
    case 'search': return '🔍';
    case 'separator': return '—';
    case 'card': return '□';
    default: return '?';
  }
};

export const ElementsList: React.FC<ElementsListProps> = ({
  elements,
  selectedId,
  onSelect,
  onToggleVisibility,
  onDelete,
  onDuplicate,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">אלמנטים ({elements.length})</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {elements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">
              אין אלמנטים. הוסף מהסרגל למעלה.
            </p>
          ) : (
            elements.map((element) => (
              <div
                key={element.id}
                onClick={() => onSelect(element.id)}
                className={`
                  flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
                  ${selectedId === element.id 
                    ? 'bg-primary/10 border border-primary' 
                    : 'hover:bg-muted border border-transparent'}
                  ${!element.is_visible ? 'opacity-50' : ''}
                `}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="w-6 h-6 flex items-center justify-center bg-muted rounded text-xs font-mono">
                  {getElementIcon(element.element_type)}
                </span>
                <span className="flex-1 text-sm truncate">
                  {element.name || `${element.element_type} ללא שם`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(element.id, !element.is_visible);
                  }}
                >
                  {element.is_visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(element.id);
                  }}
                  title="שכפל"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(element.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
