-- ============================================================================
-- Migration: Subscription System - Functions and Triggers
-- Description: Lógica de negocio para suscripciones, validaciones y automatización
-- Created: 2025-12-02
-- Agent: Backend Specialist
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: create_trial_subscription
-- Se ejecuta automáticamente al crear una nueva tienda
-- Crea una suscripción trial de 30 días con 5 créditos AI
-- ============================================================================
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_trial_plan_id UUID;
  v_trial_duration INTEGER;
BEGIN
  -- Obtener el plan trial
  SELECT id, trial_duration_days INTO v_trial_plan_id, v_trial_duration
  FROM subscription_plans
  WHERE name = 'trial'
  AND is_active = true
  LIMIT 1;

  IF v_trial_plan_id IS NULL THEN
    RAISE WARNING 'Trial plan not found. Skipping subscription creation.';
    RETURN NEW;
  END IF;

  -- Crear suscripción trial automáticamente
  INSERT INTO subscriptions (
    store_id,
    plan_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end,
    admin_notes
  ) VALUES (
    NEW.id,
    v_trial_plan_id,
    'trial',
    NOW() + (v_trial_duration || ' days')::INTERVAL,
    NOW(),
    NOW() + (v_trial_duration || ' days')::INTERVAL,
    'Trial automático creado al registrar tienda'
  );

  -- Configurar créditos de AI según el plan trial (5 créditos)
  UPDATE store_ai_credits
  SET
    monthly_credits = 5,
    extra_credits = 0,
    credits_used_this_month = 0,
    last_reset_date = NOW()
  WHERE store_id = NEW.id;

  -- Si la tabla store_ai_credits no existe aún para esta tienda, crearla
  INSERT INTO store_ai_credits (
    store_id,
    monthly_credits,
    extra_credits,
    credits_used_this_month,
    last_reset_date
  )
  SELECT NEW.id, 5, 0, 0, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM store_ai_credits WHERE store_id = NEW.id
  );

  RAISE NOTICE 'Trial subscription created for store %', NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear trial al insertar tienda
DROP TRIGGER IF EXISTS trigger_create_trial_subscription ON stores;
CREATE TRIGGER trigger_create_trial_subscription
  AFTER INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_subscription();

-- ============================================================================
-- FUNCIÓN: validate_plan_limit
-- Verifica si una tienda ha alcanzado el límite de su plan
-- Retorna TRUE si aún puede realizar la acción, FALSE si alcanzó el límite
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_plan_limit(
  p_store_id UUID,
  p_limit_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit_value TEXT;
  v_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Obtener límite del plan actual
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

  -- Obtener conteo actual según el tipo de límite
  CASE p_limit_key
    WHEN 'max_products' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM menu_items
      WHERE store_id = p_store_id;

    WHEN 'max_orders_per_month' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM orders
      WHERE store_id = p_store_id
      AND created_at >= date_trunc('month', NOW());

    WHEN 'max_categories' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM categories
      WHERE store_id = p_store_id;

    WHEN 'ai_monthly_credits' THEN
      SELECT
        GREATEST(0, monthly_credits + extra_credits - credits_used_this_month)
      INTO v_current_count
      FROM store_ai_credits
      WHERE store_id = p_store_id;

      -- Para AI credits, verificar si tiene créditos disponibles
      RETURN v_current_count > 0;

    ELSE
      -- Límite no implementado, permitir por defecto
      RETURN true;
  END CASE;

  -- Verificar si el conteo actual es menor que el límite
  RETURN v_current_count < v_limit;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error validating limit % for store %: %', p_limit_key, p_store_id, SQLERRM;
    RETURN true; -- En caso de error, permitir para no bloquear
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: has_module_enabled
-- Verifica si un módulo está habilitado para una tienda
-- Considera tanto módulos incluidos en el plan como habilitados manualmente
-- ============================================================================
CREATE OR REPLACE FUNCTION has_module_enabled(
  p_store_id UUID,
  p_module_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_has_module BOOLEAN;
  v_manually_enabled BOOLEAN;
  v_subscription_active BOOLEAN;
BEGIN
  -- Verificar si la suscripción está activa o en trial
  SELECT
    EXISTS(SELECT 1 FROM subscriptions WHERE store_id = p_store_id AND status IN ('trial', 'active'))
  INTO v_subscription_active;

  IF NOT v_subscription_active THEN
    RETURN false;
  END IF;

  -- Verificar si el plan incluye el módulo
  SELECT
    COALESCE((sp.modules->>p_module_name)::BOOLEAN, false)
  INTO v_plan_has_module
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id
  AND s.status IN ('trial', 'active');

  -- Verificar si fue habilitado manualmente por admin
  SELECT
    COALESCE((s.enabled_modules->>p_module_name)::BOOLEAN, false)
  INTO v_manually_enabled
  FROM subscriptions s
  WHERE s.store_id = p_store_id;

  -- Retornar TRUE si está incluido en el plan O fue habilitado manualmente
  RETURN COALESCE(v_plan_has_module, false) OR COALESCE(v_manually_enabled, false);

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error checking module % for store %: %', p_module_name, p_store_id, SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: has_feature_enabled
-- Verifica si una feature está habilitada en el plan de la tienda
-- ============================================================================
CREATE OR REPLACE FUNCTION has_feature_enabled(
  p_store_id UUID,
  p_feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_feature_enabled BOOLEAN;
BEGIN
  SELECT
    COALESCE((sp.limits->>p_feature_name)::BOOLEAN, false)
  INTO v_feature_enabled
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id
  AND s.status IN ('trial', 'active');

  RETURN COALESCE(v_feature_enabled, false);

EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: get_store_usage_stats
-- Obtiene estadísticas de uso vs límites del plan para una tienda
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

  -- Obtener créditos AI
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

-- ============================================================================
-- FUNCIÓN: approve_payment
-- Aprueba un pago manual y actualiza la suscripción
-- Solo puede ser ejecutada por platform admins
-- ============================================================================
CREATE OR REPLACE FUNCTION approve_payment(
  p_payment_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_payment RECORD;
  v_subscription RECORD;
  v_new_period_end TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Obtener información del pago
  SELECT * INTO v_payment
  FROM payment_validations
  WHERE id = p_payment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
  END IF;

  IF v_payment.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment already processed');
  END IF;

  -- Obtener suscripción
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE id = v_payment.subscription_id;

  -- Calcular nuevo período
  IF v_subscription.current_period_end > NOW() THEN
    -- Si aún no ha expirado, extender desde el final actual
    v_new_period_end := v_subscription.current_period_end + INTERVAL '1 month';
  ELSE
    -- Si ya expiró, empezar desde ahora
    v_new_period_end := NOW() + INTERVAL '1 month';
  END IF;

  -- Actualizar el pago como aprobado
  UPDATE payment_validations
  SET
    status = 'approved',
    validated_by = p_admin_id,
    validated_at = NOW(),
    validation_notes = p_notes
  WHERE id = p_payment_id;

  -- Actualizar la suscripción
  UPDATE subscriptions
  SET
    status = 'active',
    current_period_start = CASE
      WHEN v_subscription.current_period_end > NOW()
      THEN v_subscription.current_period_start
      ELSE NOW()
    END,
    current_period_end = v_new_period_end,
    plan_id = COALESCE(v_payment.requested_plan_id, v_subscription.plan_id),
    updated_at = NOW()
  WHERE id = v_payment.subscription_id;

  -- Registrar en auditoría
  INSERT INTO subscription_audit_log (
    subscription_id,
    action,
    old_values,
    new_values,
    changed_by,
    notes
  ) VALUES (
    v_payment.subscription_id,
    'payment_approved',
    jsonb_build_object(
      'status', v_subscription.status,
      'period_end', v_subscription.current_period_end
    ),
    jsonb_build_object(
      'status', 'active',
      'period_end', v_new_period_end,
      'payment_id', p_payment_id,
      'amount', v_payment.amount
    ),
    p_admin_id,
    p_notes
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_payment.subscription_id,
    'new_period_end', v_new_period_end
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error approving payment %: %', p_payment_id, SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: reject_payment
-- Rechaza un pago manual
-- ============================================================================
CREATE OR REPLACE FUNCTION reject_payment(
  p_payment_id UUID,
  p_admin_id UUID,
  p_rejection_notes TEXT
)
RETURNS JSONB AS $$
BEGIN
  UPDATE payment_validations
  SET
    status = 'rejected',
    validated_by = p_admin_id,
    validated_at = NOW(),
    validation_notes = p_rejection_notes
  WHERE id = p_payment_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment not found or already processed');
  END IF;

  RETURN jsonb_build_object('success', true);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: check_expired_trials
-- Encuentra y marca como past_due los trials expirados
-- Para ejecutar via cron job
-- ============================================================================
CREATE OR REPLACE FUNCTION check_expired_trials()
RETURNS TABLE(
  store_id UUID,
  store_name TEXT,
  trial_ended_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Actualizar subscriptions expiradas
  UPDATE subscriptions s
  SET
    status = 'past_due',
    updated_at = NOW()
  WHERE s.status = 'trial'
  AND s.trial_ends_at < NOW();

  -- Retornar las tiendas afectadas
  RETURN QUERY
  SELECT
    st.id,
    st.name,
    s.trial_ends_at
  FROM subscriptions s
  JOIN stores st ON st.id = s.store_id
  WHERE s.status = 'past_due'
  AND s.trial_ends_at < NOW()
  ORDER BY s.trial_ends_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON FUNCTION create_trial_subscription() IS
'Crea automáticamente una suscripción trial de 30 días al registrar nueva tienda';

COMMENT ON FUNCTION validate_plan_limit(UUID, TEXT) IS
'Verifica si una tienda puede realizar una acción según los límites de su plan. Retorna TRUE si puede, FALSE si alcanzó el límite.';

COMMENT ON FUNCTION has_module_enabled(UUID, TEXT) IS
'Verifica si un módulo (whatsapp, delivery) está habilitado para una tienda';

COMMENT ON FUNCTION has_feature_enabled(UUID, TEXT) IS
'Verifica si una feature (kitchen_display, analytics, etc) está habilitada en el plan';

COMMENT ON FUNCTION get_store_usage_stats(UUID) IS
'Obtiene estadísticas de uso actual vs límites del plan en formato JSONB';

COMMENT ON FUNCTION approve_payment(UUID, UUID, TEXT) IS
'Aprueba un pago manual y extiende la suscripción por 1 mes. Solo para platform admins.';

COMMENT ON FUNCTION reject_payment(UUID, UUID, TEXT) IS
'Rechaza un pago manual. Solo para platform admins.';

COMMENT ON FUNCTION check_expired_trials() IS
'Encuentra trials expirados y los marca como past_due. Ejecutar via cron job diario.';

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
