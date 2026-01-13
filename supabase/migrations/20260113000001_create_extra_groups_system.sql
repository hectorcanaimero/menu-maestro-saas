-- ============================================================================
-- Extra Groups System Migration
-- Description: Implement grouped extras for products with category inheritance
-- Created: 2026-01-13
-- Issue: PIDEA-107
-- ============================================================================

-- ============================================================================
-- STEP 1: Create extra_groups table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.extra_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  selection_type TEXT NOT NULL DEFAULT 'single' CHECK (selection_type IN ('single', 'multiple', 'none')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT valid_selection_count CHECK (
    (min_selections IS NULL OR min_selections >= 0) AND
    (max_selections IS NULL OR max_selections >= min_selections)
  )
);

-- Indexes for extra_groups
CREATE INDEX IF NOT EXISTS idx_extra_groups_store ON public.extra_groups(store_id);
CREATE INDEX IF NOT EXISTS idx_extra_groups_category ON public.extra_groups(category_id);
CREATE INDEX IF NOT EXISTS idx_extra_groups_display_order ON public.extra_groups(store_id, display_order);

-- RLS for extra_groups
ALTER TABLE public.extra_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Store owners can manage their groups
DROP POLICY IF EXISTS "Store owners can manage extra groups" ON public.extra_groups;
CREATE POLICY "Store owners can manage extra groups"
ON public.extra_groups
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = extra_groups.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Policy: Anyone can view active groups for available stores
DROP POLICY IF EXISTS "Anyone can view active extra groups" ON public.extra_groups;
CREATE POLICY "Anyone can view active extra groups"
ON public.extra_groups
FOR SELECT
USING (is_active = true);

-- ============================================================================
-- STEP 2: Add group_id to product_extras table
-- ============================================================================

-- Add group_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_extras' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE public.product_extras
      ADD COLUMN group_id UUID REFERENCES public.extra_groups(id) ON DELETE CASCADE;

    CREATE INDEX idx_product_extras_group ON public.product_extras(group_id);
  END IF;
END $$;

COMMENT ON COLUMN public.product_extras.group_id IS
'Optional: Group this extra belongs to. NULL for ungrouped (legacy) extras';

-- ============================================================================
-- STEP 3: Create product_extra_group_assignments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_extra_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.extra_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Unique constraint: one assignment per product-group combination
  UNIQUE(product_id, group_id)
);

-- Indexes for product_extra_group_assignments
CREATE INDEX IF NOT EXISTS idx_group_assignments_product ON public.product_extra_group_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_group_assignments_group ON public.product_extra_group_assignments(group_id);

-- RLS for product_extra_group_assignments
ALTER TABLE public.product_extra_group_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Store owners can manage assignments
DROP POLICY IF EXISTS "Store owners can manage group assignments" ON public.product_extra_group_assignments;
CREATE POLICY "Store owners can manage group assignments"
ON public.product_extra_group_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.menu_items
    JOIN public.stores ON stores.id = menu_items.store_id
    WHERE menu_items.id = product_extra_group_assignments.product_id
    AND stores.owner_id = auth.uid()
  )
);

-- Policy: Anyone can view assignments
DROP POLICY IF EXISTS "Anyone can view group assignments" ON public.product_extra_group_assignments;
CREATE POLICY "Anyone can view group assignments"
ON public.product_extra_group_assignments
FOR SELECT
USING (true);

-- ============================================================================
-- STEP 4: Create product_group_overrides table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_group_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.extra_groups(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Unique constraint
  UNIQUE(product_id, group_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_overrides_product ON public.product_group_overrides(product_id);
CREATE INDEX IF NOT EXISTS idx_group_overrides_group ON public.product_group_overrides(group_id);

-- RLS
ALTER TABLE public.product_group_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can manage overrides" ON public.product_group_overrides;
CREATE POLICY "Store owners can manage overrides"
ON public.product_group_overrides
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.menu_items
    JOIN public.stores ON stores.id = menu_items.store_id
    WHERE menu_items.id = product_group_overrides.product_id
    AND stores.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can view overrides" ON public.product_group_overrides;
CREATE POLICY "Anyone can view overrides"
ON public.product_group_overrides
FOR SELECT
USING (true);

-- ============================================================================
-- STEP 5: Create RPC function to get product extra groups
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_product_extra_groups(p_product_id UUID)
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
  source TEXT,
  is_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH product_info AS (
    SELECT mi.id, mi.category_id, mi.store_id
    FROM menu_items mi
    WHERE mi.id = p_product_id
  ),
  -- Get groups directly assigned to this product
  product_groups AS (
    SELECT DISTINCT
      eg.id,
      eg.store_id,
      eg.category_id,
      eg.name,
      eg.description,
      eg.selection_type,
      eg.is_required,
      eg.min_selections,
      eg.max_selections,
      eg.display_order,
      eg.is_active,
      'product'::TEXT as source,
      true as is_enabled
    FROM extra_groups eg
    JOIN product_extra_group_assignments pega ON pega.group_id = eg.id
    WHERE pega.product_id = p_product_id
      AND eg.is_active = true
  ),
  -- Get groups inherited from category
  category_groups AS (
    SELECT DISTINCT
      eg.id,
      eg.store_id,
      eg.category_id,
      eg.name,
      eg.description,
      eg.selection_type,
      eg.is_required,
      eg.min_selections,
      eg.max_selections,
      eg.display_order,
      eg.is_active,
      'category'::TEXT as source,
      COALESCE(pgo.is_enabled, true) as is_enabled
    FROM extra_groups eg
    CROSS JOIN product_info pi
    LEFT JOIN product_group_overrides pgo ON pgo.group_id = eg.id AND pgo.product_id = p_product_id
    WHERE eg.category_id = pi.category_id
      AND eg.is_active = true
      -- Exclude if product has a direct assignment for this group
      AND NOT EXISTS (
        SELECT 1 FROM product_extra_group_assignments pega
        WHERE pega.product_id = p_product_id AND pega.group_id = eg.id
      )
  )
  -- Combine both sources
  SELECT * FROM product_groups
  UNION ALL
  SELECT * FROM category_groups
  ORDER BY display_order, name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_product_extra_groups(UUID) IS
'Get all extra groups for a product including category-inherited groups and respecting overrides';

-- ============================================================================
-- STEP 6: Create trigger to update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for extra_groups
DROP TRIGGER IF EXISTS update_extra_groups_updated_at ON public.extra_groups;
CREATE TRIGGER update_extra_groups_updated_at
  BEFORE UPDATE ON public.extra_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for product_group_overrides
DROP TRIGGER IF EXISTS update_product_group_overrides_updated_at ON public.product_group_overrides;
CREATE TRIGGER update_product_group_overrides_updated_at
  BEFORE UPDATE ON public.product_group_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.extra_groups IS
'Groups of product extras that can be assigned to categories or specific products';

COMMENT ON TABLE public.product_extra_group_assignments IS
'Direct assignments of extra groups to specific products';

COMMENT ON TABLE public.product_group_overrides IS
'Override settings for category-inherited groups on specific products';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.extra_groups TO anon, authenticated;
GRANT SELECT ON public.product_extra_group_assignments TO anon, authenticated;
GRANT SELECT ON public.product_group_overrides TO anon, authenticated;

GRANT ALL ON public.extra_groups TO authenticated;
GRANT ALL ON public.product_extra_group_assignments TO authenticated;
GRANT ALL ON public.product_group_overrides TO authenticated;
