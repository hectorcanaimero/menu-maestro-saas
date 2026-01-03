-- ============================================================================
-- Fix AI Credits Display
-- Description: Corrige el c�lculo de cr�ditos AI usados y disponibles
-- Created: 2026-01-01
-- ============================================================================

CREATE OR REPLACE FUNCTION get_store_usage_stats(p_store_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
  v_limits JSONB;
  v_products_count INTEGER;
  v_products_limit TEXT;
  v_orders_count INTEGER;
  v_orders_limit TEXT;
  v_categories_count INTEGER;
  v_categories_limit TEXT;
  v_ai_used INTEGER;
  v_ai_available INTEGER;
  v_ai_limit INTEGER;
BEGIN
  -- Obtener l�mites del plan
  SELECT sp.limits INTO v_limits
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id;

  -- Contar productos
  SELECT COUNT(*) INTO v_products_count
  FROM menu_items
  WHERE store_id = p_store_id;

  v_products_limit := v_limits->>'max_products';

  -- Contar �rdenes del mes actual
  SELECT COUNT(*) INTO v_orders_count
  FROM orders
  WHERE store_id = p_store_id
  AND created_at >= date_trunc('month', NOW());

  v_orders_limit := v_limits->>'max_orders_per_month';

  -- Contar categor�as
  SELECT COUNT(*) INTO v_categories_count
  FROM categories
  WHERE store_id = p_store_id;

  v_categories_limit := v_limits->>'max_categories';

  -- Obtener cr�ditos AI (CORREGIDO)
  SELECT
    COALESCE(credits_used_this_month, 0),
    COALESCE(GREATEST(0, (monthly_credits + extra_credits) - credits_used_this_month), 0),
    COALESCE(monthly_credits, 0)
  INTO v_ai_used, v_ai_available, v_ai_limit
  FROM store_ai_credits
  WHERE store_id = p_store_id;

  -- Si no existe registro en store_ai_credits, usar valores por defecto
  IF NOT FOUND THEN
    v_ai_used := 0;
    v_ai_available := 0;
    v_ai_limit := 0;
  END IF;

  -- Construir JSON de respuesta
  v_stats := jsonb_build_object(
    'products', jsonb_build_object(
      'current', v_products_count,
      'limit', CASE WHEN v_products_limit = 'null' THEN null ELSE v_products_limit::INTEGER END,
      'unlimited', v_products_limit IS NULL OR v_products_limit = 'null'
    ),
    'orders_this_month', jsonb_build_object(
      'current', v_orders_count,
      'limit', CASE WHEN v_orders_limit = 'null' THEN null ELSE v_orders_limit::INTEGER END,
      'unlimited', v_orders_limit IS NULL OR v_orders_limit = 'null'
    ),
    'categories', jsonb_build_object(
      'current', v_categories_count,
      'limit', CASE WHEN v_categories_limit = 'null' THEN null ELSE v_categories_limit::INTEGER END,
      'unlimited', v_categories_limit IS NULL OR v_categories_limit = 'null'
    ),
    'ai_credits', jsonb_build_object(
      'used', v_ai_used,
      'available', v_ai_available,
      'limit', v_ai_limit
    )
  );

  RETURN v_stats;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error getting usage stats for store %: %', p_store_id, SQLERRM;
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
