-- Drop and recreate the view with SECURITY INVOKER to fix the security definer warning
DROP VIEW IF EXISTS public.sections_public;

CREATE VIEW public.sections_public 
WITH (security_invoker = true) AS
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