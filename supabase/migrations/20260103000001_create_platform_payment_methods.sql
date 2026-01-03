-- ============================================================================
-- Create Platform Payment Methods Table
-- Description: Métodos de pago de la PLATAFORMA (no de tiendas individuales)
-- Created: 2026-01-03
-- Priority: HIGH - Requerido para sistema de suscripciones
-- ============================================================================

-- ============================================================================
-- PARTE 1: Crear tabla platform_payment_methods
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Información del método de pago
  payment_type TEXT NOT NULL CHECK (payment_type IN ('bank_transfer', 'mobile_payment', 'crypto', 'cash')),
  name TEXT NOT NULL, -- Ej: "Transferencia Banco Pichincha", "Nequi Colombia"
  description TEXT,

  -- Detalles específicos según el tipo
  bank_name TEXT, -- Para bank_transfer
  account_number TEXT, -- Para bank_transfer
  account_type TEXT, -- 'checking' o 'savings'
  account_holder_name TEXT,

  mobile_number TEXT, -- Para mobile_payment (Nequi, Daviplata, etc.)
  mobile_provider TEXT, -- 'nequi', 'daviplata', 'bancolombia', etc.

  crypto_address TEXT, -- Para crypto
  crypto_network TEXT, -- 'USDT-TRC20', 'USDT-ERC20', 'BTC', etc.

  -- País y moneda
  country_code TEXT NOT NULL DEFAULT 'CO', -- ISO 3166-1 alpha-2
  currency_code TEXT NOT NULL DEFAULT 'COP', -- ISO 4217

  -- Instrucciones para el usuario
  instructions TEXT, -- Instrucciones adicionales para realizar el pago

  -- Estado y visibilidad
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false, -- Método de pago predeterminado
  display_order INTEGER DEFAULT 0, -- Orden de visualización

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_bank_transfer CHECK (
    payment_type != 'bank_transfer' OR
    (bank_name IS NOT NULL AND account_number IS NOT NULL)
  ),
  CONSTRAINT valid_mobile_payment CHECK (
    payment_type != 'mobile_payment' OR
    (mobile_number IS NOT NULL AND mobile_provider IS NOT NULL)
  ),
  CONSTRAINT valid_crypto CHECK (
    payment_type != 'crypto' OR
    (crypto_address IS NOT NULL AND crypto_network IS NOT NULL)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_platform_payment_methods_active
  ON public.platform_payment_methods(is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_platform_payment_methods_country
  ON public.platform_payment_methods(country_code, is_active);

-- ============================================================================
-- PARTE 2: Función para actualizar updated_at automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_platform_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_platform_payment_methods_updated_at
  ON public.platform_payment_methods;

CREATE TRIGGER trigger_update_platform_payment_methods_updated_at
  BEFORE UPDATE ON public.platform_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_payment_methods_updated_at();

-- ============================================================================
-- PARTE 3: RLS Policies
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.platform_payment_methods ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden ver métodos de pago activos
DROP POLICY IF EXISTS "Anyone can view active payment methods"
  ON public.platform_payment_methods;

CREATE POLICY "Anyone can view active payment methods"
  ON public.platform_payment_methods
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Solo platform admins pueden crear/editar/eliminar métodos de pago
DROP POLICY IF EXISTS "Only platform admins can manage payment methods"
  ON public.platform_payment_methods;

CREATE POLICY "Only platform admins can manage payment methods"
  ON public.platform_payment_methods
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ============================================================================
-- PARTE 4: Insertar métodos de pago iniciales (Colombia)
-- ============================================================================

-- Transferencia Bancaria Bancolombia
INSERT INTO public.platform_payment_methods (
  payment_type,
  name,
  description,
  bank_name,
  account_number,
  account_type,
  account_holder_name,
  country_code,
  currency_code,
  instructions,
  is_active,
  is_default,
  display_order
) VALUES (
  'bank_transfer',
  'Transferencia Bancolombia',
  'Transferencia o consignación a cuenta Bancolombia',
  'Bancolombia',
  '0000000000', -- Reemplazar con número real
  'savings',
  'PideAI SAS', -- Reemplazar con nombre real
  'CO',
  'COP',
  '1. Realiza la transferencia o consignación
2. Sube el comprobante de pago
3. Espera la confirmación (máximo 24 horas hábiles)',
  true,
  true,
  1
) ON CONFLICT DO NOTHING;

-- Nequi
INSERT INTO public.platform_payment_methods (
  payment_type,
  name,
  description,
  mobile_number,
  mobile_provider,
  account_holder_name,
  country_code,
  currency_code,
  instructions,
  is_active,
  display_order
) VALUES (
  'mobile_payment',
  'Nequi',
  'Pago por Nequi',
  '300 000 0000', -- Reemplazar con número real
  'nequi',
  'PideAI SAS',
  'CO',
  'COP',
  '1. Envía el pago a este número de Nequi
2. Captura de pantalla del comprobante
3. Sube el comprobante de pago',
  true,
  2
) ON CONFLICT DO NOTHING;

-- Daviplata
INSERT INTO public.platform_payment_methods (
  payment_type,
  name,
  description,
  mobile_number,
  mobile_provider,
  account_holder_name,
  country_code,
  currency_code,
  instructions,
  is_active,
  display_order
) VALUES (
  'mobile_payment',
  'Daviplata',
  'Pago por Daviplata',
  '300 000 0000', -- Reemplazar con número real
  'daviplata',
  'PideAI SAS',
  'CO',
  'COP',
  '1. Envía el pago a este número de Daviplata
2. Captura de pantalla del comprobante
3. Sube el comprobante de pago',
  true,
  3
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 5: Actualizar tabla subscriptions para usar platform_payment_methods
-- ============================================================================

-- Agregar columna platform_payment_method_id a subscriptions si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscriptions'
    AND column_name = 'platform_payment_method_id'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD COLUMN platform_payment_method_id UUID
      REFERENCES public.platform_payment_methods(id);

    CREATE INDEX idx_subscriptions_platform_payment_method
      ON public.subscriptions(platform_payment_method_id);
  END IF;
END $$;

-- ============================================================================
-- PARTE 6: Comentarios y documentación
-- ============================================================================

COMMENT ON TABLE public.platform_payment_methods IS
'Métodos de pago de la PLATAFORMA (PideAI) para recibir pagos de suscripciones y créditos AI.
NO confundir con payment_methods que son los métodos de pago de las tiendas individuales.';

COMMENT ON COLUMN public.platform_payment_methods.payment_type IS
'Tipo de método de pago: bank_transfer, mobile_payment, crypto, cash';

COMMENT ON COLUMN public.platform_payment_methods.is_default IS
'Método de pago predeterminado que se mostrará primero a los usuarios';

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
