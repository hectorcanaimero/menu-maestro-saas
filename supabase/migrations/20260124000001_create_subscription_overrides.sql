-- ============================================================================
-- SUBSCRIPTION OVERRIDES SYSTEM
-- ============================================================================
-- Permite a los super admins ajustar límites de suscripción por tienda
-- sin necesidad de cambiar el plan completo

-- Tabla de overrides (excepciones de límites)
CREATE TABLE IF NOT EXISTS subscription_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Límites personalizados (null = usar límite del plan)
  max_products INTEGER,
  max_categories INTEGER,
  max_orders_per_month INTEGER,

  -- Notas para el admin
  notes TEXT,
  reason TEXT, -- Por qué se dio esta excepción

  -- Auditoría
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(store_id)
);

-- Índices
CREATE INDEX idx_subscription_overrides_store_id ON subscription_overrides(store_id);

-- RLS Policies
ALTER TABLE subscription_overrides ENABLE ROW LEVEL SECURITY;

-- Solo admins (platform admins) pueden ver/editar overrides
CREATE POLICY "Admins can manage subscription overrides"
  ON subscription_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Store owners pueden ver sus propios overrides (solo lectura)
CREATE POLICY "Store owners can view their own overrides"
  ON subscription_overrides
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_subscription_override_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_subscription_override_timestamp
  BEFORE UPDATE ON subscription_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_override_timestamp();

-- ============================================================================
-- ACTUALIZAR FUNCIÓN validate_plan_limit PARA CONSIDERAR OVERRIDES
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_plan_limit(
  p_store_id UUID,
  p_limit_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_override_value INTEGER;
  v_limit_value TEXT;
  v_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- PRIMERO: Verificar si hay override para esta tienda
  CASE p_limit_key
    WHEN 'max_products' THEN
      SELECT max_products INTO v_override_value
      FROM subscription_overrides
      WHERE store_id = p_store_id;
    WHEN 'max_categories' THEN
      SELECT max_categories INTO v_override_value
      FROM subscription_overrides
      WHERE store_id = p_store_id;
    WHEN 'max_orders_per_month' THEN
      SELECT max_orders_per_month INTO v_override_value
      FROM subscription_overrides
      WHERE store_id = p_store_id;
  END CASE;

  -- Si hay override, usar ese valor
  IF v_override_value IS NOT NULL THEN
    v_limit := v_override_value;
  ELSE
    -- Si no hay override, obtener límite del plan actual
    SELECT (sp.limits->>p_limit_key) INTO v_limit_value
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.store_id = p_store_id
    AND s.status IN ('trial', 'active');

    -- Si no hay límite (null en JSONB), significa ilimitado
    IF v_limit_value IS NULL OR v_limit_value = 'null' THEN
      RETURN true;
    END IF;

    -- Convertir a INTEGER
    v_limit := v_limit_value::INTEGER;
  END IF;

  -- Obtener conteo actual según el tipo de límite
  CASE p_limit_key
    WHEN 'max_products' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM menu_items
      WHERE store_id = p_store_id;

    WHEN 'max_categories' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM categories
      WHERE store_id = p_store_id;

    WHEN 'max_orders_per_month' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM orders
      WHERE store_id = p_store_id
      AND created_at >= date_trunc('month', CURRENT_DATE);
  END CASE;

  -- Comparar y retornar resultado
  RETURN v_current_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS DE USO (ACTUALIZADA)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_store_usage_stats(p_store_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_products_count INTEGER;
  v_products_limit INTEGER;
  v_categories_count INTEGER;
  v_categories_limit INTEGER;
  v_orders_count INTEGER;
  v_orders_limit INTEGER;
  v_ai_used INTEGER;
  v_ai_limit INTEGER;
  v_override RECORD;
BEGIN
  -- Obtener counts actuales
  SELECT COUNT(*) INTO v_products_count FROM menu_items WHERE store_id = p_store_id;
  SELECT COUNT(*) INTO v_categories_count FROM categories WHERE store_id = p_store_id;
  SELECT COUNT(*) INTO v_orders_count
  FROM orders
  WHERE store_id = p_store_id
  AND created_at >= date_trunc('month', CURRENT_DATE);

  -- Obtener créditos AI usados
  SELECT
    COALESCE(SUM(credits_used), 0)::INTEGER
  INTO v_ai_used
  FROM ai_usage_log
  WHERE store_id = p_store_id
  AND created_at >= date_trunc('month', CURRENT_DATE);

  -- Verificar si hay overrides
  SELECT * INTO v_override
  FROM subscription_overrides
  WHERE store_id = p_store_id;

  -- Obtener límites del plan o overrides
  IF v_override.max_products IS NOT NULL THEN
    v_products_limit := v_override.max_products;
  ELSE
    SELECT (sp.limits->>'max_products')::INTEGER INTO v_products_limit
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.store_id = p_store_id
    AND s.status IN ('trial', 'active');
  END IF;

  IF v_override.max_categories IS NOT NULL THEN
    v_categories_limit := v_override.max_categories;
  ELSE
    SELECT (sp.limits->>'max_categories')::INTEGER INTO v_categories_limit
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.store_id = p_store_id
    AND s.status IN ('trial', 'active');
  END IF;

  IF v_override.max_orders_per_month IS NOT NULL THEN
    v_orders_limit := v_override.max_orders_per_month;
  ELSE
    SELECT (sp.limits->>'max_orders_per_month')::INTEGER INTO v_orders_limit
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.store_id = p_store_id
    AND s.status IN ('trial', 'active');
  END IF;

  -- AI credits siempre del plan (no se pueden overridear por ahora)
  SELECT (sp.limits->>'ai_monthly_credits')::INTEGER INTO v_ai_limit
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id
  AND s.status IN ('trial', 'active');

  -- Construir resultado
  v_result := jsonb_build_object(
    'products', jsonb_build_object(
      'current', v_products_count,
      'limit', v_products_limit,
      'unlimited', v_products_limit IS NULL,
      'has_override', v_override.max_products IS NOT NULL
    ),
    'categories', jsonb_build_object(
      'current', v_categories_count,
      'limit', v_categories_limit,
      'unlimited', v_categories_limit IS NULL,
      'has_override', v_override.max_categories IS NOT NULL
    ),
    'orders_this_month', jsonb_build_object(
      'current', v_orders_count,
      'limit', v_orders_limit,
      'unlimited', v_orders_limit IS NULL,
      'has_override', v_override.max_orders_per_month IS NOT NULL
    ),
    'ai_credits', jsonb_build_object(
      'used', v_ai_used,
      'available', GREATEST(0, COALESCE(v_ai_limit, 0) - v_ai_used),
      'limit', COALESCE(v_ai_limit, 0)
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIONES RPC PARA GESTIONAR OVERRIDES
-- ============================================================================

-- Crear o actualizar override
CREATE OR REPLACE FUNCTION upsert_subscription_override(
  p_store_id UUID,
  p_max_products INTEGER DEFAULT NULL,
  p_max_categories INTEGER DEFAULT NULL,
  p_max_orders_per_month INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS subscription_overrides AS $$
DECLARE
  v_result subscription_overrides;
BEGIN
  -- Verificar que el usuario sea super admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo super admins pueden gestionar overrides';
  END IF;

  -- Insertar o actualizar override
  INSERT INTO subscription_overrides (
    store_id,
    max_products,
    max_categories,
    max_orders_per_month,
    notes,
    reason,
    created_by
  ) VALUES (
    p_store_id,
    p_max_products,
    p_max_categories,
    p_max_orders_per_month,
    p_notes,
    p_reason,
    auth.uid()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    max_products = COALESCE(EXCLUDED.max_products, subscription_overrides.max_products),
    max_categories = COALESCE(EXCLUDED.max_categories, subscription_overrides.max_categories),
    max_orders_per_month = COALESCE(EXCLUDED.max_orders_per_month, subscription_overrides.max_orders_per_month),
    notes = COALESCE(EXCLUDED.notes, subscription_overrides.notes),
    reason = COALESCE(EXCLUDED.reason, subscription_overrides.reason),
    updated_by = auth.uid(),
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar override
CREATE OR REPLACE FUNCTION delete_subscription_override(p_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que el usuario sea super admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo super admins pueden gestionar overrides';
  END IF;

  DELETE FROM subscription_overrides WHERE store_id = p_store_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener override de una tienda
CREATE OR REPLACE FUNCTION get_subscription_override(p_store_id UUID)
RETURNS subscription_overrides AS $$
DECLARE
  v_result subscription_overrides;
BEGIN
  SELECT * INTO v_result
  FROM subscription_overrides
  WHERE store_id = p_store_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON TABLE subscription_overrides IS 'Excepciones de límites de suscripción por tienda - gestionado por super admins';
COMMENT ON COLUMN subscription_overrides.max_products IS 'Override para límite de productos (null = usar límite del plan)';
COMMENT ON COLUMN subscription_overrides.max_categories IS 'Override para límite de categorías (null = usar límite del plan)';
COMMENT ON COLUMN subscription_overrides.max_orders_per_month IS 'Override para límite de pedidos por mes (null = usar límite del plan)';
COMMENT ON COLUMN subscription_overrides.reason IS 'Razón por la cual se aplicó este override';
COMMENT ON COLUMN subscription_overrides.notes IS 'Notas adicionales del admin';
