-- Drop old policy that references auth.users
DROP POLICY IF EXISTS "Users can view orders by email" ON public.orders;

-- Create new policy for customers to view their orders by email
CREATE POLICY "Customers can view their orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = orders.customer_id
    AND c.email = customer_email
  ) OR user_id = auth.uid()
);

-- Update the select policy for order_items to work with the new structure
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;

CREATE POLICY "Customers can view their order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.id = order_items.order_id
    AND (o.user_id = auth.uid() OR c.email = o.customer_email)
  )
);

-- Update the select policy for order_item_extras
DROP POLICY IF EXISTS "Users can view their order item extras" ON public.order_item_extras;

CREATE POLICY "Customers can view their order item extras"
ON public.order_item_extras
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE oi.id = order_item_extras.order_item_id
    AND (o.user_id = auth.uid() OR c.email = o.customer_email)
  )
);