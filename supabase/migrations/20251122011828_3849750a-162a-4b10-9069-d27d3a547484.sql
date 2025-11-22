-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT DEFAULT 'brazil',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, phone)
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Anyone can create customers (for orders)
CREATE POLICY "Anyone can create customers"
ON public.customers
FOR INSERT
WITH CHECK (true);

-- Anyone can view customers (needed for orders)
CREATE POLICY "Anyone can view customers"
ON public.customers
FOR SELECT
USING (true);

-- Add customer_id to orders table
ALTER TABLE public.orders
ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Store owners can view customers who made orders in their stores
CREATE POLICY "Store owners can view their customers"
ON public.customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.customer_id = customers.id
    AND s.owner_id = auth.uid()
  )
);

-- Create trigger for updated_at on customers
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();