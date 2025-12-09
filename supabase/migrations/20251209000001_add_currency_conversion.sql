-- Migration: Add Currency Conversion Support (EUR/USD -> VES)
-- Description: Adds exchange_rates table and store columns for BCV currency conversion

-- ============================================================================
-- CREATE TABLE: exchange_rates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL CHECK (from_currency IN ('USD', 'EUR')),
  to_currency VARCHAR(3) NOT NULL CHECK (to_currency = 'VES'),
  rate DECIMAL(18, 6) NOT NULL CHECK (rate > 0),
  source VARCHAR(20) NOT NULL CHECK (source IN ('bcv_auto', 'manual')),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un store solo puede tener una tasa activa por par de monedas
  -- NULL store_id significa tasa global (para todos los stores sin tasa específica)
  UNIQUE(from_currency, to_currency, store_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_exchange_rates_store
  ON public.exchange_rates(store_id);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies
  ON public.exchange_rates(from_currency, to_currency);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_last_updated
  ON public.exchange_rates(last_updated DESC);

-- ============================================================================
-- ADD COLUMNS TO stores TABLE
-- ============================================================================
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS enable_currency_conversion BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS use_manual_exchange_rate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_usd_ves_rate DECIMAL(18, 6) DEFAULT NULL CHECK (manual_usd_ves_rate IS NULL OR manual_usd_ves_rate > 0),
  ADD COLUMN IF NOT EXISTS manual_eur_ves_rate DECIMAL(18, 6) DEFAULT NULL CHECK (manual_eur_ves_rate IS NULL OR manual_eur_ves_rate > 0),
  ADD COLUMN IF NOT EXISTS active_currency VARCHAR(10) DEFAULT 'original' CHECK (active_currency IN ('original', 'VES'));

-- ============================================================================
-- COLUMN COMMENTS
-- ============================================================================
COMMENT ON TABLE public.exchange_rates IS 'Almacena tasas de cambio EUR/USD a VES del BCV o manuales';
COMMENT ON COLUMN public.exchange_rates.from_currency IS 'Moneda origen: USD o EUR';
COMMENT ON COLUMN public.exchange_rates.to_currency IS 'Moneda destino: VES (bolívares)';
COMMENT ON COLUMN public.exchange_rates.rate IS 'Tasa de cambio (ej: 257.929 significa 1 USD = 257.929 VES)';
COMMENT ON COLUMN public.exchange_rates.source IS 'Origen de la tasa: bcv_auto (webhook Guria) o manual (configurado por dueño)';
COMMENT ON COLUMN public.exchange_rates.store_id IS 'ID del store (NULL = tasa global para todos)';
COMMENT ON COLUMN public.exchange_rates.last_updated IS 'Última actualización de la tasa';

COMMENT ON COLUMN public.stores.enable_currency_conversion IS 'Activa la conversión automática de precios a VES';
COMMENT ON COLUMN public.stores.use_manual_exchange_rate IS 'Usar tasa manual en vez de BCV automática';
COMMENT ON COLUMN public.stores.manual_usd_ves_rate IS 'Tasa manual USD → VES configurada por el dueño';
COMMENT ON COLUMN public.stores.manual_eur_ves_rate IS 'Tasa manual EUR → VES configurada por el dueño';
COMMENT ON COLUMN public.stores.active_currency IS 'Moneda activa para checkout: original (USD/EUR) o VES';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist, then recreate
DO $$
BEGIN
  -- Drop read policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exchange_rates'
    AND policyname = 'Anyone can read exchange rates'
  ) THEN
    DROP POLICY "Anyone can read exchange rates" ON public.exchange_rates;
  END IF;

  -- Drop manage policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exchange_rates'
    AND policyname = 'Store owners can manage their exchange rates'
  ) THEN
    DROP POLICY "Store owners can manage their exchange rates" ON public.exchange_rates;
  END IF;
END $$;

-- Policy: Users can read all exchange rates
CREATE POLICY "Anyone can read exchange rates"
  ON public.exchange_rates
  FOR SELECT
  USING (true);

-- Policy: Store owners can insert/update their own store rates
CREATE POLICY "Store owners can manage their exchange rates"
  ON public.exchange_rates
  FOR ALL
  USING (
    store_id IS NULL OR
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IS NULL OR
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTION: Update last_updated timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_exchange_rate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update last_updated on UPDATE
CREATE TRIGGER set_exchange_rate_timestamp
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_exchange_rate_timestamp();
