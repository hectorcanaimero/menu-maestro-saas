-- =============================================
-- Migration: Integrate Subscription Limits
-- Description: Add triggers to enforce subscription limits
-- =============================================

-- =============================================
-- 1. TRIGGER FUNCTION: Validate menu_items limit
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_menu_items_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id UUID;
  v_current_count INT;
  v_limit_result JSONB;
BEGIN
  -- Get store_id
  v_store_id := NEW.store_id;

  -- Validate limit using existing function
  v_limit_result := public.validate_plan_limit(v_store_id, 'products');

  -- Check if limit is exceeded
  IF (v_limit_result->>'allowed')::BOOLEAN = FALSE THEN
    RAISE EXCEPTION 'Límite de productos alcanzado. Tu plan permite % productos y ya tienes %. Actualiza tu plan para agregar más productos.',
      v_limit_result->>'limit',
      v_limit_result->>'current';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger to menu_items
DROP TRIGGER IF EXISTS enforce_menu_items_limit ON public.menu_items;
CREATE TRIGGER enforce_menu_items_limit
  BEFORE INSERT ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_menu_items_limit();

-- =============================================
-- 2. TRIGGER FUNCTION: Validate categories limit
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_categories_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id UUID;
  v_current_count INT;
  v_limit_result JSONB;
BEGIN
  -- Get store_id
  v_store_id := NEW.store_id;

  -- Validate limit using existing function
  v_limit_result := public.validate_plan_limit(v_store_id, 'categories');

  -- Check if limit is exceeded
  IF (v_limit_result->>'allowed')::BOOLEAN = FALSE THEN
    RAISE EXCEPTION 'Límite de categorías alcanzado. Tu plan permite % categorías y ya tienes %. Actualiza tu plan para agregar más categorías.',
      v_limit_result->>'limit',
      v_limit_result->>'current';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger to categories
DROP TRIGGER IF EXISTS enforce_categories_limit ON public.categories;
CREATE TRIGGER enforce_categories_limit
  BEFORE INSERT ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_categories_limit();

-- =============================================
-- 3. TRIGGER FUNCTION: Validate orders limit (monthly)
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_orders_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id UUID;
  v_current_count INT;
  v_limit_result JSONB;
BEGIN
  -- Get store_id
  v_store_id := NEW.store_id;

  -- Validate limit using existing function
  v_limit_result := public.validate_plan_limit(v_store_id, 'orders_this_month');

  -- Check if limit is exceeded
  IF (v_limit_result->>'allowed')::BOOLEAN = FALSE THEN
    RAISE EXCEPTION 'Límite de órdenes mensuales alcanzado. Tu plan permite % órdenes por mes y ya tienes % este mes. Actualiza tu plan para procesar más órdenes.',
      v_limit_result->>'limit',
      v_limit_result->>'current';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger to orders
DROP TRIGGER IF EXISTS enforce_orders_limit ON public.orders;
CREATE TRIGGER enforce_orders_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_orders_limit();

-- =============================================
-- 4. CREATE INDEXES for performance
-- =============================================

-- Index for counting products per store
CREATE INDEX IF NOT EXISTS idx_menu_items_store_id_created ON public.menu_items(store_id, created_at DESC);

-- Index for counting categories per store
CREATE INDEX IF NOT EXISTS idx_categories_store_id_created ON public.categories(store_id, created_at DESC);

-- Index for counting orders per store per month
CREATE INDEX IF NOT EXISTS idx_orders_store_id_created ON public.orders(store_id, created_at DESC);

-- =============================================
-- 5. GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION public.validate_menu_items_limit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_categories_limit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_orders_limit() TO authenticated;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON FUNCTION public.validate_menu_items_limit() IS 'Validates that store has not exceeded product limit before inserting new menu item';
COMMENT ON FUNCTION public.validate_categories_limit() IS 'Validates that store has not exceeded category limit before inserting new category';
COMMENT ON FUNCTION public.validate_orders_limit() IS 'Validates that store has not exceeded monthly order limit before inserting new order';
