-- ============================================================================
-- Script para aplicar migraciones faltantes en producción
-- ============================================================================
--
-- Este script contiene las funciones RPC que faltan en producción
-- Ejecuta esto en el SQL Editor de Supabase
--
-- ============================================================================

-- 1. Función get_store_by_subdomain_secure
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_store_by_subdomain_secure(p_subdomain TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subdomain TEXT,
  phone TEXT,
  email TEXT,
  operating_modes TEXT[],
  force_status TEXT,
  catalog_mode BOOLEAN,
  owner_id UUID,
  currency TEXT,
  decimal_places INTEGER,
  decimal_separator TEXT,
  thousands_separator TEXT,
  accept_cash BOOLEAN,
  require_payment_proof BOOLEAN,
  order_product_template TEXT,
  order_message_template_delivery TEXT,
  order_message_template_pickup TEXT,
  order_message_template_digital_menu TEXT,
  estimated_delivery_time TEXT,
  skip_payment_digital_menu BOOLEAN,
  delivery_price_mode TEXT,
  fixed_delivery_price NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  whatsapp_redirect_enabled BOOLEAN,
  whatsapp_order_template_delivery TEXT,
  whatsapp_order_template_pickup TEXT,
  notification_volume INTEGER,
  notification_repeat_count INTEGER,
  notification_enabled BOOLEAN,
  address TEXT,
  is_food_business BOOLEAN,
  free_delivery_enabled BOOLEAN,
  free_delivery_min_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.subdomain,
    s.phone,
    s.email,
    s.operating_modes,
    s.force_status,
    s.catalog_mode,
    s.owner_id,
    s.currency,
    s.decimal_places,
    s.decimal_separator,
    s.thousands_separator,
    s.accept_cash,
    s.require_payment_proof,
    s.order_product_template,
    s.order_message_template_delivery,
    s.order_message_template_pickup,
    s.order_message_template_digital_menu,
    s.estimated_delivery_time,
    s.skip_payment_digital_menu,
    s.delivery_price_mode,
    s.fixed_delivery_price,
    s.created_at,
    s.updated_at,
    s.whatsapp_redirect_enabled,
    s.whatsapp_order_template_delivery,
    s.whatsapp_order_template_pickup,
    s.notification_volume,
    s.notification_repeat_count,
    s.notification_enabled,
    s.address,
    s.is_food_business,
    s.free_delivery_enabled,
    s.free_delivery_min_amount
  FROM public.stores s
  WHERE s.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain_secure(TEXT) TO anon, authenticated;

-- 2. Función can_access_admin_routes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_access_admin_routes(p_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_owner BOOLEAN;
  v_is_platform_admin BOOLEAN;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  -- If no user is logged in, deny access
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user is the store owner
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = p_store_id AND owner_id = v_user_id
  ) INTO v_is_owner;

  -- Check if user is a platform admin
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = v_user_id AND is_active = true
  ) INTO v_is_platform_admin;

  -- Return true if user is owner or platform admin
  RETURN v_is_owner OR v_is_platform_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_access_admin_routes(UUID) TO anon, authenticated;

-- 3. Refresh materialized views si existen
-- ============================================================================

DO $$
BEGIN
  -- Refresh materialized views if they exist
  IF EXISTS (
    SELECT 1 FROM pg_matviews
    WHERE schemaname = 'public' AND matviewname = 'store_metrics'
  ) THEN
    REFRESH MATERIALIZED VIEW public.store_metrics;
  END IF;
END $$;

-- ============================================================================
-- Verificación
-- ============================================================================

-- Verificar que las funciones se crearon correctamente
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_store_by_subdomain_secure', 'can_access_admin_routes')
ORDER BY routine_name;
