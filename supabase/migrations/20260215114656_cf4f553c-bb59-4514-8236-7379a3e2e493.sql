ALTER TABLE public.homepage_elements DROP CONSTRAINT homepage_elements_font_family_check;
ALTER TABLE public.homepage_elements ADD CONSTRAINT homepage_elements_font_family_check 
CHECK (font_family IN ('discovery', 'discovery-fs', 'cooperative', 'script'));