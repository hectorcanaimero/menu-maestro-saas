-- Enable anonymous access for delivery-related tables for driver app
-- Note: In production, you should implement proper driver authentication

-- Allow anonymous users to read delivery_assignments
CREATE POLICY "Allow anon read delivery_assignments"
ON delivery_assignments
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read orders (limited to delivery info)
CREATE POLICY "Allow anon read orders for delivery"
ON orders
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read order_items (for delivery app)
CREATE POLICY "Allow anon read order_items for delivery"
ON order_items
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read drivers table
CREATE POLICY "Allow anon read drivers"
ON drivers
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to update driver status and location
CREATE POLICY "Allow anon update drivers"
ON drivers
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to insert driver locations
CREATE POLICY "Allow anon insert driver_locations"
ON driver_locations
FOR INSERT
TO anon
WITH CHECK (true);
