-- =============================================
-- Migration: Add Inventory/Stock Management
-- Description: Add stock tracking for non-food stores with automatic reduction on order ready
-- Date: 2026-02-03
-- Feature: Only enabled for non-food stores (is_food_business = false)
-- =============================================

-- ============================================================================
-- PART 1: Add stock columns to menu_items table
-- ============================================================================

-- Add stock tracking columns
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stock_minimum INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.menu_items.stock_quantity IS
'Current stock quantity. NULL means unlimited/not tracked.';

COMMENT ON COLUMN public.menu_items.stock_minimum IS
'Minimum stock threshold for low-stock alerts. Default 0.';

COMMENT ON COLUMN public.menu_items.track_stock IS
'Whether to track stock for this product. Only applicable for non-food stores.';

-- Create index for stock queries
CREATE INDEX IF NOT EXISTS idx_menu_items_stock
ON public.menu_items(store_id, track_stock, stock_quantity, stock_minimum)
WHERE track_stock = true;

-- ============================================================================
-- PART 2: Create stock_history table for audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  quantity_changed INTEGER NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('order', 'manual_adjustment', 'restock')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_history_item ON public.stock_history(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_order ON public.stock_history(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created ON public.stock_history(created_at DESC);

COMMENT ON TABLE public.stock_history IS
'Audit trail for all stock changes including orders, manual adjustments, and restocks.';

-- RLS for stock_history
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can view their stock history" ON public.stock_history;
CREATE POLICY "Store owners can view their stock history"
ON public.stock_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.menu_items mi
    JOIN public.stores s ON s.id = mi.store_id
    WHERE mi.id = stock_history.menu_item_id
    AND s.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Store owners can insert stock history" ON public.stock_history;
CREATE POLICY "Store owners can insert stock history"
ON public.stock_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.menu_items mi
    JOIN public.stores s ON s.id = mi.store_id
    WHERE mi.id = menu_item_id
    AND s.owner_id = auth.uid()
  )
);

-- ============================================================================
-- PART 3: Function to reduce stock when order becomes ready
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reduce_stock_on_order_ready()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_is_food_business BOOLEAN;
BEGIN
  -- Only process when status changes TO 'ready'
  IF NEW.status = 'ready' AND (OLD.status IS NULL OR OLD.status != 'ready') THEN

    -- Check if store is non-food business
    SELECT is_food_business INTO v_is_food_business
    FROM public.stores
    WHERE id = NEW.store_id;

    -- Only reduce stock for non-food stores
    IF v_is_food_business = false THEN

      -- Process each order item that has stock tracking enabled
      FOR v_item IN
        SELECT oi.menu_item_id, oi.quantity, mi.stock_quantity, mi.track_stock, mi.name
        FROM public.order_items oi
        JOIN public.menu_items mi ON mi.id = oi.menu_item_id
        WHERE oi.order_id = NEW.id
        AND mi.track_stock = true
        AND mi.stock_quantity IS NOT NULL
      LOOP
        -- Reduce stock (allow negative for backorder scenarios)
        UPDATE public.menu_items
        SET stock_quantity = stock_quantity - v_item.quantity
        WHERE id = v_item.menu_item_id;

        -- Log to stock history
        INSERT INTO public.stock_history (
          menu_item_id, order_id, previous_stock, new_stock,
          quantity_changed, change_type, notes
        )
        VALUES (
          v_item.menu_item_id,
          NEW.id,
          v_item.stock_quantity,
          v_item.stock_quantity - v_item.quantity,
          -v_item.quantity,
          'order',
          'Pedido #' || LEFT(NEW.id::TEXT, 8) || ' - ' || v_item.name
        );
      END LOOP;

    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.reduce_stock_on_order_ready() IS
'Automatically reduces stock when an order status changes to ready. Only applies to non-food stores with track_stock enabled.';

-- Create trigger for stock reduction
DROP TRIGGER IF EXISTS trigger_reduce_stock_on_order_ready ON public.orders;
CREATE TRIGGER trigger_reduce_stock_on_order_ready
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.reduce_stock_on_order_ready();

-- ============================================================================
-- PART 4: RPC function to validate cart stock before checkout
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_cart_stock(
  p_store_id UUID,
  p_items JSONB -- Array of {menu_item_id, quantity}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_result JSONB := '[]'::JSONB;
  v_is_food_business BOOLEAN;
BEGIN
  -- Check if store is non-food business
  SELECT is_food_business INTO v_is_food_business
  FROM public.stores WHERE id = p_store_id;

  -- For food businesses, all items are valid (no stock tracking)
  IF v_is_food_business = true OR v_is_food_business IS NULL THEN
    RETURN jsonb_build_object('valid', true, 'items', '[]'::JSONB);
  END IF;

  -- Check each item
  FOR v_item IN
    SELECT
      (item->>'menu_item_id')::UUID as menu_item_id,
      (item->>'quantity')::INTEGER as requested_qty,
      mi.name,
      mi.stock_quantity,
      mi.track_stock
    FROM jsonb_array_elements(p_items) as item
    JOIN public.menu_items mi ON mi.id = (item->>'menu_item_id')::UUID
  LOOP
    -- If tracking stock and not enough quantity
    IF v_item.track_stock = true
       AND v_item.stock_quantity IS NOT NULL
       AND v_item.stock_quantity < v_item.requested_qty THEN
      v_result := v_result || jsonb_build_object(
        'menu_item_id', v_item.menu_item_id,
        'name', v_item.name,
        'requested', v_item.requested_qty,
        'available', GREATEST(v_item.stock_quantity, 0)
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'valid', jsonb_array_length(v_result) = 0,
    'items', v_result
  );
END;
$$;

COMMENT ON FUNCTION public.validate_cart_stock(UUID, JSONB) IS
'Validates cart items against available stock. Returns valid=true if all items have sufficient stock, or list of items with insufficient stock.';

GRANT EXECUTE ON FUNCTION public.validate_cart_stock(UUID, JSONB) TO anon, authenticated;

-- ============================================================================
-- PART 5: RPC to get products with low stock (for admin dashboard)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_low_stock_products(p_store_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  stock_quantity INTEGER,
  stock_minimum INTEGER,
  image_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi.id, mi.name, mi.stock_quantity, mi.stock_minimum, mi.image_url
  FROM public.menu_items mi
  JOIN public.stores s ON s.id = mi.store_id
  WHERE mi.store_id = p_store_id
    AND s.is_food_business = false
    AND mi.track_stock = true
    AND mi.stock_quantity IS NOT NULL
    AND mi.stock_quantity <= mi.stock_minimum
  ORDER BY mi.stock_quantity ASC;
END;
$$;

COMMENT ON FUNCTION public.get_low_stock_products(UUID) IS
'Returns all products with stock at or below their minimum threshold for a given store.';

GRANT EXECUTE ON FUNCTION public.get_low_stock_products(UUID) TO authenticated;

-- ============================================================================
-- PART 6: RPC to manually adjust stock (for admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_menu_item_id UUID,
  p_new_quantity INTEGER,
  p_change_type TEXT DEFAULT 'manual_adjustment',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_quantity INTEGER;
  v_store_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  -- Get current stock and store_id
  SELECT mi.stock_quantity, mi.store_id INTO v_old_quantity, v_store_id
  FROM public.menu_items mi
  WHERE mi.id = p_menu_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  -- Check if user is store owner
  SELECT EXISTS(
    SELECT 1 FROM public.stores
    WHERE id = v_store_id AND owner_id = auth.uid()
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Update stock
  UPDATE public.menu_items
  SET stock_quantity = p_new_quantity
  WHERE id = p_menu_item_id;

  -- Log to history
  INSERT INTO public.stock_history (
    menu_item_id, previous_stock, new_stock,
    quantity_changed, change_type, notes, created_by
  )
  VALUES (
    p_menu_item_id,
    v_old_quantity,
    p_new_quantity,
    p_new_quantity - COALESCE(v_old_quantity, 0),
    p_change_type,
    p_notes,
    auth.uid()
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_stock', v_old_quantity,
    'new_stock', p_new_quantity
  );
END;
$$;

COMMENT ON FUNCTION public.adjust_product_stock(UUID, INTEGER, TEXT, TEXT) IS
'Manually adjust product stock with automatic history logging. Only store owners can use this.';

GRANT EXECUTE ON FUNCTION public.adjust_product_stock(UUID, INTEGER, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries:
-- 1. Check if stock columns exist:
--    SELECT column_name, data_type, column_default
--    FROM information_schema.columns
--    WHERE table_name = 'menu_items' AND column_name IN ('stock_quantity', 'stock_minimum', 'track_stock');
--
-- 2. Check stock_history table:
--    SELECT * FROM information_schema.tables WHERE table_name = 'stock_history';
--
-- 3. Test validate_cart_stock function:
--    SELECT validate_cart_stock('store-uuid', '[{"menu_item_id": "item-uuid", "quantity": 5}]'::jsonb);
--
-- 4. Test get_low_stock_products function:
--    SELECT * FROM get_low_stock_products('store-uuid');
