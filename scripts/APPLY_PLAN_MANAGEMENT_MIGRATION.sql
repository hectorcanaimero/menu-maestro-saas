-- ============================================================================
-- SCRIPT MANUAL: Apply Plan Management Migration
-- Ejecutar este script en el SQL Editor de Supabase Dashboard
-- ============================================================================

-- 1. Add is_archived field for soft delete
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 2. Create index for faster queries filtering archived plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_archived
ON subscription_plans(is_archived)
WHERE is_archived = true;

-- 3. Update existing plans to have module pricing structure
-- Old format: {"whatsapp": true, "delivery": false}
-- New format: {"whatsapp_monthly": 15.00, "delivery_monthly": 20.00}

-- Update Trial plan - modules are free during trial
UPDATE subscription_plans
SET modules = jsonb_build_object(
  'whatsapp_monthly', 0,
  'delivery_monthly', 0
)
WHERE name = 'trial' OR name = 'starter';

-- Update Basic plan - modules available as add-ons
UPDATE subscription_plans
SET modules = jsonb_build_object(
  'whatsapp_monthly', 15.00,
  'delivery_monthly', 20.00
)
WHERE name = 'basic';

-- Update Pro plan - modules available as add-ons (slightly discounted)
UPDATE subscription_plans
SET modules = jsonb_build_object(
  'whatsapp_monthly', 12.00,
  'delivery_monthly', 18.00
)
WHERE name = 'pro';

-- Update Enterprise plan - modules included in base price
UPDATE subscription_plans
SET modules = jsonb_build_object(
  'whatsapp_monthly', 0,
  'delivery_monthly', 0
)
WHERE name = 'enterprise';

-- 4. Add comments to document the structure
COMMENT ON COLUMN subscription_plans.modules IS 'JSONB with module pricing: {"whatsapp_monthly": number, "delivery_monthly": number}. Use 0 for included, null for not available.';
COMMENT ON COLUMN subscription_plans.is_archived IS 'Soft delete flag. Archived plans cannot be selected for new subscriptions but existing subscriptions remain valid.';

-- 5. Verify the changes
SELECT
  name,
  display_name,
  is_archived,
  modules
FROM subscription_plans
ORDER BY sort_order;
