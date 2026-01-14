-- Migration: Auto-assign free plan when store is created
-- Description: Creates a trigger to automatically assign free subscription to new stores
-- Created: 2026-01-14
-- Issue: PIDEA-115 - Stores are created without subscription
-- Purpose: Ensure all new stores automatically get free plan subscription when created

-- ============================================================================
-- PART 1: Function to assign free plan to new store
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assign_free_plan_to_new_store()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_plan_id UUID;
BEGIN
  -- Get the free plan ID
  SELECT id INTO v_free_plan_id
  FROM public.subscription_plans
  WHERE name = 'free'
  LIMIT 1;

  -- If free plan doesn't exist, log error but don't fail the store creation
  IF v_free_plan_id IS NULL THEN
    RAISE WARNING 'Free plan not found - skipping subscription creation for store %', NEW.id;
    RETURN NEW;
  END IF;

  -- Create free plan subscription for the new store
  INSERT INTO public.subscriptions (
    store_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    enabled_modules
  ) VALUES (
    NEW.id,
    v_free_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '1 year', -- Free plan lasts 1 year
    '{"whatsapp": false, "delivery": false}'::jsonb
  )
  ON CONFLICT (store_id) DO NOTHING; -- Prevent duplicates if subscription already exists

  -- Create AI credits record for this store
  INSERT INTO public.store_ai_credits (
    store_id,
    monthly_credits,
    extra_credits,
    credits_used_this_month,
    last_reset_date
  ) VALUES (
    NEW.id,
    5,  -- Free plan gets 5 AI credits per month
    0,   -- No extra credits initially
    0,   -- No credits used yet
    CURRENT_DATE
  )
  ON CONFLICT (store_id) DO NOTHING; -- Prevent duplicates if credits already exist

  RAISE NOTICE 'Assigned free plan subscription to store: % (%)', NEW.name, NEW.id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.assign_free_plan_to_new_store() IS
'Automatically assigns free plan subscription and AI credits to new stores. Used by trigger on stores table.';

-- ============================================================================
-- PART 2: Create trigger on stores table
-- ============================================================================

DROP TRIGGER IF EXISTS assign_free_plan_on_store_creation ON public.stores;

CREATE TRIGGER assign_free_plan_on_store_creation
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.assign_free_plan_to_new_store();

COMMENT ON TRIGGER assign_free_plan_on_store_creation ON public.stores IS
'Trigger that automatically assigns free plan subscription to new stores. Ensures all stores have a subscription from the start.';

-- ============================================================================
-- PART 3: Backfill existing stores (assign free plan to stores without subscription)
-- ============================================================================

-- This is a safety net - ensure all existing stores have a subscription
DO $$
DECLARE
  v_store RECORD;
  v_free_plan_id UUID;
  v_stores_updated INTEGER := 0;
BEGIN
  -- Get the free plan ID
  SELECT id INTO v_free_plan_id
  FROM public.subscription_plans
  WHERE name = 'free'
  LIMIT 1;

  IF v_free_plan_id IS NULL THEN
    RAISE WARNING 'Free plan not found - cannot backfill existing stores';
    RETURN;
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
      NOW() + INTERVAL '1 year',
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
      5,
      0,
      0,
      CURRENT_DATE
    )
    ON CONFLICT (store_id) DO NOTHING;

    v_stores_updated := v_stores_updated + 1;
    RAISE NOTICE 'Backfilled subscription for store: % (%)', v_store.name, v_store.id;
  END LOOP;

  IF v_stores_updated > 0 THEN
    RAISE NOTICE 'Backfilled % stores with free plan subscription', v_stores_updated;
  ELSE
    RAISE NOTICE 'No stores needed backfilling - all stores already have subscriptions';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification:
-- 1. Check if trigger exists:
--    SELECT tgname, tgtype, tgenabled FROM pg_trigger WHERE tgname = 'assign_free_plan_on_store_creation';
--
-- 2. Verify all stores have subscriptions:
--    SELECT s.id, s.name, sub.status, sp.name as plan_name
--    FROM stores s
--    LEFT JOIN subscriptions sub ON sub.store_id = s.id
--    LEFT JOIN subscription_plans sp ON sp.id = sub.plan_id
--    WHERE s.is_active = true
--    ORDER BY s.created_at DESC;
--
-- 3. Test by creating a new store and checking if subscription is assigned automatically
