-- =============================================
-- Migration: Refresh get_store_by_subdomain_secure RPC
-- Description: Force recreation of the function to pick up new free_delivery columns
-- Issue: PIDEA-109
-- =============================================

-- Drop and recreate the function to ensure it picks up the new columns
DROP FUNCTION IF EXISTS public.get_store_by_subdomain_secure(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_store_by_subdomain_secure(
  p_subdomain TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  store_id UUID,
  store_data JSONB,
  is_owner BOOLEAN,
  rate_limit_ok BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store RECORD;
  v_user_id UUID;
  v_rate_limit RECORD;
  v_identifier TEXT;
BEGIN
  v_user_id := auth.uid();

  -- Use IP address for rate limiting if provided, otherwise user_id
  v_identifier := COALESCE(p_ip_address, v_user_id::TEXT, 'anonymous');

  -- Check rate limit with MUCH HIGHER limits for development
  -- Changed from 20 attempts / 15 minutes to 10000 attempts / 15 minutes
  SELECT * INTO v_rate_limit
  FROM public.check_rate_limit(
    v_identifier,
    'store_access',
    10000, -- max attempts (was 20)
    15     -- window in minutes
  );

  IF NOT v_rate_limit.allowed THEN
    -- Log failed attempt
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
      NULL::UUID,
      NULL::JSONB,
      FALSE,
      FALSE,
      'Too many requests. Please try again later.'::TEXT;
    RETURN;
  END IF;

  -- Get store by subdomain - SELECT * will now include free_delivery columns
  SELECT * INTO v_store
  FROM public.stores
  WHERE subdomain = p_subdomain
    AND is_active = TRUE;

  IF NOT FOUND THEN
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
      NULL::UUID,
      NULL::JSONB,
      FALSE,
      TRUE, -- rate limit ok, but store not found
      'Store not found or inactive'::TEXT;
    RETURN;
  END IF;

  -- Log successful access
  PERFORM public.log_store_access(
    v_store.id,
    p_subdomain,
    'view',
    TRUE,
    NULL,
    p_ip_address,
    v_user_id
  );

  -- Return store data - to_jsonb will now include free_delivery_enabled and global_free_delivery_min_amount
  RETURN QUERY SELECT
    v_store.id,
    to_jsonb(v_store),
    (v_user_id = v_store.owner_id),
    TRUE,
    NULL::TEXT;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain_secure(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain_secure(TEXT, TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_store_by_subdomain_secure IS
'Secure store lookup with rate limiting (DEV: 10000 requests per 15 min) - Updated to include free_delivery fields';
