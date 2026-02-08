-- Add line_height column to homepage_elements
ALTER TABLE public.homepage_elements 
ADD COLUMN line_height DECIMAL DEFAULT 1.2;