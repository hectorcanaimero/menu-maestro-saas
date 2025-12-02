-- =============================================
-- Migration: Ensure All Stores Have Subscriptions
-- Description: Create trial subscriptions for existing stores without one
-- Date: 2025-12-02
-- =============================================

-- Create subscriptions for stores that don't have one
DO $$
DECLARE
  v_store RECORD;
  v_trial_plan_id UUID;
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

  -- Iterate through stores without subscriptions
  FOR v_store IN
    SELECT s.id, s.owner_id
    FROM public.stores s
    LEFT JOIN public.subscriptions sub ON sub.store_id = s.id
    WHERE sub.id IS NULL
  LOOP
    -- Create trial subscription for this store
    INSERT INTO public.subscriptions (
      store_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      trial_ends_at,
      enabled_modules
    ) VALUES (
      v_store.id,
      v_trial_plan_id,
      'trial',
      NOW(),
      NOW() + (v_trial_duration || ' days')::INTERVAL,
      NOW() + (v_trial_duration || ' days')::INTERVAL,
      '{"whatsapp": false, "delivery": false}'::jsonb
    );

    -- Create AI credits record for this store
    INSERT INTO public.store_ai_credits (
      store_id,
      monthly_credits,
      extra_credits,
      credits_used_this_month,
      last_reset_date
    ) VALUES (
      v_store.id,
      5,  -- Trial plan gets 5 AI credits
      0,  -- No extra credits initially
      0,  -- No credits used yet
      CURRENT_DATE
    )
    ON CONFLICT (store_id) DO NOTHING;

    RAISE NOTICE 'Created trial subscription for store: %', v_store.id;
  END LOOP;
END $$;

-- Verify all stores now have subscriptions
DO $$
DECLARE
  v_stores_without_sub INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_stores_without_sub
  FROM public.stores s
  LEFT JOIN public.subscriptions sub ON sub.store_id = s.id
  WHERE sub.id IS NULL;

  IF v_stores_without_sub > 0 THEN
    RAISE WARNING 'Still % stores without subscriptions', v_stores_without_sub;
  ELSE
    RAISE NOTICE 'All stores now have subscriptions';
  END IF;
END $$;
