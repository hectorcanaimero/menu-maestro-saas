-- ============================================================================
-- Script CORREGIDO para aplicar migraciones faltantes en producción
-- ============================================================================
--
-- NOTA IMPORTANTE:
-- La función can_access_admin_routes() YA EXISTE en producción
-- pero devuelve una TABLE, no un BOOLEAN.
--
-- Este script solo crea/actualiza get_store_by_subdomain_secure()
--
-- ============================================================================

-- 1. Función get_store_by_subdomain_secure
-- ============================================================================

-- Drop si existe para evitar conflictos
DROP FUNCTION IF EXISTS public.get_store_by_subdomain_secure(TEXT);

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

-- ============================================================================
-- 2. La función can_access_admin_routes YA EXISTE
-- ============================================================================

-- NO NECESITA SER CREADA - Ya existe en producción
-- Devuelve: TABLE (can_access BOOLEAN, reason TEXT, user_id UUID, store_id UUID, store_name TEXT)
--
-- Si necesitas usarla en código:
--   const { data } = await supabase.rpc('can_access_admin_routes', { p_store_id: storeId })
--   const canAccess = data?.[0]?.can_access || false

-- ============================================================================
-- Verificación
-- ============================================================================

-- Verificar que get_store_by_subdomain_secure se creó correctamente
SELECT
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_store_by_subdomain_secure';

-- Verificar que can_access_admin_routes existe (debería ya existir)
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'can_access_admin_routes';

-- ============================================================================
-- ÉXITO
-- ============================================================================

-- Si ves estas 2 funciones en los resultados, todo está bien:
-- 1. get_store_by_subdomain_secure (recién creada)
-- 2. can_access_admin_routes (ya existía)
