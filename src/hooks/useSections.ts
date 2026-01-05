import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Section, SectionElement } from '@/types/section';

export function useSections() {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Parse elements from JSON
      const parsedSections = (data || []).map((section) => ({
        ...section,
        elements: (section.elements as unknown as SectionElement[]) || [],
      }));

      setSections(parsedSections);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSections();
  }, []);

  const createSection = async (name: string, slug: string) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('sections')
      .insert({
        name,
        slug,
        created_by: userData.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    await fetchSections();
    return data;
  };

  const updateSection = async (id: string, updates: Partial<Section>) => {
    const { elements, ...rest } = updates;
    
    const updateData: Record<string, unknown> = { ...rest };
    if (elements !== undefined) {
      updateData.elements = JSON.parse(JSON.stringify(elements));
    }

    const { error } = await supabase
      .from('sections')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    await fetchSections();
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await fetchSections();
  };

  return {
    sections,
    loading,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
  };
}

export function useActiveSection(slug: string) {
  const [section, setSection] = React.useState<Section | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSection = async () => {
      try {
        const { data, error } = await supabase
          .from('sections')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSection({
            ...data,
            elements: (data.elements as unknown as SectionElement[]) || [],
          });
        }
      } catch (error) {
        console.error('Error fetching section:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSection();
  }, [slug]);

  return { section, loading };
}

export function useActiveSections() {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSections = async () => {
      try {
        const { data, error } = await supabase
          .from('sections')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        const parsedSections = (data || []).map((section) => ({
          ...section,
          elements: (section.elements as unknown as SectionElement[]) || [],
        }));

        setSections(parsedSections);
      } catch (error) {
        console.error('Error fetching active sections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  return { sections, loading };
}
