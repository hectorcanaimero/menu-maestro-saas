-- Create enum for force status
DO $$ BEGIN
  CREATE TYPE public.force_status AS ENUM ('normal', 'force_open', 'force_closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add force_status column to stores
DO $$
BEGIN
  ALTER TABLE public.stores ADD COLUMN force_status public.force_status DEFAULT 'normal';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create store_hours table
CREATE TABLE IF NOT EXISTS public.store_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (close_time > open_time)
);

-- Enable RLS
ALTER TABLE public.store_hours ENABLE ROW LEVEL SECURITY;

-- Store owners can manage their store hours
DROP POLICY IF EXISTS "Store owners can manage their store hours" ON public.store_hours;
CREATE POLICY "Store owners can manage their store hours"
ON public.store_hours
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = store_hours.store_id
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = store_hours.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Public can view store hours for active stores
DROP POLICY IF EXISTS "Public can view store hours for active stores" ON public.store_hours;
CREATE POLICY "Public can view store hours for active stores"
ON public.store_hours
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = store_hours.store_id
    AND stores.is_active = true
  )
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_store_hours_store_id ON public.store_hours(store_id);
CREATE INDEX IF NOT EXISTS idx_store_hours_day ON public.store_hours(store_id, day_of_week);

COMMENT ON TABLE public.store_hours IS 'Horarios de apertura de las tiendas por día de la semana';
COMMENT ON COLUMN public.store_hours.day_of_week IS 'Día de la semana: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado';
