import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/category';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data as Category[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת קטגוריות');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (name: string): Promise<Category> => {
    const maxOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.display_order)) 
      : -1;
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        display_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) throw error;
    
    setCategories(prev => [...prev, data as Category]);
    return data as Category;
  };

  const updateCategory = async (id: string, updates: Partial<Pick<Category, 'name' | 'display_order'>>): Promise<Category> => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setCategories(prev => prev.map(c => c.id === id ? data as Category : c));
    return data as Category;
  };

  const deleteCategory = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const reorderCategories = async (newOrder: Category[]): Promise<void> => {
    const updates = newOrder.map((category, index) => ({
      id: category.id,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }

    setCategories(newOrder.map((c, i) => ({ ...c, display_order: i })));
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
};
