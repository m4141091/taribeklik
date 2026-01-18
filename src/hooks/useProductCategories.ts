import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/category';

export const useProductCategories = () => {
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

  const setProductCategoryIds = async (productId: string, categoryIds: string[]): Promise<void> => {
    // Delete existing associations
    await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId);

    // Insert new associations
    if (categoryIds.length > 0) {
      const { error } = await supabase
        .from('product_categories')
        .insert(
          categoryIds.map(categoryId => ({
            product_id: productId,
            category_id: categoryId,
          }))
        );

      if (error) throw error;
    }

    await fetchProductCategories();
  };

  const getProductCategoryIds = (productId: string): string[] => {
    return productCategories
      .filter(pc => pc.product_id === productId)
      .map(pc => pc.category_id);
  };

  const getProductsByCategory = (categoryId: string): string[] => {
    return productCategories
      .filter(pc => pc.category_id === categoryId)
      .map(pc => pc.product_id);
  };

  const addProductToCategories = async (productId: string, categoryIds: string[]): Promise<void> => {
    if (categoryIds.length === 0) return;

    const { error } = await supabase
      .from('product_categories')
      .insert(
        categoryIds.map(categoryId => ({
          product_id: productId,
          category_id: categoryId,
        }))
      );

    if (error) throw error;
    await fetchProductCategories();
  };

  // Batch function - adds multiple products to categories in one call
  const addProductsToCategories = async (
    productCategoryPairs: { productId: string; categoryIds: string[] }[]
  ): Promise<void> => {
    const inserts = productCategoryPairs.flatMap(({ productId, categoryIds }) =>
      categoryIds.map(categoryId => ({
        product_id: productId,
        category_id: categoryId,
      }))
    );

    if (inserts.length === 0) return;

    const { error } = await supabase
      .from('product_categories')
      .insert(inserts);

    if (error) throw error;
    await fetchProductCategories(); // Only once at the end!
  };

  return {
    productCategories,
    loading,
    fetchProductCategories,
    setProductCategoryIds,
    getProductCategoryIds,
    getProductsByCategory,
    addProductToCategories,
    addProductsToCategories,
  };
};
