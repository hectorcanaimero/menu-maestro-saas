-- ============================================================================
-- Fix Usage Stats Performance & Data Display
-- Description: Corrige problemas de rendimiento y datos faltantes en get_store_usage_stats
-- Created: 2026-01-24
-- ============================================================================

-- Problema identificado:
-- 1. La función hacía 6+ consultas separadas (lento)
-- 2. Los límites solo se obtenían si status IN ('trial', 'active')
--    Esto causaba que tiendas con otros status no vieran sus límites

CREATE OR REPLACE FUNCTION get_store_usage_stats(p_store_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_products_count INTEGER;
  v_categories_count INTEGER;
  v_orders_count INTEGER;
  v_ai_used INTEGER;
  v_ai_available INTEGER;
  v_ai_extra INTEGER;
  v_override RECORD;
  v_plan_limits RECORD;
BEGIN
  -- ============================================================================
  -- PASO 1: Obtener todos los counts en una sola operación
  -- ============================================================================
  SELECT
    (SELECT COUNT(*) FROM menu_items WHERE store_id = p_store_id),
    (SELECT COUNT(*) FROM categories WHERE store_id = p_store_id),
    (SELECT COUNT(*) FROM orders WHERE store_id = p_store_id AND created_at >= date_trunc('month', CURRENT_DATE))
  INTO v_products_count, v_categories_count, v_orders_count;

  -- Créditos AI usados este mes (desde store_ai_credits)
  SELECT
    COALESCE(credits_used_this_month, 0),
    COALESCE(extra_credits, 0)
  INTO v_ai_used, v_ai_extra
  FROM store_ai_credits
  WHERE store_id = p_store_id;

  -- Si no hay registro, usar valores por defecto
  IF NOT FOUND THEN
    v_ai_used := 0;
    v_ai_extra := 0;
  END IF;

  -- ============================================================================
  -- PASO 2: Obtener overrides (si existen)
  -- ============================================================================
  SELECT * INTO v_override
  FROM subscription_overrides
  WHERE store_id = p_store_id;

  -- ============================================================================
  -- PASO 3: Obtener límites del plan en UNA sola consulta
  -- IMPORTANTE: Removemos filtro de status para que siempre se muestren los límites
  -- ============================================================================
  SELECT
    (sp.limits->>'max_products')::INTEGER as max_products,
    (sp.limits->>'max_categories')::INTEGER as max_categories,
    (sp.limits->>'max_orders_per_month')::INTEGER as max_orders_per_month,
    COALESCE((sp.limits->>'max_ai_credits_per_month')::INTEGER, (sp.limits->>'ai_monthly_credits')::INTEGER, 0) as ai_monthly_credits
  INTO v_plan_limits
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id
  LIMIT 1; -- Solo necesitamos una suscripción por tienda

  -- Calcular créditos AI disponibles
  v_ai_available := GREATEST(0, COALESCE(v_plan_limits.ai_monthly_credits, 0) + v_ai_extra - v_ai_used);

  -- ============================================================================
  -- PASO 4: Construir resultado aplicando overrides donde corresponda
  -- ============================================================================
  v_result := jsonb_build_object(
    'products', jsonb_build_object(
      'current', v_products_count,
      'limit', COALESCE(v_override.max_products, v_plan_limits.max_products),
      'unlimited', COALESCE(v_override.max_products, v_plan_limits.max_products) IS NULL,
      'has_override', v_override.max_products IS NOT NULL
    ),
    'categories', jsonb_build_object(
      'current', v_categories_count,
      'limit', COALESCE(v_override.max_categories, v_plan_limits.max_categories),
      'unlimited', COALESCE(v_override.max_categories, v_plan_limits.max_categories) IS NULL,
      'has_override', v_override.max_categories IS NOT NULL
    ),
    'orders_this_month', jsonb_build_object(
      'current', v_orders_count,
      'limit', COALESCE(v_override.max_orders_per_month, v_plan_limits.max_orders_per_month),
      'unlimited', COALESCE(v_override.max_orders_per_month, v_plan_limits.max_orders_per_month) IS NULL,
      'has_override', v_override.max_orders_per_month IS NOT NULL
    ),
    'ai_credits', jsonb_build_object(
      'used', v_ai_used,
      'available', v_ai_available,
      'limit', COALESCE(v_plan_limits.ai_monthly_credits, 0)
    )
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero retornar estructura válida con valores por defecto
    RAISE WARNING 'Error en get_store_usage_stats para store %: %', p_store_id, SQLERRM;
    RETURN jsonb_build_object(
      'products', jsonb_build_object('current', 0, 'limit', null, 'unlimited', true, 'has_override', false),
      'categories', jsonb_build_object('current', 0, 'limit', null, 'unlimited', true, 'has_override', false),
      'orders_this_month', jsonb_build_object('current', 0, 'limit', null, 'unlimited', true, 'has_override', false),
      'ai_credits', jsonb_build_object('used', 0, 'available', 0, 'limit', 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Agregar índices para mejorar rendimiento si no existen
-- ============================================================================

-- Índice para menu_items por store_id (para conteo de productos)
CREATE INDEX IF NOT EXISTS idx_menu_items_store_id ON menu_items(store_id);

-- Índice para categories por store_id (para conteo de categorías)
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- Índice compuesto para orders por store_id y fecha (para conteo de órdenes del mes)
CREATE INDEX IF NOT EXISTS idx_orders_store_created ON orders(store_id, created_at);

-- Índice para store_ai_credits por store_id
CREATE INDEX IF NOT EXISTS idx_store_ai_credits_store_id ON store_ai_credits(store_id);

-- Índice para subscriptions por store_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON subscriptions(store_id);

-- Comentario
COMMENT ON FUNCTION get_store_usage_stats(UUID) IS
'Obtiene estadísticas de uso de una tienda. Optimizado para rendimiento con menos queries.
Ya no filtra por status de suscripción para siempre mostrar los límites del plan.';
