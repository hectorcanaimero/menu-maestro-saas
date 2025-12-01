-- ============================================================================
-- Migration: Subscription System - Core Tables
-- Description: Sistema de suscripción con planes, trial de 30 días, y módulos pagos
-- Created: 2025-12-02
-- Agent: Database Architect
-- ============================================================================

-- ============================================================================
-- TABLA: subscription_plans
-- Definición de planes de suscripción con límites y módulos
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Límites del plan (JSONB para flexibilidad)
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Módulos incluidos en el plan
  modules JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Features del plan (para UI)
  features JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Configuración
  is_active BOOLEAN DEFAULT true,
  trial_duration_days INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLA: subscriptions
-- Suscripción activa por tienda
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),

  -- Estado de la suscripción
  status TEXT NOT NULL CHECK (status IN (
    'trial',           -- En período de prueba (30 días)
    'active',          -- Activa y pagada
    'pending_payment', -- Esperando validación manual de pago
    'past_due',        -- Pago vencido, funcionalidad limitada
    'cancelled',       -- Cancelada por el usuario
    'suspended'        -- Suspendida por admin de plataforma
  )) DEFAULT 'trial',

  -- Fechas del ciclo de suscripción
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,

  -- Módulos adicionales habilitados manualmente por admin
  -- Ejemplo: {"whatsapp": true, "delivery": false}
  enabled_modules JSONB NOT NULL DEFAULT '{
    "whatsapp": false,
    "delivery": false
  }'::jsonb,

  -- Notas internas del admin
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Solo una suscripción activa por tienda
  UNIQUE(store_id)
);

-- ============================================================================
-- TABLA: payment_validations
-- Registro de pagos manuales para validación
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Información del pago
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL, -- 'bank_transfer', 'cash', 'check', 'paypal', etc.
  reference_number TEXT,

  -- Comprobante de pago
  proof_image_url TEXT,

  -- Estado de validación
  status TEXT NOT NULL CHECK (status IN (
    'pending',   -- Esperando validación del admin
    'approved',  -- Aprobado, suscripción renovada
    'rejected'   -- Rechazado
  )) DEFAULT 'pending',

  -- Validación por admin
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,

  -- Plan solicitado (puede ser upgrade/downgrade)
  requested_plan_id UUID REFERENCES subscription_plans(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLA: platform_admins
-- Administradores de la plataforma (super admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Rol del admin
  role TEXT NOT NULL CHECK (role IN (
    'super_admin',  -- Acceso total al sistema
    'support',      -- Solo lectura + validar pagos
    'billing'       -- Solo gestión de suscripciones y pagos
  )) DEFAULT 'support',

  -- Estado
  is_active BOOLEAN DEFAULT true,

  -- Auditoría
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLA: subscription_audit_log
-- Registro de cambios en suscripciones para auditoría
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Acción realizada
  action TEXT NOT NULL, -- 'created', 'plan_changed', 'status_changed', 'module_enabled', etc.

  -- Valores antes y después del cambio
  old_values JSONB,
  new_values JSONB,

  -- Usuario que realizó el cambio
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Notas adicionales
  notes TEXT
);

-- ============================================================================
-- ÍNDICES para optimización de queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);

CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends ON subscriptions(trial_ends_at) WHERE status = 'trial';
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_payment_validations_subscription_id ON payment_validations(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_validations_status ON payment_validations(status);
CREATE INDEX IF NOT EXISTS idx_payment_validations_created ON payment_validations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id ON platform_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_active ON platform_admins(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_subscription_id ON subscription_audit_log(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_action ON subscription_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_changed_at ON subscription_audit_log(changed_at DESC);

-- ============================================================================
-- TRIGGERS para updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_validations_updated_at ON payment_validations;
CREATE TRIGGER update_payment_validations_updated_at
  BEFORE UPDATE ON payment_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_admins_updated_at ON platform_admins;
CREATE TRIGGER update_platform_admins_updated_at
  BEFORE UPDATE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERTAR PLANES POR DEFECTO
-- ============================================================================

-- Plan TRIAL (30 días gratis, 5 créditos AI)
INSERT INTO subscription_plans (
  name,
  display_name,
  description,
  price_monthly,
  limits,
  modules,
  features,
  is_active,
  trial_duration_days,
  sort_order
) VALUES (
  'trial',
  'Prueba Gratuita',
  'Prueba gratis por 30 días con funcionalidad básica',
  0.00,
  '{
    "ai_monthly_credits": 5,
    "max_products": 50,
    "max_orders_per_month": 100,
    "max_categories": 10,
    "has_kitchen_display": false,
    "has_analytics": false,
    "has_promotions": false,
    "has_coupons": false
  }'::jsonb,
  '{
    "whatsapp": false,
    "delivery": false,
    "ai_enhancement": true
  }'::jsonb,
  '[
    "50 productos máximo",
    "100 órdenes por mes",
    "5 créditos de IA mensuales",
    "Catálogo digital",
    "Órdenes para recoger",
    "10 categorías máximo"
  ]'::jsonb,
  true,
  30,
  1
) ON CONFLICT (name) DO NOTHING;

-- Plan BASIC ($29/mes)
INSERT INTO subscription_plans (
  name,
  display_name,
  description,
  price_monthly,
  limits,
  modules,
  features,
  is_active,
  trial_duration_days,
  sort_order
) VALUES (
  'basic',
  'Plan Básico',
  'Ideal para pequeños negocios que están comenzando',
  29.00,
  '{
    "ai_monthly_credits": 40,
    "max_products": 200,
    "max_orders_per_month": 500,
    "max_categories": 30,
    "has_kitchen_display": true,
    "has_analytics": true,
    "has_promotions": true,
    "has_coupons": false
  }'::jsonb,
  '{
    "whatsapp": false,
    "delivery": false,
    "ai_enhancement": true
  }'::jsonb,
  '[
    "200 productos máximo",
    "500 órdenes por mes",
    "40 créditos de IA mensuales",
    "Pantalla de cocina",
    "Analíticas básicas",
    "Sistema de promociones",
    "30 categorías"
  ]'::jsonb,
  true,
  0,
  2
) ON CONFLICT (name) DO NOTHING;

-- Plan PRO ($59/mes, incluye 1 módulo extra)
INSERT INTO subscription_plans (
  name,
  display_name,
  description,
  price_monthly,
  limits,
  modules,
  features,
  is_active,
  trial_duration_days,
  sort_order
) VALUES (
  'pro',
  'Plan Pro',
  'Para negocios en crecimiento con necesidades avanzadas',
  59.00,
  '{
    "ai_monthly_credits": 100,
    "max_products": 1000,
    "max_orders_per_month": 2000,
    "max_categories": 100,
    "has_kitchen_display": true,
    "has_analytics": true,
    "has_promotions": true,
    "has_coupons": true
  }'::jsonb,
  '{
    "whatsapp": false,
    "delivery": false,
    "ai_enhancement": true
  }'::jsonb,
  '[
    "1000 productos",
    "2000 órdenes por mes",
    "100 créditos de IA mensuales",
    "Pantalla de cocina",
    "Analíticas avanzadas",
    "Promociones y cupones",
    "100 categorías",
    "Soporte prioritario",
    "1 módulo extra (WhatsApp O Delivery)"
  ]'::jsonb,
  true,
  0,
  3
) ON CONFLICT (name) DO NOTHING;

-- Plan ENTERPRISE ($99/mes, todo incluido)
INSERT INTO subscription_plans (
  name,
  display_name,
  description,
  price_monthly,
  limits,
  modules,
  features,
  is_active,
  trial_duration_days,
  sort_order
) VALUES (
  'enterprise',
  'Plan Enterprise',
  'Solución completa para negocios establecidos',
  99.00,
  '{
    "ai_monthly_credits": 200,
    "max_products": null,
    "max_orders_per_month": null,
    "max_categories": null,
    "has_kitchen_display": true,
    "has_analytics": true,
    "has_promotions": true,
    "has_coupons": true
  }'::jsonb,
  '{
    "whatsapp": true,
    "delivery": true,
    "ai_enhancement": true
  }'::jsonb,
  '[
    "Productos ilimitados",
    "Órdenes ilimitadas",
    "200 créditos de IA mensuales",
    "Pantalla de cocina",
    "Analíticas completas",
    "Promociones y cupones",
    "Categorías ilimitadas",
    "Notificaciones WhatsApp",
    "Sistema de delivery",
    "Soporte prioritario 24/7",
    "Gestor de cuenta dedicado"
  ]'::jsonb,
  true,
  0,
  4
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- COMENTARIOS para documentación
-- ============================================================================
COMMENT ON TABLE subscription_plans IS
'Planes de suscripción disponibles con límites y módulos incluidos';

COMMENT ON TABLE subscriptions IS
'Suscripción activa de cada tienda. Solo puede haber una suscripción por tienda.';

COMMENT ON TABLE payment_validations IS
'Pagos manuales pendientes de validación por administradores de la plataforma';

COMMENT ON TABLE platform_admins IS
'Administradores con acceso al panel de gestión de la plataforma';

COMMENT ON TABLE subscription_audit_log IS
'Registro de auditoría de cambios en suscripciones para trazabilidad';

COMMENT ON COLUMN subscriptions.enabled_modules IS
'Módulos habilitados manualmente por admin, adicionales a los incluidos en el plan';

COMMENT ON COLUMN subscriptions.status IS
'Estado: trial=prueba, active=activa, pending_payment=esperando validación, past_due=vencida, cancelled=cancelada, suspended=suspendida por admin';

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
