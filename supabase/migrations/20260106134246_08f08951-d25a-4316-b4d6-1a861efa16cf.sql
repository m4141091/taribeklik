-- Add background_size and background_position columns to sections table
ALTER TABLE public.sections 
ADD COLUMN IF NOT EXISTS background_size text DEFAULT 'cover',
ADD COLUMN IF NOT EXISTS background_position text DEFAULT 'center';