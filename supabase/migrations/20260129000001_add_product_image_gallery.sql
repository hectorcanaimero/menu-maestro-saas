-- =============================================
-- Migration: Add Product Image Gallery
-- Description: Add support for multiple images per product with plan-based limits
-- Date: 2026-01-29
-- Limits: free=3, starter=5, pro=8
-- Only enabled for non-food stores (catalog/tienda mode)
-- =============================================

-- ============================================================================
-- PART 1: Add images column to menu_items table
-- ============================================================================

-- Add images JSONB array column (stores array of image URLs)
-- The image_url column remains as the primary/main image for backward compatibility
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.menu_items.images IS
'Array of additional product images. First image is used as gallery cover. Primary image_url remains for backward compatibility.';

-- Create index for better performance on images column
CREATE INDEX IF NOT EXISTS idx_menu_items_images ON public.menu_items USING gin(images);

-- ============================================================================
-- PART 2: Update subscription_plans with max_product_images limit
-- ============================================================================

-- Update free plan: 3 images
UPDATE public.subscription_plans
SET limits = limits || '{"max_product_images": 3}'::jsonb
WHERE name = 'free';

-- Update trial/starter plan: 5 images
UPDATE public.subscription_plans
SET limits = limits || '{"max_product_images": 5}'::jsonb
WHERE name = 'trial';

-- Update basic plan: 5 images (same as starter)
UPDATE public.subscription_plans
SET limits = limits || '{"max_product_images": 5}'::jsonb
WHERE name = 'basic';

-- Update pro plan: 8 images
UPDATE public.subscription_plans
SET limits = limits || '{"max_product_images": 8}'::jsonb
WHERE name = 'pro';

-- Update enterprise plan: unlimited (-1 or large number)
UPDATE public.subscription_plans
SET limits = limits || '{"max_product_images": -1}'::jsonb
WHERE name = 'enterprise';

-- ============================================================================
-- PART 3: Create helper function to check image limit
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_max_product_images(p_store_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Get max_product_images from the store's subscription plan
  SELECT COALESCE((sp.limits->>'max_product_images')::INTEGER, 3) INTO v_limit
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id
    AND s.status IN ('trial', 'active');

  -- If no subscription found, return default (3 for free)
  IF v_limit IS NULL THEN
    v_limit := 3;
  END IF;

  -- -1 means unlimited, convert to a large number for comparison
  IF v_limit = -1 THEN
    v_limit := 999;
  END IF;

  RETURN v_limit;
END;
$$;

COMMENT ON FUNCTION public.get_max_product_images(UUID) IS
'Returns the maximum number of product images allowed for a store based on their subscription plan.';

-- ============================================================================
-- PART 4: Create function to validate image count before insert/update
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_product_images_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_images INTEGER;
  v_current_count INTEGER;
  v_is_food_business BOOLEAN;
BEGIN
  -- Check if this is a food business (gallery only for non-food)
  SELECT is_food_business INTO v_is_food_business
  FROM public.stores
  WHERE id = NEW.store_id;

  -- If food business, clear images array (not allowed)
  IF v_is_food_business = true THEN
    NEW.images := '[]'::jsonb;
    RETURN NEW;
  END IF;

  -- Get max images allowed for this store
  v_max_images := public.get_max_product_images(NEW.store_id);

  -- Count current images (if images is not null)
  IF NEW.images IS NOT NULL AND jsonb_typeof(NEW.images) = 'array' THEN
    v_current_count := jsonb_array_length(NEW.images);

    -- If exceeds limit, truncate to max allowed
    IF v_current_count > v_max_images THEN
      -- Keep only first N images
      NEW.images := (
        SELECT jsonb_agg(elem)
        FROM (
          SELECT elem
          FROM jsonb_array_elements(NEW.images) WITH ORDINALITY AS t(elem, ord)
          ORDER BY ord
          LIMIT v_max_images
        ) sub
      );

      RAISE WARNING 'Product images truncated to % (plan limit)', v_max_images;
    END IF;
  ELSE
    NEW.images := '[]'::jsonb;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_product_images_limit() IS
'Trigger function to validate product image count against subscription plan limits. Only allows images for non-food stores.';

-- Create trigger to validate image limits
DROP TRIGGER IF EXISTS validate_product_images_on_upsert ON public.menu_items;

CREATE TRIGGER validate_product_images_on_upsert
BEFORE INSERT OR UPDATE ON public.menu_items
FOR EACH ROW
WHEN (NEW.images IS NOT NULL)
EXECUTE FUNCTION public.validate_product_images_limit();

-- ============================================================================
-- PART 5: Add RPC function to get store image limit info
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_product_image_limits(p_store_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_images INTEGER;
  v_is_food_business BOOLEAN;
  v_plan_name TEXT;
BEGIN
  -- Check if this is a food business
  SELECT is_food_business INTO v_is_food_business
  FROM public.stores
  WHERE id = p_store_id;

  -- Get plan info
  SELECT sp.display_name, COALESCE((sp.limits->>'max_product_images')::INTEGER, 3)
  INTO v_plan_name, v_max_images
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = p_store_id
    AND s.status IN ('trial', 'active');

  -- Default values if no subscription
  IF v_plan_name IS NULL THEN
    v_plan_name := 'Free';
    v_max_images := 3;
  END IF;

  RETURN jsonb_build_object(
    'enabled', NOT COALESCE(v_is_food_business, true),
    'max_images', CASE WHEN v_max_images = -1 THEN 999 ELSE v_max_images END,
    'is_unlimited', v_max_images = -1,
    'plan_name', v_plan_name
  );
END;
$$;

COMMENT ON FUNCTION public.get_product_image_limits(UUID) IS
'Returns product image limits info for a store including whether gallery is enabled and max images allowed.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_product_image_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_max_product_images(UUID) TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries:
-- 1. Check if images column exists:
--    SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'menu_items' AND column_name = 'images';
--
-- 2. Check plan limits:
--    SELECT name, display_name, limits->>'max_product_images' as max_images
--    FROM subscription_plans;
--
-- 3. Test limit function:
--    SELECT get_max_product_images('store-uuid-here');
