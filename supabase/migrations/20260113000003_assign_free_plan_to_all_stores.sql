-- =============================================
-- Migration: Assign Free Plan to All Stores Without Subscription
-- Description: Create free plan subscriptions for existing stores
-- Date: 2026-01-13
-- Issue: Stores without subscriptions can't see subscription page
-- =============================================

-- Create subscriptions for stores that don't have one
DO $$
DECLARE
  v_store RECORD;
  v_free_plan_id UUID;
BEGIN
  -- Get the free plan ID
  SELECT id INTO v_free_plan_id
  FROM public.subscription_plans
  WHERE name = 'free'
  LIMIT 1;

  IF v_free_plan_id IS NULL THEN
    RAISE EXCEPTION 'Free plan not found';
  END IF;

  -- Iterate through stores without subscriptions
  FOR v_store IN
    SELECT s.id, s.owner_id, s.name
    FROM public.stores s
    LEFT JOIN public.subscriptions sub ON sub.store_id = s.id
    WHERE sub.id IS NULL AND s.is_active = true
  LOOP
    -- Create free plan subscription for this store
    INSERT INTO public.subscriptions (
      store_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      enabled_modules
    ) VALUES (
      v_store.id,
      v_free_plan_id,
      'active',
      NOW(),
      NOW() + INTERVAL '1 year', -- Free plan lasts 1 year
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
      10,  -- Free plan gets 10 AI credits
      0,   -- No extra credits initially
      0,   -- No credits used yet
      CURRENT_DATE
    )
    ON CONFLICT (store_id) DO NOTHING;

    RAISE NOTICE 'Created free subscription for store: % (%)', v_store.name, v_store.id;
  END LOOP;
END $$;

-- Verify all active stores now have subscriptions
DO $$
DECLARE
  v_stores_without_sub INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_stores_without_sub
  FROM public.stores s
  LEFT JOIN public.subscriptions sub ON sub.store_id = s.id
  WHERE sub.id IS NULL AND s.is_active = true;

  IF v_stores_without_sub > 0 THEN
    RAISE WARNING 'Still % active stores without subscriptions', v_stores_without_sub;
  ELSE
    RAISE NOTICE 'All active stores now have subscriptions!';
  END IF;
END $$;
