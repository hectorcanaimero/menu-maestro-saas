-- Migration: Fix WhatsApp Template Variables
-- Description: Add missing variables (store_name, estimated_time, delivery_message) to WhatsApp triggers
-- Created: 2026-01-05

-- ============================================================================
-- FUNCTION: Send WhatsApp notification when order is CONFIRMED
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_order_confirmed_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_store_name TEXT;
  v_estimated_time TEXT;
  v_response_id BIGINT;
  v_payload JSONB;
BEGIN
  -- Only process if status changed to 'confirmed'
  IF (TG_OP != 'UPDATE') OR (NEW.status != 'confirmed') OR (OLD.status = 'confirmed') THEN
    RETURN NEW;
  END IF;

  -- Get WhatsApp settings for this store
  SELECT
    ws.id,
    ws.is_enabled,
    ws.is_connected,
    ws.auto_order_confirmation
  INTO v_settings
  FROM whatsapp_settings ws
  WHERE ws.store_id = NEW.store_id;

  -- Check if WhatsApp module is enabled and automation is active
  IF NOT FOUND OR
     NOT v_settings.is_enabled OR
     NOT v_settings.is_connected OR
     NOT v_settings.auto_order_confirmation THEN
    RAISE NOTICE 'WhatsApp confirmation notification skipped for order %. Settings: enabled=%, connected=%, auto_confirm=%',
      NEW.id,
      COALESCE(v_settings.is_enabled::TEXT, 'null'),
      COALESCE(v_settings.is_connected::TEXT, 'null'),
      COALESCE(v_settings.auto_order_confirmation::TEXT, 'null');
    RETURN NEW;
  END IF;

  -- Get store name
  SELECT name INTO v_store_name
  FROM stores
  WHERE id = NEW.store_id;

  -- Calculate estimated time based on order type
  -- Default times: delivery = 45-60 min, pickup = 20-30 min
  v_estimated_time := CASE
    WHEN NEW.order_type = 'delivery' THEN '45-60 minutos'
    WHEN NEW.order_type = 'pickup' THEN '20-30 minutos'
    ELSE '30-45 minutos'
  END;

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'storeId', NEW.store_id,
    'customerPhone', NEW.customer_phone,
    'customerName', NEW.customer_name,
    'messageType', 'order_confirmation',
    'orderId', NEW.id,
    'variables', jsonb_build_object(
      'customer_name', COALESCE(NEW.customer_name, 'Cliente'),
      'order_number', SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
      'order_total', CONCAT('$', NEW.total_amount::TEXT),
      'estimated_time', v_estimated_time,
      'store_name', COALESCE(v_store_name, 'Nuestra tienda'),
      'order_type', COALESCE(NEW.order_type, 'pickup'),
      'delivery_address', COALESCE(NEW.delivery_address, '')
    )
  );

  -- Call edge function asynchronously using pg_net
  SELECT net.http_post(
    url := get_supabase_url() || '/functions/v1/send-whatsapp-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_service_role_key()
    ),
    body := v_payload
  ) INTO v_response_id;

  RAISE NOTICE 'WhatsApp confirmation notification queued for order %. Request ID: %', NEW.id, v_response_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order update
    RAISE WARNING 'Error sending WhatsApp confirmation notification for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Send WhatsApp notification when order is READY
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_order_ready_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_store_name TEXT;
  v_store_address TEXT;
  v_delivery_message TEXT;
  v_response_id BIGINT;
  v_payload JSONB;
BEGIN
  -- Only process if status changed to 'ready'
  IF (TG_OP != 'UPDATE') OR (NEW.status != 'ready') OR (OLD.status = 'ready') THEN
    RETURN NEW;
  END IF;

  -- Get WhatsApp settings for this store
  SELECT
    ws.id,
    ws.is_enabled,
    ws.is_connected,
    ws.auto_order_ready
  INTO v_settings
  FROM whatsapp_settings ws
  WHERE ws.store_id = NEW.store_id;

  -- Check if WhatsApp module is enabled and automation is active
  IF NOT FOUND OR
     NOT v_settings.is_enabled OR
     NOT v_settings.is_connected OR
     NOT v_settings.auto_order_ready THEN
    RAISE NOTICE 'WhatsApp ready notification skipped for order %. Settings: enabled=%, connected=%, auto_ready=%',
      NEW.id,
      COALESCE(v_settings.is_enabled::TEXT, 'null'),
      COALESCE(v_settings.is_connected::TEXT, 'null'),
      COALESCE(v_settings.auto_order_ready::TEXT, 'null');
    RETURN NEW;
  END IF;

  -- Get store name and address
  SELECT name, address INTO v_store_name, v_store_address
  FROM stores
  WHERE id = NEW.store_id;

  -- Generate delivery message based on order type
  IF NEW.order_type = 'delivery' THEN
    v_delivery_message := 'Tu pedido está en camino a: ' || COALESCE(NEW.delivery_address, 'tu dirección registrada');
  ELSIF NEW.order_type = 'pickup' THEN
    v_delivery_message := 'Puedes recoger tu pedido en: ' || COALESCE(v_store_address, 'nuestra tienda');
  ELSE
    v_delivery_message := 'Tu pedido está listo';
  END IF;

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'storeId', NEW.store_id,
    'customerPhone', NEW.customer_phone,
    'customerName', NEW.customer_name,
    'messageType', 'order_ready',
    'orderId', NEW.id,
    'variables', jsonb_build_object(
      'customer_name', COALESCE(NEW.customer_name, 'Cliente'),
      'order_number', SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
      'delivery_message', v_delivery_message,
      'store_name', COALESCE(v_store_name, 'Nuestra tienda'),
      'order_type', COALESCE(NEW.order_type, 'pickup')
    )
  );

  -- Call edge function asynchronously using pg_net
  SELECT net.http_post(
    url := get_supabase_url() || '/functions/v1/send-whatsapp-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_service_role_key()
    ),
    body := v_payload
  ) INTO v_response_id;

  RAISE NOTICE 'WhatsApp ready notification queued for order %. Request ID: %', NEW.id, v_response_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order update
    RAISE WARNING 'Error sending WhatsApp ready notification for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RECREATE TRIGGERS (in case they don't exist)
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_notify_order_confirmed_whatsapp ON orders;
DROP TRIGGER IF EXISTS trigger_notify_order_ready_whatsapp ON orders;

-- Create triggers
CREATE TRIGGER trigger_notify_order_confirmed_whatsapp
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_confirmed_whatsapp();

CREATE TRIGGER trigger_notify_order_ready_whatsapp
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_ready_whatsapp();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- To verify the triggers are working, check:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- AND trigger_name LIKE '%whatsapp%';
