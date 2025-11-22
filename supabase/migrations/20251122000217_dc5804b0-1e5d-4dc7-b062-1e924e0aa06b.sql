-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Store owners can manage their payment methods
CREATE POLICY "Store owners can manage their payment methods"
ON public.payment_methods
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = payment_methods.store_id 
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = payment_methods.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Public can view active payment methods for active stores
CREATE POLICY "Public can view payment methods for active stores"
ON public.payment_methods
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = payment_methods.store_id 
    AND stores.is_active = true
  )
);

-- Create index for better query performance
CREATE INDEX idx_payment_methods_store_id ON public.payment_methods(store_id);
CREATE INDEX idx_payment_methods_active ON public.payment_methods(store_id, is_active);

COMMENT ON TABLE public.payment_methods IS 'Métodos de pago configurados por cada tienda';
COMMENT ON COLUMN public.payment_methods.name IS 'Nombre del método de pago';
COMMENT ON COLUMN public.payment_methods.description IS 'Descripción o instrucciones del método de pago';
COMMENT ON COLUMN public.payment_methods.is_active IS 'Si el método de pago está activo';
COMMENT ON COLUMN public.payment_methods.display_order IS 'Orden de visualización';
