-- ============================================================================
-- Migration: Admin Order Management
-- Date: 2025-11-30
-- Description: Add RPCs and policies for creating and editing orders from admin panel
-- ============================================================================

-- ============================================================================
-- PART 1: RPC Function to Create Order from Admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_store_id UUID,
  p_customer_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_order_type TEXT,
  p_total_amount NUMERIC,
  p_items JSONB, -- Array of {menu_item_id, quantity, price_at_time, item_name, extras: [{name, price}]}
  p_delivery_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_delivery_price NUMERIC DEFAULT 0
)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_order_item_id UUID;
  v_extra JSONB;
BEGIN
  -- Verify that the user is the owner of the store
  IF NOT public.user_owns_store(p_store_id) THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, 'No tienes permiso para crear pedidos en esta tienda';
    RETURN;
  END IF;

  -- Validate order type
  IF p_order_type NOT IN ('delivery', 'pickup', 'dine_in') THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, 'Tipo de pedido inválido';
    RETURN;
  END IF;

  -- Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, 'El pedido debe contener al menos un producto';
    RETURN;
  END IF;

  -- Create the order
  INSERT INTO public.orders (
    store_id,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    order_type,
    delivery_address,
    notes,
    payment_method,
    total_amount,
    delivery_price,
    status,
    user_id
  )
  VALUES (
    p_store_id,
    p_customer_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_order_type,
    p_delivery_address,
    p_notes,
    p_payment_method,
    p_total_amount,
    p_delivery_price,
    'pending',
    auth.uid()
  )
  RETURNING id INTO v_order_id;

  -- Generate order number (first 8 chars of UUID)
  v_order_number := UPPER(SUBSTRING(v_order_id::TEXT FROM 1 FOR 8));

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert order item
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      quantity,
      price_at_time,
      item_name
    )
    VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price_at_time')::NUMERIC,
      v_item->>'item_name'
    )
    RETURNING id INTO v_order_item_id;

    -- Insert extras if present
    IF v_item->'extras' IS NOT NULL AND jsonb_array_length(v_item->'extras') > 0 THEN
      FOR v_extra IN SELECT * FROM jsonb_array_elements(v_item->'extras')
      LOOP
        INSERT INTO public.order_item_extras (
          order_item_id,
          extra_name,
          extra_price
        )
        VALUES (
          v_order_item_id,
          v_extra->>'name',
          (v_extra->>'price')::NUMERIC
        );
      END LOOP;
    END IF;
  END LOOP;

  -- Return success
  RETURN QUERY SELECT v_order_id, v_order_number, TRUE, NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.admin_create_order IS
'Creates a new order from the admin panel. Validates store ownership and creates order with items and extras in a single transaction.';

-- ============================================================================
-- PART 2: RPC Function to Update Order from Admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_update_order(
  p_order_id UUID,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_items JSONB DEFAULT NULL, -- If provided, replaces all items
  p_recalculate_total BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  new_total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_order_status TEXT;
  v_item JSONB;
  v_order_item_id UUID;
  v_extra JSONB;
  v_new_total NUMERIC := 0;
  v_delivery_price NUMERIC := 0;
BEGIN
  -- Get store_id and current status from the order
  SELECT store_id, status, delivery_price
  INTO v_store_id, v_order_status, v_delivery_price
  FROM public.orders
  WHERE id = p_order_id;

  IF v_store_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Pedido no encontrado', 0::NUMERIC;
    RETURN;
  END IF;

  -- Verify store ownership
  IF NOT public.user_owns_store(v_store_id) THEN
    RETURN QUERY SELECT FALSE, 'No tienes permiso para editar este pedido', 0::NUMERIC;
    RETURN;
  END IF;

  -- Check if order can be edited (only pending, confirmed, preparing statuses)
  IF v_order_status NOT IN ('pending', 'confirmed', 'preparing') THEN
    RETURN QUERY SELECT FALSE, 'Este pedido ya no puede ser editado (estado: ' || v_order_status || ')', 0::NUMERIC;
    RETURN;
  END IF;

  -- Update order fields if provided
  UPDATE public.orders
  SET
    customer_name = COALESCE(p_customer_name, customer_name),
    customer_email = COALESCE(p_customer_email, customer_email),
    customer_phone = COALESCE(p_customer_phone, customer_phone),
    delivery_address = COALESCE(p_delivery_address, delivery_address),
    notes = COALESCE(p_notes, notes),
    payment_method = COALESCE(p_payment_method, payment_method),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Replace items if provided
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    -- Delete existing items and extras (cascades)
    DELETE FROM public.order_items WHERE order_id = p_order_id;

    -- Insert new items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO public.order_items (
        order_id,
        menu_item_id,
        quantity,
        price_at_time,
        item_name
      )
      VALUES (
        p_order_id,
        (v_item->>'menu_item_id')::UUID,
        (v_item->>'quantity')::INTEGER,
        (v_item->>'price_at_time')::NUMERIC,
        v_item->>'item_name'
      )
      RETURNING id INTO v_order_item_id;

      -- Calculate item total
      v_new_total := v_new_total + ((v_item->>'price_at_time')::NUMERIC * (v_item->>'quantity')::INTEGER);

      -- Insert extras if present
      IF v_item->'extras' IS NOT NULL AND jsonb_array_length(v_item->'extras') > 0 THEN
        FOR v_extra IN SELECT * FROM jsonb_array_elements(v_item->'extras')
        LOOP
          INSERT INTO public.order_item_extras (
            order_item_id,
            extra_name,
            extra_price
          )
          VALUES (
            v_order_item_id,
            v_extra->>'name',
            (v_extra->>'price')::NUMERIC
          );

          -- Add extra price to total
          v_new_total := v_new_total + ((v_extra->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER);
        END LOOP;
      END IF;
    END LOOP;

    -- Update total if requested
    IF p_recalculate_total THEN
      v_new_total := v_new_total + v_delivery_price;
      UPDATE public.orders
      SET total_amount = v_new_total,
          updated_at = NOW()
      WHERE id = p_order_id;
    END IF;
  ELSE
    -- If not replacing items, get current total
    SELECT total_amount INTO v_new_total FROM public.orders WHERE id = p_order_id;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT, v_new_total;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM, 0::NUMERIC;
END;
$$;

COMMENT ON FUNCTION public.admin_update_order IS
'Updates an existing order from the admin panel. Can update customer info, delivery address, status, and optionally replace all items. Only allows editing orders in pending/confirmed/preparing status.';

-- ============================================================================
-- PART 3: RPC Function to Check if Order Can Be Edited
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_can_edit_order(p_order_id UUID)
RETURNS TABLE (
  can_edit BOOLEAN,
  reason TEXT,
  current_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_status TEXT;
BEGIN
  -- Get store and status
  SELECT store_id, status
  INTO v_store_id, v_status
  FROM public.orders
  WHERE id = p_order_id;

  IF v_store_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Pedido no encontrado', NULL::TEXT;
    RETURN;
  END IF;

  -- Check ownership
  IF NOT public.user_owns_store(v_store_id) THEN
    RETURN QUERY SELECT FALSE, 'No tienes permiso para editar este pedido', v_status;
    RETURN;
  END IF;

  -- Check status
  IF v_status NOT IN ('pending', 'confirmed', 'preparing') THEN
    RETURN QUERY SELECT FALSE, 'Este pedido ya no puede ser editado (estado: ' || v_status || ')', v_status;
    RETURN;
  END IF;

  -- Can edit
  RETURN QUERY SELECT TRUE, 'Pedido puede ser editado', v_status;
END;
$$;

COMMENT ON FUNCTION public.admin_can_edit_order IS
'Checks if an order can be edited by the current admin user. Returns boolean and reason.';

-- ============================================================================
-- PART 4: Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.admin_create_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_can_edit_order TO authenticated;

-- ============================================================================
-- PART 5: Add INSERT Policy for Orders (Admin Only)
-- ============================================================================

-- Allow store owners to insert orders (for manual order creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'orders'
    AND policyname = 'Store owners can create orders manually'
  ) THEN
    CREATE POLICY "Store owners can create orders manually"
    ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (public.user_owns_store(store_id));
  END IF;
END $$;

-- Allow store owners to insert order_items (for manual order creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'order_items'
    AND policyname = 'Store owners can create order items'
  ) THEN
    CREATE POLICY "Store owners can create order items"
    ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND public.user_owns_store(orders.store_id)
      )
    );
  END IF;
END $$;

-- Allow store owners to insert order_item_extras (for manual order creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'order_item_extras'
    AND policyname = 'Store owners can create order item extras'
  ) THEN
    CREATE POLICY "Store owners can create order item extras"
    ON public.order_item_extras
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        WHERE oi.id = order_item_extras.order_item_id
        AND public.user_owns_store(o.store_id)
      )
    );
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Test queries (for development/testing):
--
-- 1. Test admin_create_order:
--    SELECT * FROM admin_create_order(
--      '<store_id>',
--      '<customer_id>',
--      'John Doe',
--      'john@example.com',
--      '+58 414 123-4567',
--      'delivery',
--      'Av. Principal, Casa 123',
--      'Sin cebolla',
--      'Efectivo',
--      25.50,
--      5.00,
--      '[{"menu_item_id": "<uuid>", "quantity": 2, "price_at_time": 10.00, "item_name": "Pizza", "extras": [{"name": "Extra cheese", "price": 2.50}]}]'::jsonb
--    );
--
-- 2. Test admin_update_order:
--    SELECT * FROM admin_update_order(
--      '<order_id>',
--      p_notes := 'Actualizado: sin picante',
--      p_status := 'confirmed'
--    );
--
-- 3. Test admin_can_edit_order:
--    SELECT * FROM admin_can_edit_order('<order_id>');
