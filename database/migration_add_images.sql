-- Migration: Add multiple images support to inventory
-- Date: 2026-06-23

-- Add images column as JSON array to store multiple image paths
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN inventory.images IS 'Array of relative paths to uploaded image files';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_images ON inventory USING GIN(images);
