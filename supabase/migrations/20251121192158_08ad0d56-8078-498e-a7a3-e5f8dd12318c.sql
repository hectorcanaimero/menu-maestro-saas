-- Add is_featured column to menu_items table (idempotent)
DO $$
BEGIN
  ALTER TABLE menu_items ADD COLUMN is_featured boolean DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured) WHERE is_featured = true;