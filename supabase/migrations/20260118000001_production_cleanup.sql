-- =====================================================
-- MIGRACIÓN PARA PREPARAR SUPABASE PARA PRODUCCIÓN
-- =====================================================
-- Este script:
-- 1. Agrega el segundo super admin (tresestudiocreativoweb@gmail.com)
-- 2. Marca la tienda 'totus' como demo protegida
-- 3. Limpia datos de prueba (preservando sistema y tienda demo)
-- 4. Limpia archivos de storage de tiendas eliminadas
-- 5. Verifica integridad del sistema

-- =====================================================
-- 1. AGREGAR SEGUNDO SUPER ADMIN
-- =====================================================

-- Primero verificar si el usuario tresestudiocreativoweb@gmail.com existe
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar el user_id del email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'tresestudiocreativoweb@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Insertar o actualizar en platform_admins
    INSERT INTO platform_admins (user_id, role, is_active, created_by)
    VALUES (
      v_user_id,
      'super_admin',
      true,
      (SELECT id FROM auth.users WHERE email = 'knaimero@gmail.com' LIMIT 1)
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      role = 'super_admin',
      is_active = true,
      updated_at = now();

    -- Actualizar el profile a admin también
    UPDATE profiles
    SET role = 'admin'
    WHERE id = v_user_id;

    RAISE NOTICE 'Super admin tresestudiocreativoweb@gmail.com configurado correctamente';
  ELSE
    RAISE NOTICE 'Usuario tresestudiocreativoweb@gmail.com no existe aún. Debe registrarse primero.';
  END IF;
END $$;

-- =====================================================
-- 2. MARCAR TIENDA TOTUS COMO DEMO PROTEGIDA
-- =====================================================

-- Agregar columna is_demo_store si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'is_demo_store'
  ) THEN
    ALTER TABLE stores ADD COLUMN is_demo_store boolean DEFAULT false;
    COMMENT ON COLUMN stores.is_demo_store IS 'Tienda de demostración protegida que no debe ser eliminada';
  END IF;
END $$;

-- Marcar totus como demo
UPDATE stores
SET is_demo_store = true
WHERE subdomain = 'totus';

-- =====================================================
-- 3. FUNCIÓN AUXILIAR: OBTENER TIENDAS A ELIMINAR
-- =====================================================

CREATE OR REPLACE FUNCTION get_stores_to_delete()
RETURNS TABLE (
  store_id uuid,
  store_name text,
  subdomain text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.subdomain
  FROM stores s
  WHERE s.subdomain != 'totus'  -- Preservar tienda demo
    AND s.is_demo_store IS DISTINCT FROM true;  -- No eliminar demos
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. SCRIPT DE LIMPIEZA DE DATOS DE PRUEBA
-- =====================================================

DO $$
DECLARE
  v_store_record RECORD;
  v_deleted_count INT := 0;
  v_total_stores INT;
BEGIN
  -- Contar tiendas a eliminar
  SELECT COUNT(*) INTO v_total_stores
  FROM get_stores_to_delete();

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'INICIANDO LIMPIEZA DE PRODUCCIÓN';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Tiendas a eliminar: %', v_total_stores;
  RAISE NOTICE '';

  -- Iterar sobre cada tienda a eliminar
  FOR v_store_record IN
    SELECT * FROM get_stores_to_delete()
  LOOP
    v_deleted_count := v_deleted_count + 1;

    RAISE NOTICE '[%/%] Eliminando tienda: % (subdomain: %)',
      v_deleted_count, v_total_stores,
      v_store_record.store_name, v_store_record.subdomain;

    -- Eliminar en orden correcto (respetando foreign keys)

    -- 1. WhatsApp relacionado
    DELETE FROM whatsapp_messages WHERE store_id = v_store_record.store_id;
    DELETE FROM whatsapp_campaigns WHERE store_id = v_store_record.store_id;
    DELETE FROM whatsapp_message_templates WHERE store_id = v_store_record.store_id;
    DELETE FROM whatsapp_credits WHERE store_id = v_store_record.store_id;
    DELETE FROM whatsapp_settings WHERE store_id = v_store_record.store_id;

    -- 2. Delivery/Drivers relacionado
    DELETE FROM driver_locations
    WHERE driver_id IN (SELECT id FROM drivers WHERE store_id = v_store_record.store_id);
    DELETE FROM delivery_assignments WHERE store_id = v_store_record.store_id;
    DELETE FROM drivers WHERE store_id = v_store_record.store_id;

    -- 3. Órdenes y sus dependencias
    DELETE FROM order_item_extras
    WHERE order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.store_id = v_store_record.store_id
    );
    DELETE FROM order_items
    WHERE order_id IN (SELECT id FROM orders WHERE store_id = v_store_record.store_id);
    DELETE FROM order_status_history WHERE store_id = v_store_record.store_id;
    DELETE FROM orders WHERE store_id = v_store_record.store_id;

    -- 4. Productos y extras
    DELETE FROM product_extra_group_assignments
    WHERE product_id IN (SELECT id FROM menu_items WHERE store_id = v_store_record.store_id);
    DELETE FROM product_group_overrides
    WHERE product_id IN (SELECT id FROM menu_items WHERE store_id = v_store_record.store_id);
    DELETE FROM product_extras
    WHERE menu_item_id IN (SELECT id FROM menu_items WHERE store_id = v_store_record.store_id);
    DELETE FROM ai_enhancement_history WHERE store_id = v_store_record.store_id;
    DELETE FROM menu_items WHERE store_id = v_store_record.store_id;

    -- 5. Extra groups
    DELETE FROM extra_groups WHERE store_id = v_store_record.store_id;

    -- 6. Categorías
    DELETE FROM categories WHERE store_id = v_store_record.store_id;

    -- 7. Suscripciones y pagos
    DELETE FROM payment_validations
    WHERE subscription_id IN (SELECT id FROM subscriptions WHERE store_id = v_store_record.store_id);
    DELETE FROM subscription_audit_log
    WHERE subscription_id IN (SELECT id FROM subscriptions WHERE store_id = v_store_record.store_id);
    DELETE FROM subscriptions WHERE store_id = v_store_record.store_id;

    -- 8. Promociones y cupones
    DELETE FROM coupon_usages WHERE store_id = v_store_record.store_id;
    DELETE FROM coupons WHERE store_id = v_store_record.store_id;
    DELETE FROM promotions WHERE store_id = v_store_record.store_id;

    -- 9. Otros datos de tienda
    DELETE FROM abandoned_carts WHERE store_id = v_store_record.store_id;
    DELETE FROM store_ai_credits WHERE store_id = v_store_record.store_id;
    DELETE FROM payment_methods WHERE store_id = v_store_record.store_id;
    DELETE FROM delivery_zones WHERE store_id = v_store_record.store_id;
    DELETE FROM store_hours WHERE store_id = v_store_record.store_id;
    DELETE FROM store_access_log WHERE store_id = v_store_record.store_id;
    DELETE FROM exchange_rates WHERE store_id = v_store_record.store_id;
    DELETE FROM catalog_views_monthly WHERE store_id = v_store_record.store_id;
    DELETE FROM social_links WHERE store_id = v_store_record.store_id;
    DELETE FROM auth_audit_log WHERE store_id = v_store_record.store_id;

    -- 10. Finalmente eliminar la tienda
    DELETE FROM stores WHERE id = v_store_record.store_id;

    RAISE NOTICE '   ✓ Tienda eliminada completamente';
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'LIMPIEZA COMPLETADA';
  RAISE NOTICE 'Total de tiendas eliminadas: %', v_deleted_count;
  RAISE NOTICE '==============================================';

  -- Limpiar otros datos no relacionados a tiendas
  RAISE NOTICE '';
  RAISE NOTICE 'Limpiando datos adicionales...';

  -- Limpiar rate limit log antiguo (más de 30 días)
  DELETE FROM rate_limit_log
  WHERE last_attempt < NOW() - INTERVAL '30 days';

  RAISE NOTICE '✓ Rate limit logs antiguos eliminados';

  -- Limpiar customers huérfanos (sin órdenes)
  DELETE FROM customers
  WHERE id NOT IN (SELECT DISTINCT customer_id FROM orders WHERE customer_id IS NOT NULL);

  RAISE NOTICE '✓ Customers huérfanos eliminados';

END $$;

-- =====================================================
-- 5. FUNCIÓN PARA LIMPIAR STORAGE
-- =====================================================

-- Nota: Esta función debe ejecutarse manualmente después de la migración
-- porque requiere acceso a storage APIs

COMMENT ON COLUMN stores.is_demo_store IS
'INSTRUCCIONES POST-MIGRACIÓN:

1. Ejecutar limpieza de storage manualmente desde el dashboard de Supabase:

   Buckets a limpiar:
   - menu-images: Eliminar archivos de tiendas borradas
   - store-assets: Eliminar archivos de tiendas borradas
   - payment-proofs: Considerar eliminar archivos antiguos (opcional)

2. Verificar que solo queden archivos de:
   - Tienda "totus" (demo)
   - Archivos del sistema

3. Opcional: Configurar políticas de limpieza automática de storage
';

-- =====================================================
-- 6. FUNCIÓN DE PROTECCIÓN PARA TIENDA DEMO
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_demo_store_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_demo_store = true THEN
    RAISE EXCEPTION 'No se puede eliminar una tienda de demostración';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para proteger tienda demo
DROP TRIGGER IF EXISTS protect_demo_stores ON stores;
CREATE TRIGGER protect_demo_stores
  BEFORE DELETE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION prevent_demo_store_deletion();

-- =====================================================
-- 7. VERIFICACIÓN DE INTEGRIDAD
-- =====================================================

DO $$
DECLARE
  v_stores_count INT;
  v_plans_count INT;
  v_payment_methods_count INT;
  v_admins_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'VERIFICACIÓN DE INTEGRIDAD';
  RAISE NOTICE '==============================================';

  -- Verificar datos del sistema
  SELECT COUNT(*) INTO v_plans_count FROM subscription_plans WHERE is_active = true;
  SELECT COUNT(*) INTO v_payment_methods_count FROM platform_payment_methods WHERE is_active = true;
  SELECT COUNT(*) INTO v_admins_count FROM platform_admins WHERE is_active = true;
  SELECT COUNT(*) INTO v_stores_count FROM stores;

  RAISE NOTICE 'Planes de suscripción activos: %', v_plans_count;
  RAISE NOTICE 'Métodos de pago de plataforma: %', v_payment_methods_count;
  RAISE NOTICE 'Super admins activos: %', v_admins_count;
  RAISE NOTICE 'Tiendas en producción: %', v_stores_count;

  -- Verificaciones
  IF v_plans_count = 0 THEN
    RAISE WARNING 'No hay planes de suscripción activos';
  END IF;

  IF v_payment_methods_count = 0 THEN
    RAISE WARNING 'No hay métodos de pago de plataforma configurados';
  END IF;

  IF v_admins_count < 2 THEN
    RAISE WARNING 'Solo hay % super admin(s). Se esperaban 2.', v_admins_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✓ Verificación completada';
  RAISE NOTICE '==============================================';
END $$;

-- =====================================================
-- 8. LIMPIAR FUNCIONES AUXILIARES
-- =====================================================

DROP FUNCTION IF EXISTS get_stores_to_delete();
