-- =============================================
-- Manual Script: Enable WhatsApp and Delivery Modules During Trial
-- Instructions: Run this in Supabase SQL Editor
-- =============================================

-- Step 1: Update existing trial subscriptions to enable modules
UPDATE public.subscriptions
SET
  enabled_modules = jsonb_build_object(
    'whatsapp', true,
    'delivery', true
  ),
  updated_at = NOW()
WHERE status = 'trial'
AND (
  enabled_modules->>'whatsapp' != 'true'
  OR enabled_modules->>'delivery' != 'true'
  OR enabled_modules IS NULL
);

-- Step 2: Create trigger function for new trial subscriptions
CREATE OR REPLACE FUNCTION public.enable_trial_modules()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'trial' THEN
    NEW.enabled_modules = jsonb_build_object(
      'whatsapp', true,
      'delivery', true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger
DROP TRIGGER IF EXISTS trg_enable_trial_modules ON public.subscriptions;

CREATE TRIGGER trg_enable_trial_modules
  BEFORE INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enable_trial_modules();

-- Step 4: Update subscription creation function
CREATE OR REPLACE FUNCTION public.create_store_subscription(p_store_id UUID)
RETURNS UUID AS $$
DECLARE
  v_trial_plan_id UUID;
  v_subscription_id UUID;
  v_trial_duration INTEGER := 30;
BEGIN
  SELECT id INTO v_trial_plan_id
  FROM public.subscription_plans
  WHERE name = 'trial'
  LIMIT 1;

  IF v_trial_plan_id IS NULL THEN
    RAISE EXCEPTION 'Trial plan not found';
  END IF;

  INSERT INTO public.subscriptions (
    store_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    trial_ends_at,
    enabled_modules
  ) VALUES (
    p_store_id,
    v_trial_plan_id,
    'trial',
    NOW(),
    NOW() + (v_trial_duration || ' days')::INTERVAL,
    NOW() + (v_trial_duration || ' days')::INTERVAL,
    jsonb_build_object('whatsapp', true, 'delivery', true)
  )
  RETURNING id INTO v_subscription_id;

  INSERT INTO public.store_ai_credits (
    store_id,
    monthly_credits,
    extra_credits,
    credits_used_this_month,
    last_reset_date
  ) VALUES (
    p_store_id,
    5,
    0,
    0,
    CURRENT_DATE
  )
  ON CONFLICT (store_id) DO NOTHING;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify changes
SELECT
  s.id as subscription_id,
  st.name as store_name,
  s.status,
  s.enabled_modules->>'whatsapp' as whatsapp_enabled,
  s.enabled_modules->>'delivery' as delivery_enabled,
  s.trial_ends_at
FROM public.subscriptions s
JOIN public.stores st ON st.id = s.store_id
WHERE s.status = 'trial'
ORDER BY s.created_at DESC;

-- Mark this migration as applied (run this last)
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20251202150000', 'enable_modules_during_trial', ARRAY['UPDATE subscriptions SET enabled_modules', 'CREATE TRIGGER trg_enable_trial_modules'])
ON CONFLICT (version) DO NOTHING;
