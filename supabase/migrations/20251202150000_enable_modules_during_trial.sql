-- =============================================
-- Migration: Enable WhatsApp and Delivery Modules During Trial
-- Description: Enable WhatsApp and Delivery modules for all trial subscriptions
-- Date: 2025-12-02
-- Author: System
-- =============================================

-- Update existing trial subscriptions to enable WhatsApp and Delivery modules
UPDATE public.subscriptions
SET
  enabled_modules = jsonb_build_object(
    'whatsapp', true,
    'delivery', true
  ),
  updated_at = NOW()
WHERE status = 'trial'
AND (
  enabled_modules->>'whatsapp' = 'false'
  OR enabled_modules->>'delivery' = 'false'
  OR enabled_modules IS NULL
);

-- Create or replace trigger function to automatically enable modules for new trial subscriptions
CREATE OR REPLACE FUNCTION public.enable_trial_modules()
RETURNS TRIGGER AS $$
BEGIN
  -- If creating a trial subscription, automatically enable WhatsApp and Delivery
  IF NEW.status = 'trial' THEN
    NEW.enabled_modules = jsonb_build_object(
      'whatsapp', true,
      'delivery', true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_enable_trial_modules ON public.subscriptions;

-- Create trigger for new subscriptions
CREATE TRIGGER trg_enable_trial_modules
  BEFORE INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enable_trial_modules();

-- Update the function that creates subscriptions for new stores
-- to ensure modules are enabled during trial
CREATE OR REPLACE FUNCTION public.create_store_subscription(p_store_id UUID)
RETURNS UUID AS $$
DECLARE
  v_trial_plan_id UUID;
  v_subscription_id UUID;
  v_trial_duration INTEGER := 30;
BEGIN
  -- Get the trial plan ID
  SELECT id INTO v_trial_plan_id
  FROM public.subscription_plans
  WHERE name = 'trial'
  LIMIT 1;

  IF v_trial_plan_id IS NULL THEN
    RAISE EXCEPTION 'Trial plan not found';
  END IF;

  -- Create trial subscription with enabled modules
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

  -- Create AI credits record
  INSERT INTO public.store_ai_credits (
    store_id,
    monthly_credits,
    extra_credits,
    credits_used_this_month,
    last_reset_date
  ) VALUES (
    p_store_id,
    5,  -- Trial plan gets 5 AI credits
    0,
    0,
    CURRENT_DATE
  )
  ON CONFLICT (store_id) DO NOTHING;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the trial module policy
COMMENT ON FUNCTION public.enable_trial_modules() IS
'Automatically enables WhatsApp and Delivery modules for trial subscriptions.
These modules are included free during the 30-day trial period.';

-- Log the changes
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated_count
  FROM public.subscriptions
  WHERE status = 'trial'
  AND enabled_modules->>'whatsapp' = 'true'
  AND enabled_modules->>'delivery' = 'true';

  RAISE NOTICE 'Enabled trial modules for % subscriptions', v_updated_count;
END $$;
