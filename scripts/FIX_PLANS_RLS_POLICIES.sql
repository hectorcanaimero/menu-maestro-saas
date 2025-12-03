-- ============================================================================
-- FIX: Plans RLS Policies for Complete Admin Access
-- Issue: Platform admins can't see/edit inactive or archived plans
-- ============================================================================

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Plans are publicly readable" ON subscription_plans;

-- Create new policies: separate for public and admins

-- 1. Public users can only see ACTIVE plans (for pricing page)
CREATE POLICY "Public can view active plans"
  ON subscription_plans FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (is_archived IS NULL OR is_archived = false));

-- 2. Platform admins can see ALL plans (active, inactive, archived)
CREATE POLICY "Platform admins can view all plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Verify the UPDATE policy exists and is correct
-- (Should already exist from previous migration)
DROP POLICY IF EXISTS "Platform admins can update plans" ON subscription_plans;
CREATE POLICY "Platform admins can update plans"
  ON subscription_plans FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Verify the INSERT policy exists
DROP POLICY IF EXISTS "Platform admins can insert plans" ON subscription_plans;
CREATE POLICY "Platform admins can insert plans"
  ON subscription_plans FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

-- Verify the DELETE policy exists
DROP POLICY IF EXISTS "Super admins can delete plans" ON subscription_plans;
CREATE POLICY "Super admins can delete plans"
  ON subscription_plans FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- Verify your admin status (run this to check)
-- ============================================================================
SELECT
  auth.users.email,
  platform_admins.role,
  platform_admins.is_active,
  is_platform_admin() as can_manage_plans,
  is_super_admin() as can_delete_plans
FROM auth.users
JOIN platform_admins ON auth.users.id = platform_admins.user_id
WHERE auth.users.id = auth.uid();

-- ============================================================================
-- Test the policies (run this to verify)
-- ============================================================================
SELECT
  id,
  name,
  display_name,
  is_active,
  is_archived,
  'Can see this plan' as status
FROM subscription_plans
ORDER BY sort_order;
