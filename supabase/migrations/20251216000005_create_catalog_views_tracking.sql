-- Create catalog_views_monthly table to track monthly views per store
-- This table stores the count of catalog page views for each store per month
-- Used to enforce free tier limits on catalog mode

CREATE TABLE IF NOT EXISTS public.catalog_views_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- Format: YYYY-MM-01 (first day of month)
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_store_month UNIQUE (store_id, month)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_catalog_views_store_month ON public.catalog_views_monthly(store_id, month);
CREATE INDEX IF NOT EXISTS idx_catalog_views_month ON public.catalog_views_monthly(month);

-- Add comment to document the table
COMMENT ON TABLE public.catalog_views_monthly IS 'Tracks monthly catalog page views per store for enforcing free tier limits';

-- Add catalog_view_limit to subscription_plans table
-- NULL means unlimited views (for premium plans)
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS catalog_view_limit INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.subscription_plans.catalog_view_limit IS 'Monthly limit for catalog page views. NULL means unlimited (premium plans). Default free tier will be set via platform admin.';

-- Function to increment view count for current month
-- This will be called when a catalog_page_view event is tracked
CREATE OR REPLACE FUNCTION public.increment_catalog_view(p_store_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current_month DATE;
  v_new_count INTEGER;
BEGIN
  -- Get first day of current month
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

  -- Insert or update view count
  INSERT INTO public.catalog_views_monthly (store_id, month, view_count, updated_at)
  VALUES (p_store_id, v_current_month, 1, NOW())
  ON CONFLICT (store_id, month)
  DO UPDATE SET
    view_count = public.catalog_views_monthly.view_count + 1,
    updated_at = NOW()
  RETURNING view_count INTO v_new_count;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current month views for a store
CREATE OR REPLACE FUNCTION public.get_current_month_views(p_store_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current_month DATE;
  v_view_count INTEGER;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

  SELECT view_count INTO v_view_count
  FROM public.catalog_views_monthly
  WHERE store_id = p_store_id AND month = v_current_month;

  RETURN COALESCE(v_view_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if store has exceeded catalog view limit
-- Returns: { exceeded: boolean, soft_limit_exceeded: boolean, hard_blocked: boolean, current_views: integer, limit: integer, soft_limit: integer, percentage: float }
-- Soft limit = limit + 100 (grace period)
-- Hard blocked when soft_limit is exceeded
CREATE OR REPLACE FUNCTION public.check_catalog_view_limit(p_store_id UUID)
RETURNS JSON AS $$
DECLARE
  v_current_views INTEGER;
  v_limit INTEGER;
  v_soft_limit INTEGER;
  v_subscription_id UUID;
  v_plan_id UUID;
  v_percentage FLOAT;
  v_exceeded BOOLEAN;
  v_soft_limit_exceeded BOOLEAN;
  v_hard_blocked BOOLEAN;
BEGIN
  -- Get current month views
  v_current_views := public.get_current_month_views(p_store_id);

  -- Get store's active subscription plan
  SELECT s.plan_id INTO v_plan_id
  FROM public.stores st
  LEFT JOIN public.subscriptions s ON st.id = s.store_id
    AND s.status = 'active'
    AND s.current_period_end > NOW()
  WHERE st.id = p_store_id;

  -- Get plan's catalog view limit (NULL = unlimited)
  IF v_plan_id IS NOT NULL THEN
    SELECT catalog_view_limit INTO v_limit
    FROM public.subscription_plans
    WHERE id = v_plan_id;
  ELSE
    -- No active subscription, use default free tier limit
    -- Will be set by platform admin, default to 1000 for now
    v_limit := 1000;
  END IF;

  -- NULL limit means unlimited (premium)
  IF v_limit IS NULL THEN
    v_exceeded := FALSE;
    v_soft_limit_exceeded := FALSE;
    v_hard_blocked := FALSE;
    v_percentage := 0;
    v_soft_limit := NULL;
  ELSE
    -- Calculate soft limit (limit + 100 grace views)
    v_soft_limit := v_limit + 100;

    -- Check limits
    v_exceeded := v_current_views >= v_limit;
    v_soft_limit_exceeded := v_current_views >= v_soft_limit;
    v_hard_blocked := v_soft_limit_exceeded; -- Hard block when soft limit exceeded

    v_percentage := (v_current_views::FLOAT / v_limit::FLOAT) * 100;
  END IF;

  RETURN json_build_object(
    'exceeded', v_exceeded,
    'soft_limit_exceeded', v_soft_limit_exceeded,
    'hard_blocked', v_hard_blocked,
    'current_views', v_current_views,
    'limit', v_limit,
    'soft_limit', v_soft_limit,
    'percentage', ROUND(v_percentage::NUMERIC, 2),
    'is_unlimited', v_limit IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on catalog_views_monthly
ALTER TABLE public.catalog_views_monthly ENABLE ROW LEVEL SECURITY;

-- Policy: Store owners can view their own stats
CREATE POLICY "Store owners can view their catalog views"
  ON public.catalog_views_monthly
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Policy: Platform admins can view all stats
CREATE POLICY "Platform admins can view all catalog views"
  ON public.catalog_views_monthly
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: System can insert/update (via SECURITY DEFINER functions)
CREATE POLICY "System can manage catalog views"
  ON public.catalog_views_monthly
  FOR ALL
  USING (true)
  WITH CHECK (true);
