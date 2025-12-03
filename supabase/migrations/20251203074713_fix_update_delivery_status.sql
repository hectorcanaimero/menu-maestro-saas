-- Fix update_delivery_status to use valid order statuses

CREATE OR REPLACE FUNCTION public.update_delivery_status(
  p_assignment_id UUID,
  p_status TEXT,
  p_delivery_photo_url TEXT DEFAULT NULL,
  p_customer_signature_url TEXT DEFAULT NULL,
  p_delivery_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment RECORD;
BEGIN
  -- Get assignment
  SELECT * INTO v_assignment FROM delivery_assignments WHERE id = p_assignment_id;

  IF v_assignment IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Asignación no encontrada'::TEXT;
    RETURN;
  END IF;

  -- Update assignment status
  UPDATE delivery_assignments SET
    status = p_status,
    delivery_photo_url = COALESCE(p_delivery_photo_url, delivery_photo_url),
    customer_signature_url = COALESCE(p_customer_signature_url, customer_signature_url),
    delivery_notes = COALESCE(p_delivery_notes, delivery_notes),
    picked_up_at = CASE WHEN p_status = 'picked_up' AND picked_up_at IS NULL THEN now() ELSE picked_up_at END,
    delivered_at = CASE WHEN p_status = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END,
    actual_minutes = CASE 
      WHEN p_status = 'delivered' 
      THEN EXTRACT(EPOCH FROM (now() - assigned_at)) / 60 
      ELSE actual_minutes 
    END
  WHERE id = p_assignment_id;

  -- Update order status based on delivery status (using valid statuses)
  IF p_status = 'delivered' THEN
    UPDATE orders SET status = 'delivered' WHERE id = v_assignment.order_id;
    -- Set driver back to available
    UPDATE drivers SET status = 'available' WHERE id = v_assignment.driver_id;
  ELSIF p_status = 'in_transit' OR p_status = 'picked_up' THEN
    -- Use 'preparing' instead of 'on_the_way' which doesn't exist
    UPDATE orders SET status = 'preparing' WHERE id = v_assignment.order_id;
  ELSIF p_status = 'cancelled' THEN
    -- Set driver back to available on cancellation
    UPDATE drivers SET status = 'available' WHERE id = v_assignment.driver_id;
    UPDATE orders SET assigned_driver_id = NULL WHERE id = v_assignment.order_id;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;
