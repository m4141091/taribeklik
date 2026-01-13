import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/category';

interface CategoryMultiSelectProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({
  categories,
  selectedIds,
  onChange,
  placeholder = 'בחר קטגוריות',
}) => {
  const [open, setOpen] = React.useState(false);

  const toggleCategory = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter(id => id !== categoryId));
    } else {
      onChange([...selectedIds, categoryId]);
    }
  };

  const selectedCategories = categories.filter(c => selectedIds.includes(c.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10"
        >
          {selectedCategories.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedCategories.map((category) => (
                <Badge key={category.id} variant="secondary" className="text-xs">
                  {category.name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-60 overflow-auto">
          {categories.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              אין קטגוריות. צרי קטגוריות קודם.
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent",
                  selectedIds.includes(category.id) && "bg-accent"
                )}
                onClick={() => toggleCategory(category.id)}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    selectedIds.includes(category.id)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                >
                  {selectedIds.includes(category.id) && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                <span>{category.name}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryMultiSelect;
