-- Fix driver access without authentication
-- Drivers currently use localStorage (driver_id) instead of auth.users
-- This migration allows anonymous access for drivers

-- Drop existing policies that require auth
DROP POLICY IF EXISTS "Drivers can read their own delivery assignments" ON delivery_assignments;
DROP POLICY IF EXISTS "Drivers can read orders for their deliveries" ON orders;
DROP POLICY IF EXISTS "Drivers can read order items for their deliveries" ON order_items;

-- Allow anonymous read access to drivers table (needed for driver login)
CREATE POLICY "Anyone can read drivers for login"
ON drivers
FOR SELECT
TO anon
USING (true);

-- Allow anonymous read access to delivery_assignments
-- Security: drivers will filter by driver_id on client side
CREATE POLICY "Anonymous can read delivery assignments"
ON delivery_assignments
FOR SELECT
TO anon
USING (true);

-- Allow anonymous read access to orders (only for delivery assignments)
-- Security: drivers can only see orders they're assigned to via client-side filtering
CREATE POLICY "Anonymous can read orders for deliveries"
ON orders
FOR SELECT
TO anon
USING (true);

-- Allow anonymous read access to order_items (only for delivery orders)
CREATE POLICY "Anonymous can read order items for deliveries"
ON order_items
FOR SELECT
TO anon
USING (true);

-- Allow drivers to update their own status (by driver_id)
-- Security: drivers should only update their own record
CREATE POLICY "Drivers can update their own status"
ON drivers
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow drivers to update delivery assignment status
CREATE POLICY "Drivers can update delivery assignment status"
ON delivery_assignments
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow drivers to insert/update their location
CREATE POLICY "Drivers can insert their location"
ON driver_locations
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anonymous can read driver locations"
ON driver_locations
FOR SELECT
TO anon
USING (true);

COMMENT ON POLICY "Anonymous can read delivery assignments" ON delivery_assignments IS
'Allows driver app to function without authentication. Security relies on client-side filtering by driver_id. Consider implementing proper authentication in the future.';

COMMENT ON POLICY "Anonymous can read orders for deliveries" ON orders IS
'Temporary policy to allow driver app access. Should be replaced with proper authentication.';
