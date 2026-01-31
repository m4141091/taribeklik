import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/category';

export const usePublicProductCategories = () => {
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_categories')
        .select('*');

      if (error) throw error;
      setProductCategories(data as ProductCategory[]);
    } catch (err) {
      console.error('Error fetching product categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductCategories();
  }, [fetchProductCategories]);

  const getProductsByCategory = useCallback((categoryId: string): string[] => {
    return productCategories
      .filter(pc => pc.category_id === categoryId)
      .map(pc => pc.product_id);
  }, [productCategories]);

  return {
    productCategories,
    loading,
    getProductsByCategory,
  };
};
