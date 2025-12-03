-- Fix get_store_by_subdomain_secure function
-- Remove the extra user_id parameter in log_store_access call

CREATE OR REPLACE FUNCTION public.get_store_by_subdomain_secure(
  p_subdomain TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  subdomain TEXT,
  name TEXT,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  social_instagram TEXT,
  social_facebook TEXT,
  social_twitter TEXT,
  social_whatsapp TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accept_cash BOOLEAN,
  minimum_order_price NUMERIC,
  delivery_price NUMERIC,
  operating_modes TEXT[],
  owner_id UUID,
  is_active BOOLEAN,
  require_payment_proof BOOLEAN,
  whatsapp_number TEXT,
  whatsapp_redirect_enabled BOOLEAN,
  whatsapp_message_delivery TEXT,
  whatsapp_message_pickup TEXT,
  whatsapp_message_digital_menu TEXT,
  remove_zipcode BOOLEAN,
  remove_address_number BOOLEAN,
  delivery_price_mode TEXT,
  fixed_delivery_price NUMERIC,
  store_lat DOUBLE PRECISION,
  store_lng DOUBLE PRECISION,
  force_status TEXT,
  notification_sound_enabled BOOLEAN,
  notification_sound_volume INTEGER,
  notification_sound_repeat_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store RECORD;
  v_rate_limit RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Check rate limit (but don't enforce in development)
  SELECT * INTO v_rate_limit FROM public.check_rate_limit(COALESCE(p_ip_address, 'unknown'));

  IF NOT v_rate_limit.allowed THEN
    -- Log failed attempt (7 parameters only)
    PERFORM public.log_store_access(
      NULL,
      p_subdomain,
      'view',
      FALSE,
      'Rate limit exceeded',
      p_ip_address,
      NULL
    );

    RETURN QUERY SELECT
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT[], NULL::UUID,
      FALSE, FALSE, NULL::TEXT, FALSE, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, FALSE, FALSE, NULL::TEXT, NULL::NUMERIC,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::TEXT,
      FALSE, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Query the store
  SELECT * INTO v_store FROM public.stores WHERE subdomain = p_subdomain AND is_active = TRUE LIMIT 1;

  IF NOT FOUND THEN
    -- Log failed attempt (7 parameters only)
    PERFORM public.log_store_access(
      NULL,
      p_subdomain,
      'view',
      FALSE,
      'Store not found',
      p_ip_address,
      NULL
    );

    RETURN QUERY SELECT
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT[], NULL::UUID,
      FALSE, FALSE, NULL::TEXT, FALSE, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, FALSE, FALSE, NULL::TEXT, NULL::NUMERIC,
      NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, NULL::TEXT,
      FALSE, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Log successful access (7 parameters only - removed v_user_id)
  PERFORM public.log_store_access(
    v_store.id,
    p_subdomain,
    'view',
    TRUE,
    NULL,
    p_ip_address,
    NULL
  );

  -- Return store data
  RETURN QUERY SELECT
    v_store.id,
    v_store.subdomain,
    v_store.name,
    v_store.logo_url,
    v_store.banner_url,
    v_store.description,
    v_store.phone,
    v_store.email,
    v_store.address,
    v_store.social_instagram,
    v_store.social_facebook,
    v_store.social_twitter,
    v_store.social_whatsapp,
    v_store.primary_color,
    v_store.secondary_color,
    v_store.accept_cash,
    v_store.minimum_order_price,
    v_store.delivery_price,
    v_store.operating_modes,
    v_store.owner_id,
    v_store.is_active,
    v_store.require_payment_proof,
    v_store.whatsapp_number,
    v_store.whatsapp_redirect_enabled,
    v_store.whatsapp_message_delivery,
    v_store.whatsapp_message_pickup,
    v_store.whatsapp_message_digital_menu,
    v_store.remove_zipcode,
    v_store.remove_address_number,
    v_store.delivery_price_mode,
    v_store.fixed_delivery_price,
    v_store.store_lat,
    v_store.store_lng,
    v_store.force_status,
    v_store.notification_sound_enabled,
    v_store.notification_sound_volume,
    v_store.notification_sound_repeat_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain_secure(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain_secure(TEXT, TEXT) TO anon;
