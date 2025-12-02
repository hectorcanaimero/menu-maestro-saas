-- =============================================
-- Migration: Update Subscription Plan Pricing
-- Description: Update plan prices and rename trial to starter
-- Date: 2025-12-02
-- =============================================

-- Update plan prices
UPDATE public.subscription_plans
SET
  price_monthly = 10.00,
  display_name = 'Plan Starter',
  description = 'Plan inicial perfecto para empezar tu negocio con funcionalidades básicas'
WHERE name = 'trial';

UPDATE public.subscription_plans
SET
  price_monthly = 20.00,
  description = 'Plan básico ideal para restaurantes pequeños que buscan crecer'
WHERE name = 'basic';

UPDATE public.subscription_plans
SET
  price_monthly = 30.00,
  description = 'Plan profesional para restaurantes en crecimiento con necesidades avanzadas'
WHERE name = 'pro';

-- Enterprise remains at $99 (or update if needed)
UPDATE public.subscription_plans
SET
  description = 'Plan empresarial para cadenas y franquicias con funcionalidades ilimitadas'
WHERE name = 'enterprise';

-- Add comment
COMMENT ON TABLE public.subscription_plans IS
'Subscription plans: Starter ($10), Basic ($20), Pro ($30), Enterprise ($99)';
