-- Fix: Corregir la lógica de asignación de grupos a productos
-- El problema: La función get_product_extra_groups busca registros en product_extras
-- con AMBOS group_id Y menu_item_id, pero los extras del grupo tienen menu_item_id NULL

-- Solución: Crear tabla de mapeo product_extra_group_assignments

-- =====================================================
-- 1. Crear tabla de asignaciones grupo-producto
-- =====================================================
CREATE TABLE IF NOT EXISTS product_extra_group_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES extra_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, group_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_pega_product ON product_extra_group_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_pega_group ON product_extra_group_assignments(group_id);

-- RLS policies
ALTER TABLE product_extra_group_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage product group assignments"
  ON product_extra_group_assignments
  FOR ALL
  USING (
    product_id IN (
      SELECT id FROM menu_items WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Anyone can view product group assignments"
  ON product_extra_group_assignments
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT ALL ON product_extra_group_assignments TO authenticated;

-- =====================================================
-- 2. Actualizar función get_product_extra_groups
-- =====================================================
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
  source TEXT,
  is_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH product_info AS (
    SELECT mi.category_id, mi.store_id
    FROM menu_items mi
    WHERE mi.id = p_product_id
  ),
  -- Grupos asignados a la categoría del producto
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
  -- Grupos asignados directamente al producto (usando la nueva tabla)
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
        SELECT 1 FROM product_extra_group_assignments pega
        WHERE pega.group_id = eg.id
        AND pega.product_id = p_product_id
      )
  )
  SELECT * FROM category_groups
  UNION ALL
  SELECT * FROM product_groups
  ORDER BY display_order, name;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 3. Migrar datos existentes (si los hay)
-- =====================================================
-- Esto busca los registros "placeholder" creados por AssignGroupDialog
-- y los convierte a asignaciones en la nueva tabla

INSERT INTO product_extra_group_assignments (product_id, group_id)
SELECT DISTINCT menu_item_id, group_id
FROM product_extras
WHERE group_id IS NOT NULL
  AND menu_item_id IS NOT NULL
  AND name IN ('Placeholder', 'placeholder', 'PLACEHOLDER')
ON CONFLICT (product_id, group_id) DO NOTHING;

-- Eliminar los placeholders
DELETE FROM product_extras
WHERE group_id IS NOT NULL
  AND menu_item_id IS NOT NULL
  AND name IN ('Placeholder', 'placeholder', 'PLACEHOLDER');

-- =====================================================
-- Verificación
-- =====================================================
DO $$
DECLARE
  table_exists boolean;
  function_updated boolean;
BEGIN
  -- Verificar tabla
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'product_extra_group_assignments'
  ) INTO table_exists;

  -- Verificar función
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_product_extra_groups'
  ) INTO function_updated;

  RAISE NOTICE '=== VERIFICACIÓN ===';
  RAISE NOTICE 'Tabla product_extra_group_assignments creada: %', table_exists;
  RAISE NOTICE 'Función get_product_extra_groups actualizada: %', function_updated;

  IF table_exists AND function_updated THEN
    RAISE NOTICE '✓ Fix aplicado correctamente!';
  ELSE
    RAISE WARNING '⚠ Algo salió mal en la aplicación del fix';
  END IF;
END $$;
