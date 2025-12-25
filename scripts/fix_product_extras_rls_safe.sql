-- Fix RLS policies and constraints for product_extras table to support grouped extras
-- This version checks what exists before making changes

-- Step 1: Remove NOT NULL constraint from menu_item_id (if it exists)
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'product_extras'
        AND column_name = 'menu_item_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE product_extras ALTER COLUMN menu_item_id DROP NOT NULL;
        RAISE NOTICE 'Removed NOT NULL constraint from menu_item_id';
    ELSE
        RAISE NOTICE 'NOT NULL constraint already removed from menu_item_id';
    END IF;
END $$;

-- Step 2: Enable RLS (always safe to run)
ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate RLS policies
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

-- Step 4: Grant permissions
GRANT ALL ON product_extras TO authenticated;

-- Step 5: Add comment
COMMENT ON POLICY "Store owners can manage product extras" ON product_extras
  IS 'Allows store owners to manage extras for both their products and their extra groups';

-- Step 6: Add check constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'check_product_extras_parent'
    ) THEN
        ALTER TABLE product_extras
          ADD CONSTRAINT check_product_extras_parent
          CHECK (menu_item_id IS NOT NULL OR group_id IS NOT NULL);
        RAISE NOTICE 'Added check_product_extras_parent constraint';
    ELSE
        RAISE NOTICE 'check_product_extras_parent constraint already exists';
    END IF;
END $$;

-- Final verification
DO $$
DECLARE
    constraint_exists boolean;
    rls_enabled boolean;
    nullable boolean;
BEGIN
    -- Check if constraint exists
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_product_extras_parent'
    ) INTO constraint_exists;

    -- Check if RLS is enabled
    SELECT relrowsecurity FROM pg_class WHERE relname = 'product_extras' INTO rls_enabled;

    -- Check if column is nullable
    SELECT is_nullable = 'YES'
    FROM information_schema.columns
    WHERE table_name = 'product_extras' AND column_name = 'menu_item_id'
    INTO nullable;

    -- Print results
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE 'Check constraint exists: %', constraint_exists;
    RAISE NOTICE 'RLS enabled: %', rls_enabled;
    RAISE NOTICE 'menu_item_id nullable: %', nullable;

    IF constraint_exists AND rls_enabled AND nullable THEN
        RAISE NOTICE '✓ All changes applied successfully!';
    ELSE
        RAISE WARNING '⚠ Some changes may not have been applied';
    END IF;
END $$;
