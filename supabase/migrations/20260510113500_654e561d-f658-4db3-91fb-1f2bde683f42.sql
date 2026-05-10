
-- Create a public products view that excludes admin metadata (created_by)
CREATE OR REPLACE VIEW public.products_public
WITH (security_invoker = on) AS
SELECT
  id, name, category, price_per_kg, price_per_unit, average_weight_kg,
  pricing_type, image_url, is_active, in_stock_this_week, has_unit_variation,
  created_at, updated_at
FROM public.products
WHERE is_active = true;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- Ensure sections_public uses security_invoker so RLS of base table applies
ALTER VIEW public.sections_public SET (security_invoker = on);
GRANT SELECT ON public.sections_public TO anon, authenticated;
