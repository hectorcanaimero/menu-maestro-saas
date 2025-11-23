-- =====================================================
-- Migration: Strengthen Store Ownership Security
-- Issue: #3 - Audit and strengthen store ownership verification
-- Date: 2025-11-22
-- Author: Experto SaaS
-- =====================================================

-- =====================================================
-- 1. RESERVED SUBDOMAINS TABLE
-- =====================================================
-- Prevent users from creating stores with reserved subdomains

CREATE TABLE IF NOT EXISTS public.reserved_subdomains (
  subdomain TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common reserved subdomains
INSERT INTO public.reserved_subdomains (subdomain, reason) VALUES
  ('www', 'System reserved'),
  ('admin', 'System reserved'),
  ('api', 'System reserved'),
  ('app', 'System reserved'),
  ('dashboard', 'System reserved'),
  ('auth', 'System reserved'),
  ('login', 'System reserved'),
  ('signup', 'System reserved'),
  ('register', 'System reserved'),
  ('mail', 'System reserved'),
  ('email', 'System reserved'),
  ('ftp', 'System reserved'),
  ('localhost', 'System reserved'),
  ('staging', 'System reserved'),
  ('dev', 'System reserved'),
  ('test', 'System reserved'),
  ('demo', 'System reserved'),
  ('beta', 'System reserved'),
  ('secure', 'System reserved'),
  ('ssl', 'System reserved'),
  ('support', 'System reserved'),
  ('help', 'System reserved'),
  ('status', 'System reserved'),
  ('blog', 'System reserved'),
  ('docs', 'System reserved'),
  ('cdn', 'System reserved'),
  ('static', 'System reserved'),
  ('assets', 'System reserved'),
  ('media', 'System reserved'),
  ('files', 'System reserved'),
  ('upload', 'System reserved'),
  ('download', 'System reserved')
ON CONFLICT (subdomain) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.reserved_subdomains TO authenticated;
GRANT SELECT ON public.reserved_subdomains TO anon;

-- =====================================================
-- 2. STORE ACCESS LOG TABLE
-- =====================================================
-- Track all store access attempts for security monitoring

CREATE TABLE IF NOT EXISTS public.store_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  access_type TEXT NOT NULL, -- 'view', 'admin_attempt', 'ownership_check'
  success BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_access_log_store_id ON public.store_access_log(store_id);
CREATE INDEX IF NOT EXISTS idx_store_access_log_user_id ON public.store_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_store_access_log_subdomain ON public.store_access_log(subdomain);
CREATE INDEX IF NOT EXISTS idx_store_access_log_created_at ON public.store_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_access_log_ip_address ON public.store_access_log(ip_address);

-- Enable RLS
ALTER TABLE public.store_access_log ENABLE ROW LEVEL SECURITY;

-- Store owners can view their own store access logs
CREATE POLICY "Store owners can view their store access logs"
ON public.store_access_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = store_access_log.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- System can insert logs (SECURITY DEFINER functions)
CREATE POLICY "System can insert store access logs"
ON public.store_access_log FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 3. RATE LIMITING TABLE
-- =====================================================
-- Track access attempts per IP/user for rate limiting

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user_id
  identifier_type TEXT NOT NULL, -- 'ip' or 'user'
  action_type TEXT NOT NULL, -- 'store_access', 'admin_access', 'create_store'
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_until TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_identifier ON public.rate_limit_log(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_window_start ON public.rate_limit_log(window_start);

-- Enable RLS (only functions can access)
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system can manage rate limits"
ON public.rate_limit_log FOR ALL
USING (false)
WITH CHECK (false);

-- =====================================================
-- 4. SUBDOMAIN VALIDATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if subdomain is null or empty
  IF p_subdomain IS NULL OR LENGTH(TRIM(p_subdomain)) = 0 THEN
    RETURN QUERY SELECT FALSE, 'Subdomain cannot be empty'::TEXT;
    RETURN;
  END IF;

  -- Check minimum length (3 characters)
  IF LENGTH(p_subdomain) < 3 THEN
    RETURN QUERY SELECT FALSE, 'Subdomain must be at least 3 characters long'::TEXT;
    RETURN;
  END IF;

  -- Check maximum length (63 characters - DNS limit)
  IF LENGTH(p_subdomain) > 63 THEN
    RETURN QUERY SELECT FALSE, 'Subdomain must be less than 63 characters'::TEXT;
    RETURN;
  END IF;

  -- Check format: only lowercase letters, numbers, and hyphens
  IF p_subdomain !~ '^[a-z0-9-]+$' THEN
    RETURN QUERY SELECT FALSE, 'Subdomain can only contain lowercase letters, numbers, and hyphens'::TEXT;
    RETURN;
  END IF;

  -- Check: cannot start or end with hyphen
  IF p_subdomain ~ '^-' OR p_subdomain ~ '-$' THEN
    RETURN QUERY SELECT FALSE, 'Subdomain cannot start or end with a hyphen'::TEXT;
    RETURN;
  END IF;

  -- Check: cannot have consecutive hyphens
  IF p_subdomain ~ '--' THEN
    RETURN QUERY SELECT FALSE, 'Subdomain cannot contain consecutive hyphens'::TEXT;
    RETURN;
  END IF;

  -- Check if subdomain is reserved
  IF EXISTS (SELECT 1 FROM public.reserved_subdomains WHERE subdomain = p_subdomain) THEN
    RETURN QUERY SELECT FALSE, 'This subdomain is reserved and cannot be used'::TEXT;
    RETURN;
  END IF;

  -- Check if subdomain already exists
  IF EXISTS (SELECT 1 FROM public.stores WHERE subdomain = p_subdomain) THEN
    RETURN QUERY SELECT FALSE, 'This subdomain is already taken'::TEXT;
    RETURN;
  END IF;

  -- All validations passed
  RETURN QUERY SELECT TRUE, 'Valid subdomain'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_subdomain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_subdomain(TEXT) TO anon;

-- =====================================================
-- 5. RATE LIMITING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_attempts INTEGER,
  reset_at TIMESTAMPTZ,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_window_start TIMESTAMPTZ;
  v_now TIMESTAMPTZ;
BEGIN
  v_now := NOW();
  v_window_start := v_now - (p_window_minutes || ' minutes')::INTERVAL;

  -- Clean up old records (older than 24 hours)
  DELETE FROM public.rate_limit_log
  WHERE window_start < (v_now - INTERVAL '24 hours');

  -- Get current rate limit record
  SELECT * INTO v_record
  FROM public.rate_limit_log
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND action_type = p_action_type
    AND window_start > v_window_start;

  -- Check if currently blocked
  IF v_record.is_blocked AND v_record.blocked_until > v_now THEN
    RETURN QUERY SELECT
      FALSE,
      0,
      v_record.blocked_until,
      'Rate limit exceeded. Too many attempts.'::TEXT;
    RETURN;
  END IF;

  -- If no record or window expired, create/reset
  IF v_record IS NULL OR v_record.window_start <= v_window_start THEN
    INSERT INTO public.rate_limit_log (
      identifier,
      identifier_type,
      action_type,
      attempt_count,
      window_start,
      last_attempt
    ) VALUES (
      p_identifier,
      p_identifier_type,
      p_action_type,
      1,
      v_now,
      v_now
    )
    ON CONFLICT (id) DO UPDATE SET
      attempt_count = 1,
      window_start = v_now,
      last_attempt = v_now,
      is_blocked = FALSE,
      blocked_until = NULL;

    RETURN QUERY SELECT
      TRUE,
      p_max_attempts - 1,
      v_now + (p_window_minutes || ' minutes')::INTERVAL,
      'Request allowed'::TEXT;
    RETURN;
  END IF;

  -- Increment attempt count
  UPDATE public.rate_limit_log
  SET attempt_count = attempt_count + 1,
      last_attempt = v_now
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND action_type = p_action_type;

  -- Check if exceeded limit
  IF v_record.attempt_count + 1 > p_max_attempts THEN
    -- Block for the remaining window time
    UPDATE public.rate_limit_log
    SET is_blocked = TRUE,
        blocked_until = v_now + (p_window_minutes || ' minutes')::INTERVAL
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND action_type = p_action_type;

    RETURN QUERY SELECT
      FALSE,
      0,
      v_now + (p_window_minutes || ' minutes')::INTERVAL,
      'Rate limit exceeded. Too many attempts.'::TEXT;
    RETURN;
  END IF;

  -- Still within limit
  RETURN QUERY SELECT
    TRUE,
    p_max_attempts - (v_record.attempt_count + 1),
    v_now + (p_window_minutes || ' minutes')::INTERVAL,
    'Request allowed'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO anon;

-- =====================================================
-- 6. LOG STORE ACCESS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_store_access(
  p_store_id UUID,
  p_subdomain TEXT,
  p_access_type TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  INSERT INTO public.store_access_log (
    store_id,
    subdomain,
    user_id,
    ip_address,
    user_agent,
    access_type,
    success,
    failure_reason
  ) VALUES (
    p_store_id,
    p_subdomain,
    v_user_id,
    p_ip_address,
    p_user_agent,
    p_access_type,
    p_success,
    p_failure_reason
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_store_access(UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_store_access(UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO anon;

-- =====================================================
-- 7. ENHANCED STORE LOOKUP FUNCTION WITH SECURITY
-- =====================================================

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

  -- Check rate limit (10 attempts per 15 minutes per IP)
  SELECT * INTO v_rate_limit
  FROM public.check_rate_limit(
    v_identifier,
    CASE WHEN p_ip_address IS NOT NULL THEN 'ip' ELSE 'user' END,
    'store_access',
    20, -- max attempts
    15  -- window in minutes
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

  -- Lookup store
  SELECT * INTO v_store
  FROM public.stores
  WHERE subdomain = p_subdomain
    AND is_active = TRUE;

  IF v_store IS NULL THEN
    -- Log failed lookup
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
      TRUE,
      'Store not found'::TEXT;
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
    NULL
  );

  -- Return store data
  RETURN QUERY SELECT
    v_store.id,
    row_to_json(v_store)::JSONB,
    (v_user_id IS NOT NULL AND v_user_id = v_store.owner_id),
    TRUE,
    NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain_secure(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain_secure(TEXT, TEXT) TO anon;

-- =====================================================
-- 8. DETECT SUSPICIOUS ACCESS PATTERNS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_suspicious_access_patterns(
  p_store_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  pattern_type TEXT,
  count BIGINT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_time_window TIMESTAMPTZ;
BEGIN
  v_time_window := NOW() - (p_hours || ' hours')::INTERVAL;

  -- Check if user owns the store
  IF NOT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = p_store_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not the store owner';
  END IF;

  -- Pattern 1: Multiple failed admin access attempts from same IP
  RETURN QUERY
  SELECT
    'multiple_failed_admin_attempts'::TEXT,
    COUNT(*),
    jsonb_build_object(
      'ip_addresses', jsonb_agg(DISTINCT ip_address),
      'latest_attempt', MAX(created_at)
    )
  FROM public.store_access_log
  WHERE store_id = p_store_id
    AND access_type = 'admin_attempt'
    AND success = FALSE
    AND created_at > v_time_window
  GROUP BY ip_address
  HAVING COUNT(*) > 5;

  -- Pattern 2: Access from multiple IPs by same user
  RETURN QUERY
  SELECT
    'multiple_ip_same_user'::TEXT,
    COUNT(DISTINCT ip_address),
    jsonb_build_object(
      'user_id', user_id,
      'ip_addresses', jsonb_agg(DISTINCT ip_address),
      'count', COUNT(DISTINCT ip_address)
    )
  FROM public.store_access_log
  WHERE store_id = p_store_id
    AND user_id IS NOT NULL
    AND created_at > v_time_window
  GROUP BY user_id
  HAVING COUNT(DISTINCT ip_address) > 3;

  -- Pattern 3: Unusual access volume from single IP
  RETURN QUERY
  SELECT
    'high_volume_single_ip'::TEXT,
    COUNT(*),
    jsonb_build_object(
      'ip_address', ip_address,
      'access_count', COUNT(*),
      'time_range', jsonb_build_object(
        'first', MIN(created_at),
        'last', MAX(created_at)
      )
    )
  FROM public.store_access_log
  WHERE store_id = p_store_id
    AND created_at > v_time_window
  GROUP BY ip_address
  HAVING COUNT(*) > 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_suspicious_access_patterns(UUID, INTEGER) TO authenticated;

-- =====================================================
-- 9. UPDATE STORES TABLE CONSTRAINT
-- =====================================================

-- Add check constraint for subdomain format
ALTER TABLE public.stores
ADD CONSTRAINT stores_subdomain_format_check
CHECK (
  subdomain ~ '^[a-z0-9-]+$' AND
  subdomain !~ '^-' AND
  subdomain !~ '-$' AND
  subdomain !~ '--' AND
  LENGTH(subdomain) >= 3 AND
  LENGTH(subdomain) <= 63
);

-- Add trigger to prevent reserved subdomains
CREATE OR REPLACE FUNCTION public.prevent_reserved_subdomain()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.reserved_subdomains WHERE subdomain = NEW.subdomain) THEN
    RAISE EXCEPTION 'Subdomain "%" is reserved and cannot be used', NEW.subdomain;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_reserved_subdomain ON public.stores;
CREATE TRIGGER trigger_prevent_reserved_subdomain
  BEFORE INSERT OR UPDATE OF subdomain ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_reserved_subdomain();

-- =====================================================
-- 10. CLEANUP FUNCTION FOR OLD LOGS
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete store access logs older than 90 days
  DELETE FROM public.store_access_log
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Delete auth audit logs older than 90 days
  DELETE FROM public.auth_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Delete rate limit logs older than 24 hours
  DELETE FROM public.rate_limit_log
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;

-- =====================================================
-- SUMMARY
-- =====================================================

-- This migration adds:
-- ✅ Reserved subdomains prevention (33 common reserved names)
-- ✅ Store access logging for security monitoring
-- ✅ Rate limiting (20 attempts per 15 minutes per IP)
-- ✅ Enhanced subdomain validation (length, format, reserved check)
-- ✅ Secure store lookup function with rate limiting
-- ✅ Suspicious access pattern detection
-- ✅ Database-level subdomain constraints
-- ✅ Automatic cleanup of old logs

-- To test:
-- SELECT * FROM validate_subdomain('test-store-123');
-- SELECT * FROM get_store_by_subdomain_secure('totus', '192.168.1.1');
-- SELECT * FROM check_rate_limit('192.168.1.1', 'ip', 'store_access', 10, 15);
-- SELECT * FROM get_suspicious_access_patterns('store-uuid-here', 24);
