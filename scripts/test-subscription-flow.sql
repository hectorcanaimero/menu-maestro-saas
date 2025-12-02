-- ============================================================================
-- TEST SUBSCRIPTION FLOW
-- ============================================================================
-- Este script prueba el flujo completo del sistema de suscripción
-- Ejecutar en Supabase SQL Editor para validar funcionamiento
-- ============================================================================

DO $$
DECLARE
  v_test_store_id UUID;
  v_subscription_id UUID;
  v_payment_id UUID;
  v_can_add_product BOOLEAN;
  v_has_whatsapp BOOLEAN;
  v_usage_stats JSONB;
  v_test_passed INTEGER := 0;
  v_test_failed INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INICIANDO TESTS DEL SISTEMA DE SUSCRIPCIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ========================================================================
  -- TEST 1: Verificar que trial se crea automáticamente
  -- ========================================================================
  RAISE NOTICE 'TEST 1: Trial automático al crear tienda';

  -- Crear tienda de prueba
  INSERT INTO stores (
    subdomain,
    name,
    owner_id,
    is_active
  ) VALUES (
    'test-subscription-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8),
    'Test Store Subscription',
    (SELECT id FROM auth.users LIMIT 1), -- Usar primer usuario disponible
    true
  ) RETURNING id INTO v_test_store_id;

  -- Esperar a que el trigger ejecute
  PERFORM pg_sleep(0.5);

  -- Verificar que se creó la suscripción trial
  SELECT id INTO v_subscription_id
  FROM subscriptions
  WHERE store_id = v_test_store_id
  AND status = 'trial';

  IF v_subscription_id IS NOT NULL THEN
    RAISE NOTICE '  ✓ Trial creado automáticamente';
    v_test_passed := v_test_passed + 1;
  ELSE
    RAISE NOTICE '  ✗ FALLÓ: No se creó trial automáticamente';
    v_test_failed := v_test_failed + 1;
  END IF;

  -- ========================================================================
  -- TEST 2: Verificar límites del plan trial
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 2: Límites del plan trial';

  SELECT validate_plan_limit(v_test_store_id, 'max_products') INTO v_can_add_product;

  IF v_can_add_product THEN
    RAISE NOTICE '  ✓ Puede agregar productos (dentro del límite)';
    v_test_passed := v_test_passed + 1;
  ELSE
    RAISE NOTICE '  ✗ FALLÓ: No puede agregar productos';
    v_test_failed := v_test_failed + 1;
  END IF;

  -- ========================================================================
  -- TEST 3: Verificar que WhatsApp no está disponible en trial
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 3: Módulo WhatsApp no disponible en trial';

  SELECT has_module_enabled(v_test_store_id, 'whatsapp') INTO v_has_whatsapp;

  IF NOT v_has_whatsapp THEN
    RAISE NOTICE '  ✓ WhatsApp correctamente deshabilitado en trial';
    v_test_passed := v_test_passed + 1;
  ELSE
    RAISE NOTICE '  ✗ FALLÓ: WhatsApp está habilitado (no debería)';
    v_test_failed := v_test_failed + 1;
  END IF;

  -- ========================================================================
  -- TEST 4: Estadísticas de uso
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 4: Estadísticas de uso';

  SELECT get_store_usage_stats(v_test_store_id) INTO v_usage_stats;

  IF v_usage_stats IS NOT NULL THEN
    RAISE NOTICE '  ✓ Estadísticas obtenidas correctamente';
    RAISE NOTICE '    Productos: %/%',
      v_usage_stats->'products'->>'current',
      v_usage_stats->'products'->>'limit';
    RAISE NOTICE '    Créditos AI: %/%',
      v_usage_stats->'ai_credits'->>'available',
      v_usage_stats->'ai_credits'->>'limit';
    v_test_passed := v_test_passed + 1;
  ELSE
    RAISE NOTICE '  ✗ FALLÓ: No se pudieron obtener estadísticas';
    v_test_failed := v_test_failed + 1;
  END IF;

  -- ========================================================================
  -- TEST 5: Crear solicitud de pago
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 5: Crear solicitud de pago';

  INSERT INTO payment_validations (
    subscription_id,
    amount,
    payment_date,
    payment_method,
    reference_number,
    status,
    requested_plan_id
  ) VALUES (
    v_subscription_id,
    29.00,
    CURRENT_DATE,
    'bank_transfer',
    'TEST-123456',
    'pending',
    (SELECT id FROM subscription_plans WHERE name = 'basic' LIMIT 1)
  ) RETURNING id INTO v_payment_id;

  IF v_payment_id IS NOT NULL THEN
    RAISE NOTICE '  ✓ Solicitud de pago creada';
    v_test_passed := v_test_passed + 1;
  ELSE
    RAISE NOTICE '  ✗ FALLÓ: No se pudo crear solicitud de pago';
    v_test_failed := v_test_failed + 1;
  END IF;

  -- ========================================================================
  -- TEST 6: Aprobar pago (simular admin)
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 6: Aprobar pago';

  DECLARE
    v_approval_result JSONB;
    v_admin_id UUID;
  BEGIN
    -- Obtener primer admin disponible (o usar service_role)
    SELECT user_id INTO v_admin_id
    FROM platform_admins
    WHERE role = 'super_admin'
    LIMIT 1;

    IF v_admin_id IS NULL THEN
      -- Si no hay admin, crear uno temporal para el test
      v_admin_id := (SELECT id FROM auth.users LIMIT 1);
    END IF;

    SELECT approve_payment(
      v_payment_id,
      v_admin_id,
      'Test approval'
    ) INTO v_approval_result;

    IF (v_approval_result->>'success')::BOOLEAN THEN
      RAISE NOTICE '  ✓ Pago aprobado exitosamente';
      v_test_passed := v_test_passed + 1;

      -- Verificar que la suscripción cambió a active
      IF EXISTS(
        SELECT 1 FROM subscriptions
        WHERE id = v_subscription_id
        AND status = 'active'
      ) THEN
        RAISE NOTICE '  ✓ Suscripción cambió a active';
        v_test_passed := v_test_passed + 1;
      ELSE
        RAISE NOTICE '  ✗ FALLÓ: Suscripción no cambió a active';
        v_test_failed := v_test_failed + 1;
      END IF;
    ELSE
      RAISE NOTICE '  ✗ FALLÓ: Error al aprobar pago: %', v_approval_result->>'error';
      v_test_failed := v_test_failed + 1;
    END IF;
  END;

  -- ========================================================================
  -- TEST 7: Verificar auditoría
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 7: Verificar registro de auditoría';

  IF EXISTS(
    SELECT 1 FROM subscription_audit_log
    WHERE subscription_id = v_subscription_id
    AND action = 'payment_approved'
  ) THEN
    RAISE NOTICE '  ✓ Cambio registrado en auditoría';
    v_test_passed := v_test_passed + 1;
  ELSE
    RAISE NOTICE '  ✗ FALLÓ: No se registró en auditoría';
    v_test_failed := v_test_failed + 1;
  END IF;

  -- ========================================================================
  -- TEST 8: Habilitar módulo manualmente
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 8: Habilitar módulo WhatsApp manualmente';

  UPDATE subscriptions
  SET enabled_modules = jsonb_set(
    enabled_modules,
    '{whatsapp}',
    'true'::jsonb
  )
  WHERE id = v_subscription_id;

  SELECT has_module_enabled(v_test_store_id, 'whatsapp') INTO v_has_whatsapp;

  IF v_has_whatsapp THEN
    RAISE NOTICE '  ✓ WhatsApp habilitado manualmente';
    v_test_passed := v_test_passed + 1;
  ELSE
    RAISE NOTICE '  ✗ FALLÓ: WhatsApp no se habilitó';
    v_test_failed := v_test_failed + 1;
  END IF;

  -- ========================================================================
  -- TEST 9: Validar límite de productos (trigger)
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 9: Trigger de validación de productos';

  BEGIN
    -- Intentar crear productos hasta exceder el límite
    FOR i IN 1..51 LOOP -- Trial tiene límite de 50
      INSERT INTO menu_items (
        store_id,
        category_id,
        name,
        price,
        is_available
      ) VALUES (
        v_test_store_id,
        (SELECT id FROM categories WHERE store_id = v_test_store_id LIMIT 1),
        'Test Product ' || i,
        10.00,
        true
      );
    END LOOP;

    RAISE NOTICE '  ✗ FALLÓ: Permitió exceder límite de productos';
    v_test_failed := v_test_failed + 1;
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%límite de productos%' THEN
        RAISE NOTICE '  ✓ Trigger bloqueó correctamente al exceder límite';
        v_test_passed := v_test_passed + 1;
      ELSE
        RAISE NOTICE '  ✗ FALLÓ: Error inesperado: %', SQLERRM;
        v_test_failed := v_test_failed + 1;
      END IF;
  END;

  -- ========================================================================
  -- LIMPIEZA: Eliminar datos de prueba
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE 'Limpiando datos de prueba...';

  DELETE FROM stores WHERE id = v_test_store_id;

  RAISE NOTICE '  ✓ Datos de prueba eliminados';

  -- ========================================================================
  -- RESULTADOS FINALES
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESULTADOS FINALES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tests pasados: %', v_test_passed;
  RAISE NOTICE 'Tests fallidos: %', v_test_failed;
  RAISE NOTICE '';

  IF v_test_failed = 0 THEN
    RAISE NOTICE '✓ TODOS LOS TESTS PASARON EXITOSAMENTE';
  ELSE
    RAISE NOTICE '⚠ ALGUNOS TESTS FALLARON - Revisar configuración';
  END IF;

  RAISE NOTICE '========================================';
END;
$$;
