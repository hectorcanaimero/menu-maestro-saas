-- ============================================================================
-- Migration: Sync AI Credits with Subscription Plan
-- Description: Corrige monthly_credits en store_ai_credits según el plan de suscripción
--              y crea trigger para mantener sincronización automática
-- Created: 2026-01-13
-- Issue: PIDEA-106 - Conteo de créditos al revés
-- ============================================================================

-- ============================================================================
-- PASO 1: Corregir créditos actuales de todas las tiendas según su plan
-- ============================================================================
DO $$
DECLARE
  v_store RECORD;
  v_plan_credits INTEGER;
BEGIN
  -- Iterar sobre todas las tiendas con suscripción activa
  FOR v_store IN
    SELECT
      s.id as store_id,
      sp.limits->>'max_ai_credits_per_month' as plan_credits
    FROM stores s
    JOIN subscriptions sub ON sub.store_id = s.id
    JOIN subscription_plans sp ON sp.id = sub.plan_id
    WHERE sub.status IN ('trial', 'active')
  LOOP
    -- Convertir plan_credits a INTEGER
    v_plan_credits := COALESCE(v_store.plan_credits::INTEGER, 5);

    -- Actualizar o insertar registro de créditos
    INSERT INTO store_ai_credits (
      store_id,
      monthly_credits,
      extra_credits,
      credits_used_this_month,
      last_reset_date
    ) VALUES (
      v_store.store_id,
      v_plan_credits,
      0,
      0,
      NOW()
    )
    ON CONFLICT (store_id) DO UPDATE
    SET
      monthly_credits = v_plan_credits,
      -- Resetear créditos usados si el límite mensual era incorrecto
      credits_used_this_month = CASE
        WHEN store_ai_credits.monthly_credits != v_plan_credits THEN 0
        ELSE store_ai_credits.credits_used_this_month
      END,
      last_reset_date = CASE
        WHEN store_ai_credits.monthly_credits != v_plan_credits THEN NOW()
        ELSE store_ai_credits.last_reset_date
      END;

    RAISE NOTICE 'Updated AI credits for store % to % monthly credits',
      v_store.store_id, v_plan_credits;
  END LOOP;
END $$;

-- ============================================================================
-- PASO 2: Función para sincronizar créditos AI cuando cambia el plan
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_ai_credits_on_plan_change()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_credits INTEGER;
BEGIN
  -- Solo sincronizar si cambió el plan_id
  IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
    -- Obtener créditos del nuevo plan
    SELECT
      COALESCE((limits->>'max_ai_credits_per_month')::INTEGER, 5)
    INTO v_plan_credits
    FROM subscription_plans
    WHERE id = NEW.plan_id;

    -- Actualizar créditos en store_ai_credits
    INSERT INTO store_ai_credits (
      store_id,
      monthly_credits,
      extra_credits,
      credits_used_this_month,
      last_reset_date
    ) VALUES (
      NEW.store_id,
      v_plan_credits,
      0,
      0,
      NOW()
    )
    ON CONFLICT (store_id) DO UPDATE
    SET
      monthly_credits = v_plan_credits,
      credits_used_this_month = 0,  -- Resetear al cambiar plan
      last_reset_date = NOW();

    RAISE NOTICE 'Synced AI credits for store % to % credits after plan change',
      NEW.store_id, v_plan_credits;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 3: Crear trigger para sincronizar automáticamente
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_sync_ai_credits_on_plan_change ON subscriptions;
CREATE TRIGGER trigger_sync_ai_credits_on_plan_change
  AFTER UPDATE OF plan_id ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_ai_credits_on_plan_change();

-- ============================================================================
-- PASO 4: Actualizar función get_store_usage_stats para usar plan limits
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
  -- Obtener límites del plan
  SELECT sp.limits INTO v_limits
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id;

  -- Si no hay plan, retornar vacío
  IF v_limits IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Contar productos
  SELECT COUNT(*) INTO v_products_count
  FROM menu_items
  WHERE store_id = p_store_id;

  v_products_limit := v_limits->>'max_products';

  -- Contar órdenes del mes actual
  SELECT COUNT(*) INTO v_orders_count
  FROM orders
  WHERE store_id = p_store_id
  AND created_at >= date_trunc('month', NOW());

  v_orders_limit := v_limits->>'max_orders_per_month';

  -- Contar categorías
  SELECT COUNT(*) INTO v_categories_count
  FROM categories
  WHERE store_id = p_store_id;

  v_categories_limit := v_limits->>'max_categories';

  -- Obtener créditos AI desde el plan
  v_ai_limit := COALESCE((v_limits->>'max_ai_credits_per_month')::INTEGER, 0);

  -- Obtener créditos usados y extras
  SELECT
    COALESCE(credits_used_this_month, 0),
    COALESCE(extra_credits, 0)
  INTO v_ai_used, v_ai_available
  FROM store_ai_credits
  WHERE store_id = p_store_id;

  -- Si no existe registro, usar valores por defecto
  IF NOT FOUND THEN
    v_ai_used := 0;
    v_ai_available := 0;
  ELSE
    -- Calcular créditos disponibles: (monthly + extra) - usados
    v_ai_available := GREATEST(0, (v_ai_limit + COALESCE(v_ai_available, 0)) - v_ai_used);
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

-- ============================================================================
-- Comentario final
-- ============================================================================
COMMENT ON FUNCTION sync_ai_credits_on_plan_change() IS
'Sincroniza los créditos AI de una tienda cuando cambia su plan de suscripción';

COMMENT ON TRIGGER trigger_sync_ai_credits_on_plan_change ON subscriptions IS
'Trigger que sincroniza automáticamente los créditos AI cuando se actualiza el plan_id';
