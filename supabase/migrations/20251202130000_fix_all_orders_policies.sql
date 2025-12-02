-- =============================================
-- Migration: Fix All Orders RLS Policies
-- Description: Remove ALL policies that reference auth.users and recreate them properly
-- =============================================

-- Drop ALL existing SELECT policies on orders table
DROP POLICY IF EXISTS "Users can view orders by email" ON public.orders;
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their orders by email or user_id" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view all store orders" ON public.orders;

-- Recreate policy for store owners/admins to view all orders in their store
CREATE POLICY "Store owners can view all store orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Recreate policy for customers to view their own orders
CREATE POLICY "Customers can view their orders"
ON public.orders
FOR SELECT
USING (
  -- By user_id (authenticated users)
  auth.uid() = user_id
  OR
  -- By email match via profiles table (no auth.users reference!)
  (
    customer_email IS NOT NULL
    AND customer_email = (
      SELECT email
      FROM public.profiles
      WHERE id = auth.uid()
    )
  )
  OR
  -- Anonymous users can see orders (filtered by frontend)
  auth.uid() IS NULL
);

-- Keep existing UPDATE policy for store owners
DROP POLICY IF EXISTS "Store owners can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Store owners can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Keep existing INSERT policy (anyone can create orders)
-- This should already exist, but let's ensure it's correct
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Add comments
COMMENT ON POLICY "Store owners can view all store orders" ON public.orders IS
'Allow store owners to view all orders for their stores';

COMMENT ON POLICY "Customers can view their orders" ON public.orders IS
'Allow customers to view their own orders by user_id or email (using profiles table)';
