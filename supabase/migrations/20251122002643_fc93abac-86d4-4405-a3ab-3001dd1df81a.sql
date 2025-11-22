-- Add payment_method column to orders table
ALTER TABLE public.orders
ADD COLUMN payment_method TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.orders.payment_method IS 'Selected payment method name from payment_methods table';