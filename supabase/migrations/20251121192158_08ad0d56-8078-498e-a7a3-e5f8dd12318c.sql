-- Add is_featured column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN is_featured boolean DEFAULT false;

-- Create index for better query performance
CREATE INDEX idx_menu_items_featured ON menu_items(is_featured) WHERE is_featured = true;