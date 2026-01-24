-- =============================================
-- Migration: Fix get_store_by_subdomain_secure RPC
-- Description: Fix incorrect check_rate_limit call (missing p_identifier_type parameter)
-- Issue: Function was failing with 404 because check_rate_limit signature doesn't match
-- =============================================

-- Drop and recreate the function with the correct check_rate_limit call
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
  -- FIXED: Added missing p_identifier_type parameter
  SELECT * INTO v_rate_limit
  FROM public.check_rate_limit(
    v_identifier,
    CASE WHEN p_ip_address IS NOT NULL THEN 'ip' ELSE 'user' END, -- p_identifier_type (was missing)
    'store_access',  -- p_action_type
    10000,           -- p_max_attempts (was 20, increased for dev)
    15               -- p_window_minutes
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

  -- Get store by subdomain - SELECT * will now include all columns
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
    NULL  -- p_user_agent (not user_id)
  );

  -- Return store data
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
'Secure store lookup with rate limiting (DEV: 10000 requests per 15 min) - Fixed check_rate_limit call';
