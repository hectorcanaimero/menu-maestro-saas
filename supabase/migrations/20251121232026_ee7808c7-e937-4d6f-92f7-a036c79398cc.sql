-- Make user_id nullable in orders table to allow guest checkout
ALTER TABLE orders 
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy to allow guest users to create orders
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;

CREATE POLICY "Anyone can create orders" 
ON orders 
FOR INSERT 
WITH CHECK (true);

-- Update RLS policy to allow users to view their orders (authenticated or by email)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

CREATE POLICY "Users can view their orders" 
ON orders 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND customer_email IS NOT NULL)
);

-- Update order_items RLS policies for guest checkout
DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;

CREATE POLICY "Anyone can create order items" 
ON order_items 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view items from their orders" ON order_items;

CREATE POLICY "Users can view their order items" 
ON order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (
      orders.user_id = auth.uid() OR 
      (auth.uid() IS NULL AND orders.customer_email IS NOT NULL)
    )
  )
);