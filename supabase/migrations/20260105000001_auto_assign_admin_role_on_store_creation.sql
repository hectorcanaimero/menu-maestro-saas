-- Migration: Auto-assign admin role when store is created
-- Description: Creates a trigger to automatically assign 'admin' role to store owners
-- Created: 2026-01-05
-- Issue: PIDEA-100 - Users get "no admin permission" error when accessing admin routes
-- Purpose: Ensure all store owners automatically get admin role when they create a store

-- ============================================================================
-- PART 1: Function to assign admin role to store owner
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assign_admin_role_to_store_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert admin role for the store owner
  -- Use ON CONFLICT to avoid errors if role already exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.owner_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.assign_admin_role_to_store_owner() IS
'Automatically assigns admin role to store owner when a new store is created. Used by trigger on stores table.';

-- ============================================================================
-- PART 2: Create trigger on stores table
-- ============================================================================

DROP TRIGGER IF EXISTS assign_admin_role_on_store_creation ON public.stores;

CREATE TRIGGER assign_admin_role_on_store_creation
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.assign_admin_role_to_store_owner();

COMMENT ON TRIGGER assign_admin_role_on_store_creation ON public.stores IS
'Trigger that automatically assigns admin role to new store owners. Prevents "no admin permission" errors.';

-- ============================================================================
-- PART 3: Backfill existing stores (in case any were created without admin role)
-- ============================================================================

-- This is a safety net - ensure all existing store owners have admin role
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT s.owner_id, 'admin'::app_role
FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = s.owner_id AND ur.role = 'admin'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification:
-- 1. Check if trigger exists:
--    SELECT tgname, tgtype, tgenabled FROM pg_trigger WHERE tgname = 'assign_admin_role_on_store_creation';
--
-- 2. Verify all store owners have admin role:
--    SELECT s.owner_id, s.name, ur.role
--    FROM stores s
--    LEFT JOIN user_roles ur ON ur.user_id = s.owner_id AND ur.role = 'admin'
--    WHERE ur.role IS NULL;  -- Should return no rows
--
-- 3. Test by creating a new store and checking if admin role is assigned automatically
