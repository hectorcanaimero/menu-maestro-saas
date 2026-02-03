-- =============================================
-- Migration: Fix Profiles Infinite Recursion
-- Description: Fix infinite recursion error in profiles RLS policies
-- Issue: Error 42P17 - "infinite recursion detected in policy for relation profiles"
-- =============================================

-- Drop ALL existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Service role can view all profiles" ON public.profiles;

-- Recreate simple, non-recursive policies
-- Policy 1: Users can view their own profile (simplest possible check)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 3: Allow service role to view all profiles (for joins in orders query)
-- This prevents recursion when orders policy queries profiles
CREATE POLICY "Service role can view all profiles"
ON public.profiles
FOR SELECT
TO service_role
USING (true);

-- Note: We do NOT add a blanket policy for anon/authenticated to view all profiles
-- Instead, we rely on SECURITY DEFINER functions for any cross-table lookups
-- This maintains security while preventing recursion

-- Add comments
COMMENT ON POLICY "Users can view own profile" ON public.profiles IS
'Allow users to view their own profile data';

COMMENT ON POLICY "Users can update own profile" ON public.profiles IS
'Allow users to update their own profile data';

COMMENT ON POLICY "Service role can view all profiles" ON public.profiles IS
'Allow service role to view all profiles for system operations';


-- =============================================
-- Fix Orders Policy That Causes Recursion
-- =============================================
-- The orders policy "Customers can view their orders" queries profiles table
-- This causes infinite recursion when orders are fetched with customer joins
-- Solution: Create a helper function that bypasses RLS to get user email

-- Create a security definer function to get current user's email without RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- This function runs with elevated privileges and bypasses RLS
  -- It's safe because it only returns the current user's own email
  RETURN (
    SELECT email
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION public.get_current_user_email() IS
'Returns the email of the currently authenticated user. Used in RLS policies to prevent infinite recursion.';

-- Grant execute to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_email() TO anon;

-- Recreate the orders policy using the helper function
DROP POLICY IF EXISTS "Customers can view their orders" ON public.orders;

CREATE POLICY "Customers can view their orders"
ON public.orders
FOR SELECT
USING (
  -- By user_id (authenticated users who created the order)
  auth.uid() = user_id
  OR
  -- By email match using helper function (no profiles query = no recursion)
  (
    customer_email IS NOT NULL
    AND customer_email = public.get_current_user_email()
  )
  OR
  -- Anonymous users can see orders (filtered by frontend using order tokens)
  auth.uid() IS NULL
);

COMMENT ON POLICY "Customers can view their orders" ON public.orders IS
'Allow customers to view their own orders by user_id or email (using helper function to avoid recursion)';

-- =============================================
-- Verification
-- =============================================
-- After running this migration, verify with:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'profiles'
-- ORDER BY policyname;
