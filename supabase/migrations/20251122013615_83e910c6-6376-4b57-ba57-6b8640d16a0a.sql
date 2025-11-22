-- Add policy for store owners to update customer information
CREATE POLICY "Store owners can update their customers"
ON public.customers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.customer_id = customers.id
    AND s.owner_id = auth.uid()
  )
);

-- Add policy for store owners to delete customers (for merging)
CREATE POLICY "Store owners can delete their customers"
ON public.customers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.customer_id = customers.id
    AND s.owner_id = auth.uid()
  )
);