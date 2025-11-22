-- Add order_type column to orders table
ALTER TABLE public.orders
ADD COLUMN order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup', 'digital_menu'));

-- Add comment to explain the column
COMMENT ON COLUMN public.orders.order_type IS 'Type of order: delivery, pickup, or digital_menu';