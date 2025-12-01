-- ============================================================================
-- Migration: Integrate Subscription Limits
-- Description: Actualizar módulos existentes para respetar límites de suscripción
-- Created: 2025-12-02
-- Agent: Integration Specialist
-- ============================================================================

-- ============================================================================
-- ACTUALIZAR FUNCIÓN DE RESET DE CRÉDITOS AI
-- Ahora lee el límite desde el plan de suscripción
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_monthly_ai_credits()
RETURNS void AS $$
DECLARE
  v_store RECORD;
  v_monthly_credits INTEGER;
BEGIN
  -- Iterar sobre todas las tiendas
  FOR v_store IN
    SELECT
      sac.store_id,
      COALESCE((sp.limits->>'ai_monthly_credits')::INTEGER, 5) as plan_credits
    FROM store_ai_credits sac
    JOIN subscriptions s ON s.store_id = sac.store_id
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.status IN ('trial', 'active')
  LOOP
    -- Actualizar créditos mensuales según el plan
    UPDATE store_ai_credits
    SET
      monthly_credits = v_store.plan_credits,
      credits_used_this_month = 0,
      last_reset_date = NOW()
    WHERE store_id = v_store.store_id;

    RAISE NOTICE 'Reset AI credits for store % to %', v_store.store_id, v_store.plan_credits;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_monthly_ai_credits() IS
'Reset mensual de créditos AI. Ahora lee el límite desde subscription_plans en lugar de valor fijo.';

-- ============================================================================
-- TRIGGER: Validar límite de productos antes de insertar
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_can_add BOOLEAN;
BEGIN
  -- Verificar límite del plan
  SELECT validate_plan_limit(NEW.store_id, 'max_products') INTO v_can_add;

  IF NOT v_can_add THEN
    RAISE EXCEPTION 'Has alcanzado el límite de productos de tu plan. Upgrade para agregar más productos.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger en menu_items
DROP TRIGGER IF EXISTS trigger_validate_product_limit ON menu_items;
CREATE TRIGGER trigger_validate_product_limit
  BEFORE INSERT ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_limit();

COMMENT ON FUNCTION validate_product_limit() IS
'Valida que la tienda no exceda el límite de productos de su plan antes de insertar uno nuevo';

-- ============================================================================
-- TRIGGER: Validar límite de categorías antes de insertar
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_category_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_can_add BOOLEAN;
BEGIN
  -- Verificar límite del plan
  SELECT validate_plan_limit(NEW.store_id, 'max_categories') INTO v_can_add;

  IF NOT v_can_add THEN
    RAISE EXCEPTION 'Has alcanzado el límite de categorías de tu plan. Upgrade para agregar más categorías.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger en categories
DROP TRIGGER IF EXISTS trigger_validate_category_limit ON categories;
CREATE TRIGGER trigger_validate_category_limit
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_category_limit();

COMMENT ON FUNCTION validate_category_limit() IS
'Valida que la tienda no exceda el límite de categorías de su plan';

-- ============================================================================
-- TRIGGER: Validar límite de órdenes mensuales antes de insertar
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_order_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_can_add BOOLEAN;
BEGIN
  -- Verificar límite del plan
  SELECT validate_plan_limit(NEW.store_id, 'max_orders_per_month') INTO v_can_add;

  IF NOT v_can_add THEN
    RAISE EXCEPTION 'Has alcanzado el límite de órdenes del mes. Tu plan permite hasta % órdenes por mes. Contacta soporte para upgrade.',
      (SELECT (sp.limits->>'max_orders_per_month')::INTEGER
       FROM subscriptions s
       JOIN subscription_plans sp ON sp.id = s.plan_id
       WHERE s.store_id = NEW.store_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger en orders
DROP TRIGGER IF EXISTS trigger_validate_order_limit ON orders;
CREATE TRIGGER trigger_validate_order_limit
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_limit();

COMMENT ON FUNCTION validate_order_limit() IS
'Valida que la tienda no exceda el límite de órdenes mensuales de su plan';

-- ============================================================================
-- FUNCIÓN: Verificar acceso a features premium
-- ============================================================================
CREATE OR REPLACE FUNCTION can_access_feature(
  p_store_id UUID,
  p_feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_feature BOOLEAN;
  v_subscription_active BOOLEAN;
BEGIN
  -- Verificar si la suscripción está activa
  SELECT EXISTS(
    SELECT 1 FROM subscriptions
    WHERE store_id = p_store_id
    AND status IN ('trial', 'active')
  ) INTO v_subscription_active;

  IF NOT v_subscription_active THEN
    RETURN false;
  END IF;

  -- Verificar si la feature está habilitada en el plan
  SELECT
    COALESCE((sp.limits->>p_feature_name)::BOOLEAN, false)
  INTO v_has_feature
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id;

  RETURN COALESCE(v_has_feature, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_access_feature(UUID, TEXT) IS
'Verifica si una tienda puede acceder a una feature específica según su plan (ej: has_kitchen_display, has_analytics)';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_access_feature(UUID, TEXT) TO authenticated, anon;

-- ============================================================================
-- ACTUALIZAR POLÍTICAS DE WHATSAPP CON VALIDACIÓN DE MÓDULO
-- ============================================================================

-- Ya se crearon en la migración de security, pero aquí las documentamos
-- Las policies de whatsapp_settings, drivers, etc. ya validan con has_module_enabled()

-- ============================================================================
-- FUNCIÓN HELPER: Obtener información del plan actual
-- ============================================================================
CREATE OR REPLACE FUNCTION get_current_plan(p_store_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_plan_info JSONB;
BEGIN
  SELECT jsonb_build_object(
    'plan_id', sp.id,
    'plan_name', sp.name,
    'plan_display_name', sp.display_name,
    'subscription_status', s.status,
    'trial_ends_at', s.trial_ends_at,
    'current_period_end', s.current_period_end,
    'limits', sp.limits,
    'modules', sp.modules,
    'enabled_modules', s.enabled_modules
  )
  INTO v_plan_info
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id;

  RETURN v_plan_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_current_plan(UUID) IS
'Obtiene información completa del plan y suscripción actual de una tienda en formato JSONB';

GRANT EXECUTE ON FUNCTION get_current_plan(UUID) TO authenticated;

-- ============================================================================
-- FUNCIÓN: Verificar si suscripción está expirada o suspendida
-- ============================================================================
CREATE OR REPLACE FUNCTION is_subscription_valid(p_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
  v_trial_ends_at TIMESTAMPTZ;
  v_current_period_end TIMESTAMPTZ;
BEGIN
  SELECT
    s.status,
    s.trial_ends_at,
    s.current_period_end
  INTO
    v_status,
    v_trial_ends_at,
    v_current_period_end
  FROM subscriptions s
  WHERE s.store_id = p_store_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Si está suspendida, no es válida
  IF v_status = 'suspended' THEN
    RETURN false;
  END IF;

  -- Si está cancelada, no es válida
  IF v_status = 'cancelled' THEN
    RETURN false;
  END IF;

  -- Si está en trial, verificar que no haya expirado
  IF v_status = 'trial' THEN
    IF v_trial_ends_at < NOW() THEN
      RETURN false;
    END IF;
  END IF;

  -- Si está activa, verificar el período actual
  IF v_status = 'active' THEN
    IF v_current_period_end < NOW() THEN
      RETURN false;
    END IF;
  END IF;

  -- Si está pendiente de pago, permitir acceso limitado
  IF v_status = 'pending_payment' THEN
    RETURN true; -- Permitir acceso básico
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_subscription_valid(UUID) IS
'Verifica si la suscripción de una tienda es válida (no expirada, no suspendida)';

GRANT EXECUTE ON FUNCTION is_subscription_valid(UUID) TO authenticated, anon;

-- ============================================================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_menu_items_store_id_created ON menu_items(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_store_id_created ON categories(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_store_id_month ON orders(store_id, created_at) WHERE created_at >= date_trunc('month', NOW());

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================
COMMENT ON TRIGGER trigger_validate_product_limit ON menu_items IS
'Previene agregar productos si se alcanzó el límite del plan';

COMMENT ON TRIGGER trigger_validate_category_limit ON categories IS
'Previene agregar categorías si se alcanzó el límite del plan';

COMMENT ON TRIGGER trigger_validate_order_limit ON orders IS
'Previene crear órdenes si se alcanzó el límite mensual del plan';

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
