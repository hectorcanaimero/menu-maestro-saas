-- ============================================================================
-- Migration: Add Server-Side Auth Verification Functions
-- Issue: #2 - Implement centralized route protection for admin routes
-- Date: 2025-11-22
-- ============================================================================
-- This migration creates RPC functions for server-side authentication and
-- authorization verification, used by the ProtectedRoute component
-- ============================================================================

-- ============================================================================
-- PART 1: Verify Store Ownership (Server-Side)
-- ============================================================================

-- Function to verify if the current user owns a specific store
-- This is used by the ProtectedRoute component to verify authorization
CREATE OR REPLACE FUNCTION public.verify_store_ownership(p_store_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the authenticated user owns the specified store
  RETURN EXISTS (
    SELECT 1
    FROM public.stores
    WHERE id = p_store_id
    AND owner_id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION public.verify_store_ownership(UUID) IS
'Server-side function to verify if the authenticated user owns a specific store. Used by ProtectedRoute component.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_store_ownership(UUID) TO authenticated;

-- ============================================================================
-- PART 2: Get User Store (Convenience Function)
-- ============================================================================

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_user_owned_store();

-- Function to get the store owned by the current user
-- Returns store data if user owns a store, NULL otherwise
CREATE OR REPLACE FUNCTION public.get_user_owned_store()
RETURNS TABLE (
  id UUID,
  subdomain TEXT,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN,
  operating_mode TEXT,
  whatsapp_number TEXT,
  whatsapp_redirect BOOLEAN,
  force_status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.subdomain,
    s.name,
    s.description,
    s.logo_url,
    s.phone,
    s.email,
    s.address,
    s.is_active,
    s.operating_mode,
    s.whatsapp_number,
    s.whatsapp_redirect,
    s.force_status::TEXT
  FROM public.stores s
  WHERE s.owner_id = auth.uid()
  LIMIT 1; -- User can only own one store for now
END;
$$;

COMMENT ON FUNCTION public.get_user_owned_store() IS
'Returns the store owned by the authenticated user. Used to quickly get user store info.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_owned_store() TO authenticated;

-- ============================================================================
-- PART 3: Verify Admin Role (Enhanced)
-- ============================================================================

-- Enhanced version of has_role that also checks store ownership
-- This combines role check with store ownership verification
CREATE OR REPLACE FUNCTION public.verify_admin_access(p_store_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- User must:
  -- 1. Be authenticated
  -- 2. Have admin role
  -- 3. Own the specified store

  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.stores s ON s.owner_id = ur.user_id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND s.id = p_store_id
  );
END;
$$;

COMMENT ON FUNCTION public.verify_admin_access(UUID) IS
'Verifies that the user is both an admin AND owns the specified store. Combines role and ownership checks.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_admin_access(UUID) TO authenticated;

-- ============================================================================
-- PART 4: Get Current User Session Info
-- ============================================================================

-- Function to get current user session information
-- Useful for debugging and logging
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  has_admin_role BOOLEAN,
  owned_store_id UUID,
  owned_store_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    -- Return empty result for unauthenticated users
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_user_id,
    au.email,
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = v_user_id AND role = 'admin'
    ) as has_admin_role,
    s.id as owned_store_id,
    s.name as owned_store_name
  FROM auth.users au
  LEFT JOIN public.stores s ON s.owner_id = v_user_id
  WHERE au.id = v_user_id;
END;
$$;

COMMENT ON FUNCTION public.get_current_user_info() IS
'Returns current authenticated user information including admin status and owned store.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_info() TO authenticated;

-- ============================================================================
-- PART 5: Audit Logging Function
-- ============================================================================

-- Create audit log table for tracking authorization attempts
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource TEXT,
  store_id UUID REFERENCES public.stores(id),
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Store owners can view their audit logs" ON public.auth_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.auth_audit_log;

-- Only admins can view audit logs for their stores
CREATE POLICY "Store owners can view their audit logs"
ON public.auth_audit_log
FOR SELECT
TO authenticated
USING (
  store_id IS NOT NULL
  AND public.user_owns_store(store_id)
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.auth_audit_log
FOR INSERT
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_store_id ON public.auth_audit_log(store_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON public.auth_audit_log(created_at DESC);

-- Function to log authorization attempts
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  p_action TEXT,
  p_resource TEXT,
  p_store_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auth_audit_log (
    user_id,
    action,
    resource,
    store_id,
    success
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource,
    p_store_id,
    p_success
  );
END;
$$;

COMMENT ON FUNCTION public.log_auth_attempt(TEXT, TEXT, UUID, BOOLEAN) IS
'Logs an authentication/authorization attempt for audit purposes.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_auth_attempt(TEXT, TEXT, UUID, BOOLEAN) TO authenticated;

-- ============================================================================
-- PART 6: Helper Function for Route Protection
-- ============================================================================

-- Comprehensive function that checks all requirements for admin route access
-- This is the main function called by ProtectedRoute component
CREATE OR REPLACE FUNCTION public.can_access_admin_routes(p_store_id UUID DEFAULT NULL)
RETURNS TABLE (
  can_access BOOLEAN,
  reason TEXT,
  user_id UUID,
  store_id UUID,
  store_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_has_role BOOLEAN;
  v_store_record RECORD;
BEGIN
  -- Check 1: User is authenticated
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Not authenticated', NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Check 2: User has admin role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id AND role = 'admin'
  ) INTO v_has_role;

  IF NOT v_has_role THEN
    RETURN QUERY SELECT FALSE, 'No admin role', v_user_id, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Check 3: User owns a store (or the specified store)
  IF p_store_id IS NOT NULL THEN
    -- Check ownership of specific store
    SELECT s.* INTO v_store_record
    FROM public.stores s
    WHERE s.id = p_store_id AND s.owner_id = v_user_id;

    IF v_store_record.id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'Not the store owner', v_user_id, p_store_id, NULL::TEXT;
      RETURN;
    END IF;
  ELSE
    -- Find user's owned store
    SELECT s.* INTO v_store_record
    FROM public.stores s
    WHERE s.owner_id = v_user_id
    LIMIT 1;

    IF v_store_record.id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'No store found', v_user_id, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT
    TRUE,
    'Access granted'::TEXT,
    v_user_id,
    v_store_record.id,
    v_store_record.name;
END;
$$;

COMMENT ON FUNCTION public.can_access_admin_routes(UUID) IS
'Comprehensive check for admin route access. Returns detailed information about authorization status.';

-- Grant execute to authenticated and anonymous users (for better error messages)
GRANT EXECUTE ON FUNCTION public.can_access_admin_routes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_admin_routes(UUID) TO anon;

-- ============================================================================
-- PART 7: Testing Functions
-- ============================================================================

-- Function to test auth verification (for development)
CREATE OR REPLACE FUNCTION public.test_auth_verification()
RETURNS TABLE (
  test_name TEXT,
  result TEXT,
  details JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Authentication Test'::TEXT,
    CASE
      WHEN auth.uid() IS NOT NULL THEN 'PASS - User is authenticated'
      ELSE 'FAIL - User is not authenticated'
    END::TEXT,
    json_build_object(
      'user_id', auth.uid(),
      'timestamp', now()
    );
END;
$$;

COMMENT ON FUNCTION public.test_auth_verification() IS
'Test function for auth verification. For development use only.';

GRANT EXECUTE ON FUNCTION public.test_auth_verification() TO authenticated;

-- ============================================================================
-- PART 8: Comments and Documentation
-- ============================================================================

COMMENT ON TABLE public.auth_audit_log IS
'Audit log for tracking authentication and authorization attempts. Store owners can view logs for their stores.';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries (run these after migration):
--
-- 1. List all auth functions:
--    SELECT proname, pg_get_functiondef(oid)
--    FROM pg_proc
--    WHERE proname LIKE 'verify%' OR proname LIKE 'get_%user%' OR proname LIKE 'can_access%';
--
-- 2. Test can_access_admin_routes as authenticated user:
--    SELECT * FROM can_access_admin_routes();
--
-- 3. Test verify_store_ownership:
--    SELECT verify_store_ownership('your-store-uuid');
--
