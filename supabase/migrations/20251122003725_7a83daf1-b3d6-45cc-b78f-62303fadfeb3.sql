-- Add delivery settings columns to stores table
ALTER TABLE public.stores
ADD COLUMN estimated_delivery_time TEXT,
ADD COLUMN skip_payment_digital_menu BOOLEAN DEFAULT false,
ADD COLUMN delivery_price_mode TEXT DEFAULT 'fixed' CHECK (delivery_price_mode IN ('fixed', 'by_zone')),
ADD COLUMN fixed_delivery_price NUMERIC DEFAULT 0;

-- Create delivery_zones table for zone-based pricing
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  delivery_price NUMERIC NOT NULL DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_zones
CREATE POLICY "Store owners can manage their delivery zones"
  ON public.delivery_zones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = delivery_zones.store_id
      AND stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = delivery_zones.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view delivery zones for active stores"
  ON public.delivery_zones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = delivery_zones.store_id
      AND stores.is_active = true
    )
  );

-- Add index for performance
CREATE INDEX idx_delivery_zones_store ON public.delivery_zones(store_id);

-- Add comments
COMMENT ON COLUMN public.stores.estimated_delivery_time IS 'Estimated delivery time shown on order page';
COMMENT ON COLUMN public.stores.skip_payment_digital_menu IS 'Skip payment section for digital menu orders';
COMMENT ON COLUMN public.stores.delivery_price_mode IS 'Delivery pricing mode: fixed or by_zone';
COMMENT ON COLUMN public.stores.fixed_delivery_price IS 'Fixed delivery price when mode is fixed';
COMMENT ON TABLE public.delivery_zones IS 'Delivery zones with specific prices for zone-based delivery pricing';