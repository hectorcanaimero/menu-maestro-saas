-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL CHECK (value > 0),
  minimum_order_amount NUMERIC DEFAULT 0,
  maximum_discount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, code)
);

-- RLS Policies for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage coupons" ON public.coupons
FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = coupons.store_id AND stores.owner_id = auth.uid())
);

CREATE POLICY "Public can view active coupons" ON public.coupons
FOR SELECT USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date > now())
);

-- Create coupon_usages table
CREATE TABLE public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for coupon_usages
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their coupon usages" ON public.coupon_usages
FOR SELECT USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = coupon_usages.store_id AND stores.owner_id = auth.uid())
);

CREATE POLICY "Anyone can insert coupon usages" ON public.coupon_usages
FOR INSERT WITH CHECK (true);

-- Add coupon columns to orders table
ALTER TABLE public.orders 
ADD COLUMN coupon_code TEXT,
ADD COLUMN coupon_discount NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.orders.coupon_code IS 'Código del cupón aplicado';
COMMENT ON COLUMN public.orders.coupon_discount IS 'Monto del descuento por cupón';

-- Trigger for updated_at on coupons
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();