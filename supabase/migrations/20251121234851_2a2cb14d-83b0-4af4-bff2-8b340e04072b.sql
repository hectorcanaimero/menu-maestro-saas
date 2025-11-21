-- Add operating_mode enum and column to stores table
CREATE TYPE public.operating_mode AS ENUM ('delivery', 'pickup', 'digital_menu');

ALTER TABLE public.stores 
ADD COLUMN operating_mode public.operating_mode DEFAULT 'delivery';

COMMENT ON COLUMN public.stores.operating_mode IS 'Modo de funcionamiento: delivery (Delivery), pickup (Entrega en tienda), digital_menu (Menú Digital)';
