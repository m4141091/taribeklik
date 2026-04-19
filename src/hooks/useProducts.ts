import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductFormData } from '@/types/product';
import { composeImageWithBackground } from '@/lib/composeImageWithBackground';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת מוצרים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (productData: ProductFormData): Promise<Product> => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        created_by: userData.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    setProducts(prev => [data as Product, ...prev]);
    return data as Product;
  };

  const createProducts = async (productsData: ProductFormData[]): Promise<Product[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    const productsWithCreator = productsData.map(p => ({
      ...p,
      created_by: userData.user?.id,
    }));

    const { data, error } = await supabase
      .from('products')
      .insert(productsWithCreator)
      .select();

    if (error) throw error;
    
    setProducts(prev => [...(data as Product[]), ...prev]);
    return data as Product[];
  };

  const updateProduct = async (id: string, updates: Partial<ProductFormData>): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setProducts(prev => prev.map(p => p.id === id ? data as Product : p));
    return data as Product;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleInStock = async (id: string, currentState: boolean): Promise<void> => {
    await updateProduct(id, { in_stock_this_week: !currentState });
  };

  const toggleActive = async (id: string, currentState: boolean): Promise<void> => {
    await updateProduct(id, { is_active: !currentState });
  };

  const uploadImage = async (file: File): Promise<string> => {
    // Compose the uploaded image on top of the dotted background so it's baked in
    const composedBlob = await composeImageWithBackground(file);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, composedBlob, { contentType: 'image/png' });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    createProducts,
    updateProduct,
    deleteProduct,
    toggleInStock,
    toggleActive,
    uploadImage,
  };
};
