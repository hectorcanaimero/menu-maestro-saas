-- Fix RLS policies for authenticated store owners to access delivery_assignments
-- This allows the admin delivery dashboard to work properly

-- Drop existing policy if it exists (to recreate it properly)
DROP POLICY IF EXISTS "Store owners can manage delivery assignments" ON delivery_assignments;

-- Create policy for authenticated store owners to manage their delivery assignments
CREATE POLICY "Store owners can manage delivery assignments"
ON delivery_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = delivery_assignments.store_id
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = delivery_assignments.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Ensure authenticated users can read drivers for their stores
DROP POLICY IF EXISTS "Store owners can read their drivers" ON drivers;

CREATE POLICY "Store owners can read their drivers"
ON drivers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = drivers.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Ensure authenticated users can read orders with delivery info
DROP POLICY IF EXISTS "Store owners can read delivery orders" ON orders;

CREATE POLICY "Store owners can read delivery orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  )
);
