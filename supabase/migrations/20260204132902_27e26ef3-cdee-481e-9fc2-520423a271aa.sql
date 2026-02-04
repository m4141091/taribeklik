-- Create homepage_elements table to replace sections-based structure
CREATE TABLE public.homepage_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  element_type TEXT NOT NULL CHECK (element_type IN ('heading', 'text', 'button', 'image', 'search', 'separator', 'card', 'icon')),
  position_x NUMERIC NOT NULL DEFAULT 50, -- percentage (0-100)
  position_y NUMERIC NOT NULL DEFAULT 50, -- percentage (0-100)
  width TEXT NOT NULL DEFAULT '200px', -- pixels or percentage
  height TEXT NOT NULL DEFAULT '100px', -- pixels or percentage
  content TEXT, -- text content or image URL
  
  -- Styling
  font_size INTEGER DEFAULT 16,
  font_family TEXT DEFAULT 'discovery' CHECK (font_family IN ('discovery', 'cooperative', 'script')),
  color TEXT DEFAULT '#000000',
  background_color TEXT,
  border_radius INTEGER DEFAULT 0,
  text_align TEXT DEFAULT 'center' CHECK (text_align IN ('right', 'center', 'left')),
  object_fit TEXT DEFAULT 'contain' CHECK (object_fit IN ('cover', 'contain', 'fill', 'none')),
  object_position TEXT DEFAULT 'center',
  opacity INTEGER DEFAULT 100, -- 0-100
  
  -- Effects
  typewriter_enabled BOOLEAN DEFAULT false,
  typewriter_speed INTEGER DEFAULT 100, -- ms between characters
  typewriter_delay INTEGER DEFAULT 500, -- ms before starting
  
  -- Interaction
  link_url TEXT,
  z_index INTEGER DEFAULT 1,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  name TEXT, -- friendly name for the element in editor
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.homepage_elements ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can view all homepage elements"
  ON public.homepage_elements FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert homepage elements"
  ON public.homepage_elements FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update homepage elements"
  ON public.homepage_elements FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete homepage elements"
  ON public.homepage_elements FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Public can view visible elements
CREATE POLICY "Anyone can view visible homepage elements"
  ON public.homepage_elements FOR SELECT
  USING (is_visible = true);

-- Trigger for updated_at
CREATE TRIGGER update_homepage_elements_updated_at
  BEFORE UPDATE ON public.homepage_elements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();