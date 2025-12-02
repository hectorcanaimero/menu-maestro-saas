-- ============================================================================
-- SUBSCRIPTION SYSTEM - SETUP COMPLETO
-- ============================================================================
-- Este script configura el sistema de suscripción desde cero
-- Incluye verificaciones, configuración de planes y creación de primer admin
-- ============================================================================

-- ============================================================================
-- PASO 1: Verificar que las migraciones se aplicaron correctamente
-- ============================================================================
DO $$
DECLARE
  v_tables_ok BOOLEAN := true;
  v_functions_ok BOOLEAN := true;
BEGIN
  RAISE NOTICE '=== VERIFICANDO INSTALACIÓN ===';

  -- Verificar tablas
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    RAISE WARNING 'Tabla subscription_plans NO EXISTE';
    v_tables_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    RAISE WARNING 'Tabla subscriptions NO EXISTE';
    v_tables_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_validations') THEN
    RAISE WARNING 'Tabla payment_validations NO EXISTE';
    v_tables_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_admins') THEN
    RAISE WARNING 'Tabla platform_admins NO EXISTE';
    v_tables_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_audit_log') THEN
    RAISE WARNING 'Tabla subscription_audit_log NO EXISTE';
    v_tables_ok := false;
  END IF;

  -- Verificar funciones principales
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_platform_admin') THEN
    RAISE WARNING 'Función is_platform_admin() NO EXISTE';
    v_functions_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_plan_limit') THEN
    RAISE WARNING 'Función validate_plan_limit() NO EXISTE';
    v_functions_ok := false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_module_enabled') THEN
    RAISE WARNING 'Función has_module_enabled() NO EXISTE';
    v_functions_ok := false;
  END IF;

  -- Resultado
  IF v_tables_ok AND v_functions_ok THEN
    RAISE NOTICE '✓ Todas las tablas y funciones están correctamente instaladas';
  ELSE
    RAISE EXCEPTION 'Faltan tablas o funciones. Por favor ejecuta las migraciones primero con: supabase db push';
  END IF;
END;
$$;

-- ============================================================================
-- PASO 2: Verificar planes por defecto
-- ============================================================================
DO $$
DECLARE
  v_plan_count INTEGER;
  v_plan RECORD;
BEGIN
  RAISE NOTICE '=== VERIFICANDO PLANES ===';

  SELECT COUNT(*) INTO v_plan_count FROM subscription_plans;

  IF v_plan_count = 0 THEN
    RAISE EXCEPTION 'No hay planes configurados. Las migraciones no se aplicaron correctamente.';
  END IF;

  RAISE NOTICE '✓ % planes encontrados:', v_plan_count;

  -- Mostrar planes
  FOR v_plan IN (SELECT name, display_name, price_monthly FROM subscription_plans ORDER BY sort_order) LOOP
    RAISE NOTICE '  - %: $%/mes', v_plan.display_name, v_plan.price_monthly;
  END LOOP;
END;
$$;

-- ============================================================================
-- PASO 3: Crear primer Super Admin
-- ============================================================================
-- IMPORTANTE: Reemplaza 'admin@tudominio.com' con tu email real
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_admin_exists BOOLEAN;
  v_admin RECORD;
BEGIN
  RAISE NOTICE '=== CONFIGURANDO SUPER ADMIN ===';

  -- Verificar si ya existe un super admin
  SELECT EXISTS(
    SELECT 1 FROM platform_admins WHERE role = 'super_admin'
  ) INTO v_admin_exists;

  IF v_admin_exists THEN
    RAISE NOTICE '✓ Ya existe un super admin configurado';
    RAISE NOTICE '  Lista de admins:';
    FOR v_admin IN (
      SELECT
        pa.role,
        pa.is_active,
        au.email
      FROM platform_admins pa
      JOIN auth.users au ON au.id = pa.user_id
      ORDER BY pa.created_at
    ) LOOP
      RAISE NOTICE '    - % (%) - Activo: %', v_admin.email, v_admin.role, v_admin.is_active;
    END LOOP;
  ELSE
    RAISE NOTICE '⚠ No hay super admins configurados';
    RAISE NOTICE '';
    RAISE NOTICE 'Para crear el primer super admin, ejecuta:';
    RAISE NOTICE '';
    RAISE NOTICE 'INSERT INTO platform_admins (user_id, role, is_active)';
    RAISE NOTICE 'SELECT id, ''super_admin'', true';
    RAISE NOTICE 'FROM auth.users';
    RAISE NOTICE 'WHERE email = ''TU_EMAIL@dominio.com'';';
    RAISE NOTICE '';
  END IF;
END;
$$;

-- ============================================================================
-- PASO 4: Verificar tiendas existentes tienen suscripción
-- ============================================================================
DO $$
DECLARE
  v_stores_without_sub INTEGER;
  v_trial_plan_id UUID;
  v_stat RECORD;
BEGIN
  RAISE NOTICE '=== VERIFICANDO TIENDAS ===';

  -- Contar tiendas sin suscripción
  SELECT COUNT(*) INTO v_stores_without_sub
  FROM stores s
  WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE store_id = s.id
  );

  IF v_stores_without_sub > 0 THEN
    RAISE NOTICE '⚠ Hay % tiendas sin suscripción', v_stores_without_sub;
    RAISE NOTICE '  Creando suscripciones trial para tiendas existentes...';

    -- Obtener plan trial
    SELECT id INTO v_trial_plan_id
    FROM subscription_plans
    WHERE name = 'trial'
    LIMIT 1;

    -- Crear subscriptions para tiendas sin una
    INSERT INTO subscriptions (
      store_id,
      plan_id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end,
      admin_notes
    )
    SELECT
      s.id,
      v_trial_plan_id,
      'trial',
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW() + INTERVAL '30 days',
      'Trial creado automáticamente durante setup'
    FROM stores s
    WHERE NOT EXISTS (
      SELECT 1 FROM subscriptions WHERE store_id = s.id
    );

    -- Configurar créditos AI
    UPDATE store_ai_credits sac
    SET monthly_credits = 5
    WHERE store_id IN (
      SELECT id FROM stores s
      WHERE NOT EXISTS (
        SELECT 1 FROM subscriptions WHERE store_id = s.id
      )
    );

    RAISE NOTICE '✓ Suscripciones trial creadas para % tiendas', v_stores_without_sub;
  ELSE
    RAISE NOTICE '✓ Todas las tiendas tienen suscripción';
  END IF;

  -- Estadísticas
  RAISE NOTICE '';
  RAISE NOTICE 'Estadísticas de suscripciones:';
  FOR v_stat IN (
    SELECT
      status,
      COUNT(*) as count
    FROM subscriptions
    GROUP BY status
    ORDER BY count DESC
  ) LOOP
    RAISE NOTICE '  - %: %', v_stat.status, v_stat.count;
  END LOOP;
END;
$$;

-- ============================================================================
-- PASO 5: Verificar configuración de system_settings (para WhatsApp)
-- ============================================================================
DO $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  RAISE NOTICE '=== VERIFICANDO CONFIGURACIÓN WHATSAPP ===';

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    RAISE NOTICE '⚠ Tabla system_settings no existe (migración de WhatsApp no aplicada)';
  ELSE
    SELECT value INTO v_supabase_url
    FROM system_settings
    WHERE key = 'supabase_url';

    SELECT value INTO v_service_key
    FROM system_settings
    WHERE key = 'supabase_service_role_key';

    IF v_supabase_url LIKE '%YOUR_PROJECT_REF%' THEN
      RAISE NOTICE '⚠ supabase_url no está configurada';
      RAISE NOTICE '  Ejecuta: UPDATE system_settings SET value = ''https://tu-project.supabase.co'' WHERE key = ''supabase_url'';';
    ELSE
      RAISE NOTICE '✓ supabase_url configurada: %', v_supabase_url;
    END IF;

    IF v_service_key = 'YOUR_SERVICE_ROLE_KEY' THEN
      RAISE NOTICE '⚠ service_role_key no está configurada';
    ELSE
      RAISE NOTICE '✓ service_role_key configurada';
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETADO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Crear tu usuario super admin (ver instrucciones arriba)';
  RAISE NOTICE '2. Acceder a /platform-admin con tu usuario admin';
  RAISE NOTICE '3. Configurar Evolution API (si usas WhatsApp)';
  RAISE NOTICE '4. Revisar y ajustar planes según necesites';
  RAISE NOTICE '';
  RAISE NOTICE 'Documentación completa en:';
  RAISE NOTICE '  - SUBSCRIPTION_SYSTEM.md';
  RAISE NOTICE '  - SUPER_ADMIN_GUIDE.md';
  RAISE NOTICE '';
END;
$$;
