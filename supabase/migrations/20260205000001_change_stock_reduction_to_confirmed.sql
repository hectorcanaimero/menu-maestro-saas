-- =============================================
-- Migration: Change stock reduction trigger from 'ready' to 'confirmed'
-- Description: Stock is now reduced when order is confirmed, not when ready
-- Date: 2026-02-05
-- =============================================

-- Drop old trigger
DROP TRIGGER IF EXISTS trigger_reduce_stock_on_order_ready ON public.orders;

-- Drop old function
DROP FUNCTION IF EXISTS public.reduce_stock_on_order_ready();

-- ============================================================================
-- Create new function that triggers on 'confirmed' status
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reduce_stock_on_order_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_is_food_business BOOLEAN;
BEGIN
  -- Only process when status changes TO 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN

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

COMMENT ON FUNCTION public.reduce_stock_on_order_confirmed() IS
'Automatically reduces stock when an order status changes to confirmed. Only applies to non-food stores with track_stock enabled.';

-- Create new trigger for stock reduction on confirmed
CREATE TRIGGER trigger_reduce_stock_on_order_confirmed
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.reduce_stock_on_order_confirmed();

-- ============================================================================
-- PART 2: Function to restore stock when order is cancelled
-- ============================================================================

CREATE OR REPLACE FUNCTION public.restore_stock_on_order_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_is_food_business BOOLEAN;
BEGIN
  -- Only process when status changes TO 'cancelled' FROM 'confirmed' or later statuses
  -- (we only restore stock if it was previously deducted, i.e., order was confirmed)
  IF NEW.status = 'cancelled'
     AND OLD.status IS NOT NULL
     AND OLD.status IN ('confirmed', 'preparing', 'ready', 'out_for_delivery') THEN

    -- Check if store is non-food business
    SELECT is_food_business INTO v_is_food_business
    FROM public.stores
    WHERE id = NEW.store_id;

    -- Only restore stock for non-food stores
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
        -- Restore stock
        UPDATE public.menu_items
        SET stock_quantity = stock_quantity + v_item.quantity
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
          v_item.stock_quantity + v_item.quantity,
          v_item.quantity,
          'order',
          'Pedido cancelado #' || LEFT(NEW.id::TEXT, 8) || ' - ' || v_item.name || ' (stock restaurado)'
        );
      END LOOP;

    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.restore_stock_on_order_cancelled() IS
'Automatically restores stock when an order is cancelled after being confirmed. Only applies to non-food stores with track_stock enabled.';

-- Create trigger for stock restoration on cancellation
DROP TRIGGER IF EXISTS trigger_restore_stock_on_order_cancelled ON public.orders;
CREATE TRIGGER trigger_restore_stock_on_order_cancelled
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.restore_stock_on_order_cancelled();

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Stock will now be:
-- 1. REDUCED when order status changes to 'confirmed'
-- 2. RESTORED when order status changes to 'cancelled' (if previously confirmed)
