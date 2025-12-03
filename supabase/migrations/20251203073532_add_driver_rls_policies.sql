-- Add RLS policies for drivers to access their delivery assignments

-- Policy for drivers to read their own delivery assignments
CREATE POLICY "Drivers can read their own delivery assignments"
ON delivery_assignments
FOR SELECT
USING (
  driver_id IN (
    SELECT id FROM drivers WHERE phone = (SELECT phone FROM auth.users WHERE id = auth.uid())
  )
);

-- Policy for drivers to read orders related to their assignments
CREATE POLICY "Drivers can read orders for their deliveries"
ON orders
FOR SELECT
USING (
  id IN (
    SELECT order_id FROM delivery_assignments 
    WHERE driver_id IN (
      SELECT id FROM drivers WHERE phone = (SELECT phone FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Policy for drivers to read order items for their deliveries
CREATE POLICY "Drivers can read order items for their deliveries"
ON order_items
FOR SELECT
USING (
  order_id IN (
    SELECT order_id FROM delivery_assignments 
    WHERE driver_id IN (
      SELECT id FROM drivers WHERE phone = (SELECT phone FROM auth.users WHERE id = auth.uid())
    )
  )
);
