-- Migration: Add Grouped Extras Support
-- Description: Restructure product extras from flat list to grouped system with category-level inheritance
-- Date: 2025-12-24

-- =====================================================
-- 1. Create extra_groups table
-- =====================================================
CREATE TABLE IF NOT EXISTS extra_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- null = product-specific
  name TEXT NOT NULL,
  description TEXT,
  selection_type TEXT NOT NULL CHECK (selection_type IN ('single', 'multiple')),
  is_required BOOLEAN DEFAULT false,
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_extra_groups_store ON extra_groups(store_id);
CREATE INDEX IF NOT EXISTS idx_extra_groups_category ON extra_groups(category_id);
CREATE INDEX IF NOT EXISTS idx_extra_groups_active ON extra_groups(is_active);

-- Add RLS policies for extra_groups
ALTER TABLE extra_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Store owners can manage their own extra groups
CREATE POLICY "Store owners can manage extra groups"
  ON extra_groups
  FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Policy: Anyone can view active extra groups for their store
CREATE POLICY "Anyone can view active extra groups"
  ON extra_groups
  FOR SELECT
  USING (is_active = true);

-- =====================================================
-- 2. Modify product_extras table
-- =====================================================
-- Add new columns to product_extras
ALTER TABLE product_extras
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES extra_groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create index for group_id
CREATE INDEX IF NOT EXISTS idx_product_extras_group ON product_extras(group_id);

-- Add comments for clarity
COMMENT ON COLUMN product_extras.group_id IS 'Foreign key to extra_groups. NULL for ungrouped (legacy) extras.';
COMMENT ON COLUMN product_extras.is_default IS 'Whether this extra should be pre-selected by default.';

-- =====================================================
-- 3. Create product_group_overrides table
-- =====================================================
CREATE TABLE IF NOT EXISTS product_group_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES extra_groups(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, group_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_group_overrides_product ON product_group_overrides(product_id);
CREATE INDEX IF NOT EXISTS idx_product_group_overrides_group ON product_group_overrides(group_id);

-- Add RLS policies for product_group_overrides
ALTER TABLE product_group_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: Store owners can manage overrides for their products
CREATE POLICY "Store owners can manage product overrides"
  ON product_group_overrides
  FOR ALL
  USING (
    product_id IN (
      SELECT id FROM menu_items WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
      )
    )
  );

-- Policy: Anyone can view product overrides
CREATE POLICY "Anyone can view product overrides"
  ON product_group_overrides
  FOR SELECT
  USING (true);

-- =====================================================
-- 4. Create helper functions
-- =====================================================

-- Function to get all extra groups for a product (category + product-specific)
CREATE OR REPLACE FUNCTION get_product_extra_groups(p_product_id UUID)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  category_id UUID,
  name TEXT,
  description TEXT,
  selection_type TEXT,
  is_required BOOLEAN,
  min_selections INTEGER,
  max_selections INTEGER,
  display_order INTEGER,
  is_active BOOLEAN,
  source TEXT, -- 'category' or 'product'
  is_enabled BOOLEAN -- from override or default true
) AS $$
BEGIN
  RETURN QUERY
  WITH product_info AS (
    SELECT mi.category_id, mi.store_id
    FROM menu_items mi
    WHERE mi.id = p_product_id
  ),
  category_groups AS (
    SELECT
      eg.*,
      'category'::TEXT AS source,
      COALESCE(pgo.is_enabled, true) AS is_enabled
    FROM extra_groups eg
    CROSS JOIN product_info pi
    LEFT JOIN product_group_overrides pgo
      ON pgo.group_id = eg.id AND pgo.product_id = p_product_id
    WHERE eg.category_id = pi.category_id
      AND eg.is_active = true
  ),
  product_groups AS (
    SELECT
      eg.*,
      'product'::TEXT AS source,
      true AS is_enabled
    FROM extra_groups eg
    CROSS JOIN product_info pi
    WHERE eg.category_id IS NULL
      AND eg.store_id = pi.store_id
      AND eg.is_active = true
      AND EXISTS (
        SELECT 1 FROM product_extras pe
        WHERE pe.group_id = eg.id
        AND pe.menu_item_id = p_product_id
      )
  )
  SELECT * FROM category_groups
  UNION ALL
  SELECT * FROM product_groups
  ORDER BY display_order, name;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 5. Update updated_at trigger for extra_groups
-- =====================================================
CREATE OR REPLACE FUNCTION update_extra_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_extra_groups_updated_at
  BEFORE UPDATE ON extra_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_extra_groups_updated_at();

-- =====================================================
-- 6. Add validation constraints
-- =====================================================

-- Ensure min_selections <= max_selections
ALTER TABLE extra_groups
  ADD CONSTRAINT check_min_max_selections
  CHECK (max_selections IS NULL OR min_selections <= max_selections);

-- Ensure min_selections >= 0
ALTER TABLE extra_groups
  ADD CONSTRAINT check_min_selections_positive
  CHECK (min_selections >= 0);

-- =====================================================
-- Migration complete
-- =====================================================

-- Grant necessary permissions
GRANT ALL ON extra_groups TO authenticated;
GRANT ALL ON product_group_overrides TO authenticated;

-- Add helpful comments
COMMENT ON TABLE extra_groups IS 'Groups of product extras with validation rules. Can be category-level (inherited) or product-specific.';
COMMENT ON TABLE product_group_overrides IS 'Allows products to disable category-level extra groups.';
COMMENT ON FUNCTION get_product_extra_groups IS 'Returns all extra groups for a product, combining category and product-specific groups with override handling.';
