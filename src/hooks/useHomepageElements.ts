import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HomepageElement, HomepageElementType } from '@/types/homepage';

export function useHomepageElements() {
  const [elements, setElements] = React.useState<HomepageElement[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchElements = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_elements')
        .select('*')
        .order('z_index', { ascending: true });

      if (error) throw error;
      setElements((data || []) as HomepageElement[]);
    } catch (error) {
      console.error('Error fetching homepage elements:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchElements();
  }, []);

  const createElement = async (type: HomepageElementType, posX: number, posY: number) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const isButton = type === 'button';
    const isProductGrid = type === 'product_grid';
    const isWhyUs = type === 'why_us_cards';
    const defaults: Partial<HomepageElement> = {
      element_type: type,
      position_x: posX,
      position_y: posY,
      width: type === 'heading' ? '400px' : isButton ? '220px' : isProductGrid ? '900px' : isWhyUs ? '1100px' : '300px',
      height: type === 'heading' ? '60px' : isButton ? '55px' : isProductGrid ? '300px' : isWhyUs ? '350px' : '100px',
      content: type === 'heading' ? 'כותרת חדשה' : type === 'text' ? 'טקסט חדש' : isButton ? 'למוצרים' : '',
      font_size: type === 'heading' ? 48 : isButton ? 18 : 16,
      name: isProductGrid ? 'מוצרים חדש' : isWhyUs ? 'למה לבחור בנו' : `${type} חדש`,
    };

    const insertData: Record<string, any> = {
      element_type: defaults.element_type!,
      position_x: posX,
      position_y: posY,
      width: defaults.width,
      height: defaults.height,
      content: defaults.content,
      font_size: defaults.font_size,
      name: defaults.name,
      created_by: userData.user?.id,
      color: '#162E14',
    };

    // Button-specific defaults for BrandButton style
    if (isButton) {
      insertData.font_family = 'discovery-fs';
      insertData.background_color = 'rgba(255,255,255,0.9)';
      insertData.border_radius = 30;
    }

    const { data, error } = await supabase
      .from('homepage_elements')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;
    await fetchElements();
    return data;
  };

  const updateElement = async (id: string, updates: Partial<HomepageElement>) => {
    const { error } = await supabase
      .from('homepage_elements')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchElements();
  };

  const deleteElement = async (id: string) => {
    const { error } = await supabase
      .from('homepage_elements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchElements();
  };

  const duplicateElement = async (id: string) => {
    const element = elements.find(e => e.id === id);
    if (!element) return null;

    const { data: userData } = await supabase.auth.getUser();
    
    const { id: _, created_at, updated_at, ...rest } = element;
    
    const { data, error } = await supabase
      .from('homepage_elements')
      .insert({
        ...rest,
        position_x: element.position_x + 2,
        position_y: element.position_y + 2,
        name: `${element.name} (העתק)`,
        created_by: userData.user?.id,
      } as any)
      .select()
      .single();

    if (error) throw error;
    await fetchElements();
    return data;
  };

  return {
    elements,
    loading,
    fetchElements,
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
  };
}

export function usePublicHomepageElements() {
  const [elements, setElements] = React.useState<HomepageElement[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchElements = async () => {
      try {
        const { data, error } = await supabase
          .from('homepage_elements')
          .select('*')
          .eq('is_visible', true)
          .order('z_index', { ascending: true });

        if (error) throw error;
        setElements((data || []) as HomepageElement[]);
      } catch (error) {
        console.error('Error fetching public homepage elements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchElements();
  }, []);

  return { elements, loading };
}
