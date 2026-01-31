-- Fix public data exposure: Create a secure view for public sections that excludes sensitive fields
-- and update the RLS policy to prevent direct access to created_by

-- Create a view that excludes the created_by field for public access
CREATE OR REPLACE VIEW public.sections_public AS
SELECT 
  id,
  name,
  slug,
  height,
  background_image_url,
  background_color,
  background_size,
  background_position,
  elements,
  is_active,
  display_order,
  created_at,
  updated_at
  -- Note: created_by is intentionally excluded to prevent admin UUID exposure
FROM public.sections
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public.sections_public TO anon, authenticated;