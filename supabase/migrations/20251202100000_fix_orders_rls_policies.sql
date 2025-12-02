-- =============================================
-- Migration: Fix Orders RLS Policies
-- Description: Fix permission denied errors on orders table
-- =============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view orders by email" ON public.orders;
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;

-- Recreate policy without referencing auth.users table
-- Allow users to view their own orders (by user_id OR by email match via profiles)
CREATE POLICY "Users can view their orders"
ON public.orders
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  (
    customer_email IS NOT NULL
    AND customer_email = (
      SELECT email
      FROM public.profiles
      WHERE id = auth.uid()
    )
  )
);

-- Also fix the policy in stores table if it references auth.users
DROP POLICY IF EXISTS "Users can view orders by email" ON public.orders;

COMMENT ON POLICY "Users can view their orders" ON public.orders IS
'Allow users to view orders where they are the customer (by user_id or matching email via profiles table)';
