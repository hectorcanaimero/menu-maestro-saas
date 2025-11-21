-- Change operating_mode to array type to allow multiple selections
ALTER TABLE public.stores 
DROP COLUMN operating_mode;

ALTER TABLE public.stores 
ADD COLUMN operating_modes public.operating_mode[] DEFAULT ARRAY['delivery']::public.operating_mode[];

COMMENT ON COLUMN public.stores.operating_modes IS 'Modos de funcionamiento (múltiples): delivery, pickup, digital_menu';
