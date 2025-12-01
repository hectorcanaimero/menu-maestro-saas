-- =====================================================
-- DELIVERY MANAGEMENT SYSTEM
-- =====================================================

-- 1. Create drivers table (motoristas)
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  vehicle_type TEXT DEFAULT 'motorcycle', -- motorcycle, bicycle, car, walking
  license_plate TEXT,
  status TEXT DEFAULT 'offline', -- available, busy, offline
  is_active BOOLEAN DEFAULT true,
  current_lat NUMERIC,
  current_lng NUMERIC,
  last_location_update TIMESTAMPTZ,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create driver_locations table (historial de ubicaciones)
CREATE TABLE public.driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed NUMERIC,
  heading NUMERIC,
  accuracy NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create delivery_assignments table (asignaciones de entregas)
CREATE TABLE public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  status TEXT DEFAULT 'assigned', -- assigned, picked_up, in_transit, delivered, cancelled
  assigned_at TIMESTAMPTZ DEFAULT now(),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  distance_km NUMERIC,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  route_polyline TEXT,
  delivery_notes TEXT,
  customer_signature_url TEXT,
  delivery_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Add columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES drivers(id),
ADD COLUMN IF NOT EXISTS delivery_lat NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_lng NUMERIC,
ADD COLUMN IF NOT EXISTS distance_km NUMERIC,
ADD COLUMN IF NOT EXISTS calculated_delivery_price NUMERIC,
ADD COLUMN IF NOT EXISTS estimated_delivery_minutes INTEGER;

-- 5. Add columns to stores table for delivery configuration
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS price_per_km NUMERIC DEFAULT 0.50,
ADD COLUMN IF NOT EXISTS base_delivery_price NUMERIC DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS store_lat NUMERIC,
ADD COLUMN IF NOT EXISTS store_lng NUMERIC,
ADD COLUMN IF NOT EXISTS store_address_full TEXT,
ADD COLUMN IF NOT EXISTS max_delivery_distance_km NUMERIC DEFAULT 15,
ADD COLUMN IF NOT EXISTS delivery_price_mode_v2 TEXT DEFAULT 'fixed'; -- fixed, per_km, zones

-- 6. Enable RLS on new tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for drivers
CREATE POLICY "Store owners can manage their drivers"
ON public.drivers FOR ALL
USING (user_owns_store(store_id))
WITH CHECK (user_owns_store(store_id));

CREATE POLICY "Drivers can view themselves"
ON public.drivers FOR SELECT
USING (phone = current_setting('request.jwt.claims', true)::json->>'phone');

-- 8. RLS Policies for driver_locations
CREATE POLICY "Store owners can view driver locations"
ON public.driver_locations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM drivers d
  WHERE d.id = driver_locations.driver_id
  AND user_owns_store(d.store_id)
));

CREATE POLICY "Drivers can insert their locations"
ON public.driver_locations FOR INSERT
WITH CHECK (true);

-- 9. RLS Policies for delivery_assignments
CREATE POLICY "Store owners can manage delivery assignments"
ON public.delivery_assignments FOR ALL
USING (user_owns_store(store_id))
WITH CHECK (user_owns_store(store_id));

CREATE POLICY "Customers can view their delivery assignment"
ON public.delivery_assignments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders o
  WHERE o.id = delivery_assignments.order_id
  AND (o.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
       OR o.user_id = auth.uid())
));

-- 10. Create indexes for performance
CREATE INDEX idx_drivers_store_id ON public.drivers(store_id);
CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX idx_driver_locations_recorded_at ON public.driver_locations(recorded_at DESC);
CREATE INDEX idx_delivery_assignments_order_id ON public.delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_driver_id ON public.delivery_assignments(driver_id);
CREATE INDEX idx_delivery_assignments_status ON public.delivery_assignments(status);
CREATE INDEX idx_orders_assigned_driver_id ON public.orders(assigned_driver_id);

-- 11. Enable realtime for driver_locations and delivery_assignments
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_assignments;

-- 12. Create trigger for updating updated_at on drivers
CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Create trigger for updating updated_at on delivery_assignments
CREATE TRIGGER update_delivery_assignments_updated_at
BEFORE UPDATE ON public.delivery_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Function to update driver's current location
CREATE OR REPLACE FUNCTION public.update_driver_location(
  p_driver_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_speed NUMERIC DEFAULT NULL,
  p_heading NUMERIC DEFAULT NULL,
  p_accuracy NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update driver's current location
  UPDATE public.drivers
  SET 
    current_lat = p_latitude,
    current_lng = p_longitude,
    last_location_update = now()
  WHERE id = p_driver_id;

  -- Insert location history
  INSERT INTO public.driver_locations (
    driver_id,
    latitude,
    longitude,
    speed,
    heading,
    accuracy
  ) VALUES (
    p_driver_id,
    p_latitude,
    p_longitude,
    p_speed,
    p_heading,
    p_accuracy
  );

  RETURN TRUE;
END;
$$;

-- 15. Function to assign driver to order
CREATE OR REPLACE FUNCTION public.assign_driver_to_order(
  p_order_id UUID,
  p_driver_id UUID,
  p_distance_km NUMERIC DEFAULT NULL,
  p_estimated_minutes INTEGER DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  assignment_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_assignment_id UUID;
BEGIN
  -- Get store_id from order
  SELECT store_id INTO v_store_id FROM orders WHERE id = p_order_id;

  -- Verify store ownership
  IF NOT user_owns_store(v_store_id) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No tienes permiso para asignar motoristas'::TEXT;
    RETURN;
  END IF;

  -- Update order with assigned driver
  UPDATE orders SET 
    assigned_driver_id = p_driver_id,
    distance_km = p_distance_km,
    estimated_delivery_minutes = p_estimated_minutes
  WHERE id = p_order_id;

  -- Create delivery assignment
  INSERT INTO delivery_assignments (
    order_id,
    driver_id,
    store_id,
    distance_km,
    estimated_minutes,
    status
  ) VALUES (
    p_order_id,
    p_driver_id,
    v_store_id,
    p_distance_km,
    p_estimated_minutes,
    'assigned'
  )
  RETURNING id INTO v_assignment_id;

  -- Update driver status to busy
  UPDATE drivers SET status = 'busy' WHERE id = p_driver_id;

  RETURN QUERY SELECT TRUE, v_assignment_id, NULL::TEXT;
END;
$$;

-- 16. Function to update delivery status
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

  -- Update order status based on delivery status
  IF p_status = 'delivered' THEN
    UPDATE orders SET status = 'delivered' WHERE id = v_assignment.order_id;
    -- Set driver back to available
    UPDATE drivers SET status = 'available' WHERE id = v_assignment.driver_id;
  ELSIF p_status = 'in_transit' THEN
    UPDATE orders SET status = 'on_the_way' WHERE id = v_assignment.order_id;
  ELSIF p_status = 'picked_up' THEN
    UPDATE orders SET status = 'on_the_way' WHERE id = v_assignment.order_id;
  ELSIF p_status = 'cancelled' THEN
    -- Set driver back to available on cancellation
    UPDATE drivers SET status = 'available' WHERE id = v_assignment.driver_id;
    UPDATE orders SET assigned_driver_id = NULL WHERE id = v_assignment.order_id;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;