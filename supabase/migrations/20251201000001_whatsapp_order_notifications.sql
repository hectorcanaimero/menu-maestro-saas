-- Migration: WhatsApp Order Notifications
-- Description: Automatic WhatsApp notifications for new orders and order status changes
-- Created: 2025-12-01

-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- FUNCTION: Send WhatsApp notification for new order
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_new_order_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_response_id BIGINT;
  v_payload JSONB;
BEGIN
  -- Only process if this is a new order (INSERT)
  IF (TG_OP != 'INSERT') THEN
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
    RAISE NOTICE 'WhatsApp notification skipped for order %. Settings: enabled=%, connected=%, auto_confirm=%',
      NEW.id,
      COALESCE(v_settings.is_enabled::TEXT, 'null'),
      COALESCE(v_settings.is_connected::TEXT, 'null'),
      COALESCE(v_settings.auto_order_confirmation::TEXT, 'null');
    RETURN NEW;
  END IF;

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'store_id', NEW.store_id,
    'customer_phone', NEW.customer_phone,
    'message_type', 'order_confirmation',
    'variables', jsonb_build_object(
      'customer_name', NEW.customer_name,
      'order_number', SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
      'order_total', NEW.total_amount::TEXT,
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

  RAISE NOTICE 'WhatsApp notification queued for order %. Request ID: %', NEW.id, v_response_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order creation
    RAISE WARNING 'Error sending WhatsApp notification for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Send WhatsApp notification when order is ready
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_order_ready_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
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

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'store_id', NEW.store_id,
    'customer_phone', NEW.customer_phone,
    'message_type', 'order_ready',
    'variables', jsonb_build_object(
      'customer_name', NEW.customer_name,
      'order_number', SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
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
-- TRIGGER: Notify new order
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_notify_new_order_whatsapp ON orders;

CREATE TRIGGER trigger_notify_new_order_whatsapp
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order_whatsapp();

-- ============================================================================
-- TRIGGER: Notify order ready
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_notify_order_ready_whatsapp ON orders;

CREATE TRIGGER trigger_notify_order_ready_whatsapp
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_ready_whatsapp();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION notify_new_order_whatsapp() IS
'Sends WhatsApp notification when a new order is created. Checks if auto_order_confirmation is enabled.';

COMMENT ON FUNCTION notify_order_ready_whatsapp() IS
'Sends WhatsApp notification when order status changes to ready. Checks if auto_order_ready is enabled.';

COMMENT ON TRIGGER trigger_notify_new_order_whatsapp ON orders IS
'Triggers WhatsApp notification for new orders';

COMMENT ON TRIGGER trigger_notify_order_ready_whatsapp ON orders IS
'Triggers WhatsApp notification when order is ready';
