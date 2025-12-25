-- Fix RLS policies and constraints for product_extras table to support grouped extras
-- This adds policies that allow store owners to manage extras for their groups

-- CRITICAL: Remove NOT NULL constraint from menu_item_id
-- This allows extras to belong to groups without being tied to a specific product
ALTER TABLE product_extras ALTER COLUMN menu_item_id DROP NOT NULL;

-- First, check if RLS is enabled (it should be)
ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them with proper permissions)
DROP POLICY IF EXISTS "Store owners can manage product extras" ON product_extras;
DROP POLICY IF EXISTS "Anyone can view available product extras" ON product_extras;

-- Policy: Store owners can manage product extras for their products AND groups
CREATE POLICY "Store owners can manage product extras"
  ON product_extras
  FOR ALL
  USING (
    -- Allow if the extra belongs to a product owned by the store owner
    (menu_item_id IS NOT NULL AND menu_item_id IN (
      SELECT id FROM menu_items WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
      )
    ))
    OR
    -- Allow if the extra belongs to a group owned by the store owner
    (group_id IS NOT NULL AND group_id IN (
      SELECT id FROM extra_groups WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
      )
    ))
  )
  WITH CHECK (
    -- Same check for inserts/updates
    (menu_item_id IS NOT NULL AND menu_item_id IN (
      SELECT id FROM menu_items WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
      )
    ))
    OR
    (group_id IS NOT NULL AND group_id IN (
      SELECT id FROM extra_groups WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
      )
    ))
  );

-- Policy: Anyone can view available product extras
CREATE POLICY "Anyone can view available product extras"
  ON product_extras
  FOR SELECT
  USING (is_available = true OR is_available IS NULL);

-- Grant necessary permissions
GRANT ALL ON product_extras TO authenticated;

-- Add comment
COMMENT ON POLICY "Store owners can manage product extras" ON product_extras IS 'Allows store owners to manage extras for both their products and their extra groups';

-- Add check constraint: either menu_item_id OR group_id must be set (but not both can be null)
ALTER TABLE product_extras
  ADD CONSTRAINT check_product_extras_parent
  CHECK (menu_item_id IS NOT NULL OR group_id IS NOT NULL);
