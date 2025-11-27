-- Add delivery_price column to orders table
ALTER TABLE public.orders 
ADD COLUMN delivery_price numeric DEFAULT 0;

COMMENT ON COLUMN public.orders.delivery_price IS 'Costo de envío/delivery separado del total';