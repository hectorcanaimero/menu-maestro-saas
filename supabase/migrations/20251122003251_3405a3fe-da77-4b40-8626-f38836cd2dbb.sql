-- Create product_extras table
CREATE TABLE IF NOT EXISTS public.product_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_extras ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_extras
CREATE POLICY "Product extras are publicly readable in active stores"
  ON public.product_extras
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_items mi
      JOIN public.stores s ON s.id = mi.store_id
      WHERE mi.id = product_extras.menu_item_id
      AND s.is_active = true
    )
  );

CREATE POLICY "Store owners can manage their product extras"
  ON public.product_extras
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_items mi
      JOIN public.stores s ON s.id = mi.store_id
      WHERE mi.id = product_extras.menu_item_id
      AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.menu_items mi
      JOIN public.stores s ON s.id = mi.store_id
      WHERE mi.id = product_extras.menu_item_id
      AND s.owner_id = auth.uid()
    )
  );

-- Create order_item_extras table to store selected extras
CREATE TABLE IF NOT EXISTS public.order_item_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  extra_name TEXT NOT NULL,
  extra_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_item_extras ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_item_extras
CREATE POLICY "Users can view their order item extras"
  ON public.order_item_extras
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_extras.order_item_id
      AND (o.user_id = auth.uid() OR (auth.uid() IS NULL AND o.customer_email IS NOT NULL))
    )
  );

CREATE POLICY "Anyone can create order item extras"
  ON public.order_item_extras
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Store owners can view all order item extras"
  ON public.order_item_extras
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      JOIN public.stores s ON s.id = o.store_id
      WHERE oi.id = order_item_extras.order_item_id
      AND s.owner_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX idx_product_extras_menu_item ON public.product_extras(menu_item_id);
CREATE INDEX idx_order_item_extras_order_item ON public.order_item_extras(order_item_id);