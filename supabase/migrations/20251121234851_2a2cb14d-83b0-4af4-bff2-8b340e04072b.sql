-- Add operating_mode enum and column to stores table
DO $$ BEGIN
  CREATE TYPE public.operating_mode AS ENUM ('delivery', 'pickup', 'digital_menu');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.stores ADD COLUMN operating_mode public.operating_mode DEFAULT 'delivery';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

COMMENT ON COLUMN public.stores.operating_mode IS 'Modo de funcionamiento: delivery (Delivery), pickup (Entrega en tienda), digital_menu (Menú Digital)';
