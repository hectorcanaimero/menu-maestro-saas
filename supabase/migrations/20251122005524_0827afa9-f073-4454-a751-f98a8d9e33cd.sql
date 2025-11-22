-- Fix RLS policies for orders table
-- The issue is having two RESTRICTIVE policies for INSERT
-- We need a single PERMISSIVE policy instead

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders in active stores" ON public.orders;

-- Create a single PERMISSIVE policy for INSERT
CREATE POLICY "Anyone can create orders in active stores"
ON public.orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM stores
    WHERE stores.id = orders.store_id
    AND stores.is_active = true
  )
);