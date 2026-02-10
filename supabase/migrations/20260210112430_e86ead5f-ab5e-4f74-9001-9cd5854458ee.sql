
ALTER TABLE public.homepage_elements 
ADD COLUMN icon_size integer DEFAULT 40,
ADD COLUMN icon_offset_x integer DEFAULT 4,
ADD COLUMN icon_offset_y integer DEFAULT 50;
