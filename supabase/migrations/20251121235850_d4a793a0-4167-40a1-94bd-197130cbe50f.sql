-- Add payment configuration fields to stores table
ALTER TABLE public.stores 
ADD COLUMN currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN decimal_places INTEGER DEFAULT 2 CHECK (decimal_places >= 0 AND decimal_places <= 4),
ADD COLUMN decimal_separator VARCHAR(5) DEFAULT ',',
ADD COLUMN thousands_separator VARCHAR(5) DEFAULT '.',
ADD COLUMN accept_cash BOOLEAN DEFAULT true,
ADD COLUMN payment_on_delivery TEXT DEFAULT 'Pago Movil,Zelle',
ADD COLUMN require_payment_proof BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.stores.currency IS 'Moneda utilizada en la tienda';
COMMENT ON COLUMN public.stores.decimal_places IS 'Número de decimales en los precios';
COMMENT ON COLUMN public.stores.decimal_separator IS 'Separador decimal (por ejemplo: ,)';
COMMENT ON COLUMN public.stores.thousands_separator IS 'Separador de miles (por ejemplo: .)';
COMMENT ON COLUMN public.stores.accept_cash IS 'Acepta pagos en efectivo';
COMMENT ON COLUMN public.stores.payment_on_delivery IS 'Métodos de pago a la entrega (separados por coma)';
COMMENT ON COLUMN public.stores.require_payment_proof IS 'Requiere comprobante de pago obligatorio en checkout';
