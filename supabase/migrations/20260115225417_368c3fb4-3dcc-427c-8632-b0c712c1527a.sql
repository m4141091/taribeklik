-- Add has_unit_variation column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_unit_variation boolean DEFAULT true;