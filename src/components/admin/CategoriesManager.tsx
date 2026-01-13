import React, { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/types/category';

const CategoriesManager: React.FC = () => {
  const { categories, loading, createCategory, updateCategory, deleteCategory, reorderCategories } = useCategories();
  const { toast } = useToast();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: 'נא להזין שם קטגוריה', variant: 'destructive' });
      return;
    }

    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      toast({ title: 'הקטגוריה נוצרה!' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'שגיאה ביצירת קטגוריה',
        variant: 'destructive',
      });
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;

    try {
      await updateCategory(editingId, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
      toast({ title: 'הקטגוריה עודכנה!' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'שגיאה בעדכון',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`האם למחוק את הקטגוריה "${name}"?\nמוצרים בקטגוריה זו לא יימחקו, רק השיוך.`)) return;

    try {
      await deleteCategory(id);
      toast({ title: 'הקטגוריה נמחקה' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'שגיאה במחיקה',
        variant: 'destructive',
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategory(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetId) {
      setDraggedCategory(null);
      return;
    }

    const newOrder = [...categories];
    const draggedIndex = newOrder.findIndex(c => c.id === draggedCategory);
    const targetIndex = newOrder.findIndex(c => c.id === targetId);

    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    try {
      await reorderCategories(newOrder);
      toast({ title: 'הסדר עודכן!' });
    } catch {
      toast({ title: 'שגיאה בעדכון הסדר', variant: 'destructive' });
    }
    setDraggedCategory(null);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">טוען קטגוריות...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add new category */}
      <div className="flex gap-2">
        <Input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="שם הקטגוריה החדשה"
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 ml-2" />
          הוסף
        </Button>
      </div>

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">אין קטגוריות עדיין</p>
          <p className="text-sm text-muted-foreground mt-2">
            הוסיפי קטגוריות כמו "ירקות", "פירות" וכו'
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, category.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category.id)}
              className={`bg-card rounded-lg border border-border p-3 flex items-center justify-between cursor-grab active:cursor-grabbing transition-opacity ${
                draggedCategory === category.id ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                
                {editingId === category.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8 w-48"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                ) : (
                  <span className="font-medium">{category.name}</span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {editingId === category.id ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStartEdit(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id, category.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;
