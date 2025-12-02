-- Change operating_mode to array type to allow multiple selections
DO $$
BEGIN
  ALTER TABLE public.stores DROP COLUMN operating_mode;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.stores ADD COLUMN operating_modes public.operating_mode[] DEFAULT ARRAY['delivery']::public.operating_mode[];
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

COMMENT ON COLUMN public.stores.operating_modes IS 'Modos de funcionamiento (múltiples): delivery, pickup, digital_menu';
