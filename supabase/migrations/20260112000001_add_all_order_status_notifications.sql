-- =====================================================
-- WhatsApp Order Status Notifications - Complete Set
-- Description: Add notifications for all order statuses
-- Created: 2026-01-12
-- =====================================================

-- ============================================================================
-- STEP 1: Add automation fields for new notification types
-- ============================================================================

ALTER TABLE public.whatsapp_settings
  ADD COLUMN IF NOT EXISTS auto_order_preparing BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_order_out_for_delivery BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_order_delivered BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_order_cancelled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.whatsapp_settings.auto_order_preparing IS
'Send WhatsApp notification when order status changes to preparing';

COMMENT ON COLUMN public.whatsapp_settings.auto_order_out_for_delivery IS
'Send WhatsApp notification when order status changes to out_for_delivery';

COMMENT ON COLUMN public.whatsapp_settings.auto_order_delivered IS
'Send WhatsApp notification when order status changes to delivered';

COMMENT ON COLUMN public.whatsapp_settings.auto_order_cancelled IS
'Send WhatsApp notification when order status changes to cancelled';

-- ============================================================================
-- STEP 2: Update message templates table to support new types
-- ============================================================================

-- Drop existing constraint
ALTER TABLE public.whatsapp_message_templates
  DROP CONSTRAINT IF EXISTS whatsapp_message_templates_template_type_check;

-- Add new constraint with all order statuses
ALTER TABLE public.whatsapp_message_templates
  ADD CONSTRAINT whatsapp_message_templates_template_type_check
  CHECK (template_type IN (
    'order_confirmation',
    'order_ready',
    'order_preparing',
    'order_out_for_delivery',
    'order_delivered',
    'order_cancelled',
    'abandoned_cart',
    'promotion'
  ));

-- ============================================================================
-- STEP 3: Update messages history table to support new types
-- ============================================================================

-- Drop existing constraint
ALTER TABLE public.whatsapp_messages
  DROP CONSTRAINT IF EXISTS whatsapp_messages_message_type_check;

-- Add new constraint with all types
ALTER TABLE public.whatsapp_messages
  ADD CONSTRAINT whatsapp_messages_message_type_check
  CHECK (message_type IN (
    'order_confirmation',
    'order_ready',
    'order_preparing',
    'order_out_for_delivery',
    'order_delivered',
    'order_cancelled',
    'abandoned_cart',
    'promotion',
    'campaign',
    'manual'
  ));

-- ============================================================================
-- STEP 4: Create notification functions for new statuses
-- ============================================================================

-- ---------------------------------------------------------------
-- Function: Send WhatsApp notification when order is PREPARING
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_order_preparing_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_response_id BIGINT;
  v_payload JSONB;
BEGIN
  -- Only process if status changed to 'preparing'
  IF (TG_OP != 'UPDATE') OR (NEW.status != 'preparing') OR (OLD.status = 'preparing') THEN
    RETURN NEW;
  END IF;

  -- Get WhatsApp settings for this store
  SELECT
    ws.id,
    ws.is_enabled,
    ws.is_connected,
    ws.auto_order_preparing
  INTO v_settings
  FROM whatsapp_settings ws
  WHERE ws.store_id = NEW.store_id;

  -- Check if WhatsApp module is enabled and automation is active
  IF NOT FOUND OR
     NOT v_settings.is_enabled OR
     NOT v_settings.is_connected OR
     NOT v_settings.auto_order_preparing THEN
    RAISE NOTICE 'WhatsApp preparing notification skipped for order %. Settings: enabled=%, connected=%, auto_preparing=%',
      NEW.id,
      COALESCE(v_settings.is_enabled::TEXT, 'null'),
      COALESCE(v_settings.is_connected::TEXT, 'null'),
      COALESCE(v_settings.auto_order_preparing::TEXT, 'null');
    RETURN NEW;
  END IF;

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'storeId', NEW.store_id,
    'customerPhone', NEW.customer_phone,
    'customerName', NEW.customer_name,
    'messageType', 'order_preparing',
    'orderId', NEW.id,
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

  RAISE NOTICE 'WhatsApp preparing notification queued for order %. Request ID: %', NEW.id, v_response_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order update
    RAISE WARNING 'Error sending WhatsApp preparing notification for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- Function: Send WhatsApp notification when order is OUT FOR DELIVERY
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_order_out_for_delivery_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_response_id BIGINT;
  v_payload JSONB;
BEGIN
  -- Only process if status changed to 'out_for_delivery'
  IF (TG_OP != 'UPDATE') OR (NEW.status != 'out_for_delivery') OR (OLD.status = 'out_for_delivery') THEN
    RETURN NEW;
  END IF;

  -- Get WhatsApp settings for this store
  SELECT
    ws.id,
    ws.is_enabled,
    ws.is_connected,
    ws.auto_order_out_for_delivery
  INTO v_settings
  FROM whatsapp_settings ws
  WHERE ws.store_id = NEW.store_id;

  -- Check if WhatsApp module is enabled and automation is active
  IF NOT FOUND OR
     NOT v_settings.is_enabled OR
     NOT v_settings.is_connected OR
     NOT v_settings.auto_order_out_for_delivery THEN
    RAISE NOTICE 'WhatsApp out_for_delivery notification skipped for order %. Settings: enabled=%, connected=%, auto_out_for_delivery=%',
      NEW.id,
      COALESCE(v_settings.is_enabled::TEXT, 'null'),
      COALESCE(v_settings.is_connected::TEXT, 'null'),
      COALESCE(v_settings.auto_order_out_for_delivery::TEXT, 'null');
    RETURN NEW;
  END IF;

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'storeId', NEW.store_id,
    'customerPhone', NEW.customer_phone,
    'customerName', NEW.customer_name,
    'messageType', 'order_out_for_delivery',
    'orderId', NEW.id,
    'variables', jsonb_build_object(
      'customer_name', NEW.customer_name,
      'order_number', SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
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

  RAISE NOTICE 'WhatsApp out_for_delivery notification queued for order %. Request ID: %', NEW.id, v_response_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order update
    RAISE WARNING 'Error sending WhatsApp out_for_delivery notification for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- Function: Send WhatsApp notification when order is DELIVERED
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_order_delivered_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_response_id BIGINT;
  v_payload JSONB;
BEGIN
  -- Only process if status changed to 'delivered'
  IF (TG_OP != 'UPDATE') OR (NEW.status != 'delivered') OR (OLD.status = 'delivered') THEN
    RETURN NEW;
  END IF;

  -- Get WhatsApp settings for this store
  SELECT
    ws.id,
    ws.is_enabled,
    ws.is_connected,
    ws.auto_order_delivered
  INTO v_settings
  FROM whatsapp_settings ws
  WHERE ws.store_id = NEW.store_id;

  -- Check if WhatsApp module is enabled and automation is active
  IF NOT FOUND OR
     NOT v_settings.is_enabled OR
     NOT v_settings.is_connected OR
     NOT v_settings.auto_order_delivered THEN
    RAISE NOTICE 'WhatsApp delivered notification skipped for order %. Settings: enabled=%, connected=%, auto_delivered=%',
      NEW.id,
      COALESCE(v_settings.is_enabled::TEXT, 'null'),
      COALESCE(v_settings.is_connected::TEXT, 'null'),
      COALESCE(v_settings.auto_order_delivered::TEXT, 'null');
    RETURN NEW;
  END IF;

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'storeId', NEW.store_id,
    'customerPhone', NEW.customer_phone,
    'customerName', NEW.customer_name,
    'messageType', 'order_delivered',
    'orderId', NEW.id,
    'variables', jsonb_build_object(
      'customer_name', NEW.customer_name,
      'order_number', SUBSTRING(NEW.id::TEXT FROM 1 FOR 8)
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

  RAISE NOTICE 'WhatsApp delivered notification queued for order %. Request ID: %', NEW.id, v_response_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order update
    RAISE WARNING 'Error sending WhatsApp delivered notification for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- Function: Send WhatsApp notification when order is CANCELLED
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_order_cancelled_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_response_id BIGINT;
  v_payload JSONB;
BEGIN
  -- Only process if status changed to 'cancelled'
  IF (TG_OP != 'UPDATE') OR (NEW.status != 'cancelled') OR (OLD.status = 'cancelled') THEN
    RETURN NEW;
  END IF;

  -- Get WhatsApp settings for this store
  SELECT
    ws.id,
    ws.is_enabled,
    ws.is_connected,
    ws.auto_order_cancelled
  INTO v_settings
  FROM whatsapp_settings ws
  WHERE ws.store_id = NEW.store_id;

  -- Check if WhatsApp module is enabled and automation is active
  IF NOT FOUND OR
     NOT v_settings.is_enabled OR
     NOT v_settings.is_connected OR
     NOT v_settings.auto_order_cancelled THEN
    RAISE NOTICE 'WhatsApp cancelled notification skipped for order %. Settings: enabled=%, connected=%, auto_cancelled=%',
      NEW.id,
      COALESCE(v_settings.is_enabled::TEXT, 'null'),
      COALESCE(v_settings.is_connected::TEXT, 'null'),
      COALESCE(v_settings.auto_order_cancelled::TEXT, 'null');
    RETURN NEW;
  END IF;

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'storeId', NEW.store_id,
    'customerPhone', NEW.customer_phone,
    'customerName', NEW.customer_name,
    'messageType', 'order_cancelled',
    'orderId', NEW.id,
    'variables', jsonb_build_object(
      'customer_name', NEW.customer_name,
      'order_number', SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
      'order_total', NEW.total_amount::TEXT
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

  RAISE NOTICE 'WhatsApp cancelled notification queued for order %. Request ID: %', NEW.id, v_response_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order update
    RAISE WARNING 'Error sending WhatsApp cancelled notification for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Create triggers for new statuses
-- ============================================================================

-- Trigger for order preparing
CREATE TRIGGER trigger_notify_order_preparing_whatsapp
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_preparing_whatsapp();

-- Trigger for order out for delivery
CREATE TRIGGER trigger_notify_order_out_for_delivery_whatsapp
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_out_for_delivery_whatsapp();

-- Trigger for order delivered
CREATE TRIGGER trigger_notify_order_delivered_whatsapp
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_delivered_whatsapp();

-- Trigger for order cancelled
CREATE TRIGGER trigger_notify_order_cancelled_whatsapp
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_cancelled_whatsapp();

-- ============================================================================
-- STEP 6: Insert default message templates for new types
-- ============================================================================

-- Helper function to insert default templates for existing stores
DO $$
DECLARE
  v_store RECORD;
BEGIN
  FOR v_store IN SELECT id FROM stores
  LOOP
    -- Order Preparing Template
    INSERT INTO whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
    VALUES (
      v_store.id,
      'order_preparing',
      'Pedido en Preparación',
      E'Hola {customer_name},\n\n✅ Tu pedido #{order_number} está siendo preparado.\n\nTe avisaremos cuando esté listo.\n\n¡Gracias por tu preferencia!',
      true
    )
    ON CONFLICT (store_id, template_type) DO UPDATE
    SET message_body = EXCLUDED.message_body,
        updated_at = now();

    -- Order Out for Delivery Template
    INSERT INTO whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
    VALUES (
      v_store.id,
      'order_out_for_delivery',
      'Pedido en Camino',
      E'Hola {customer_name},\n\n🚗 Tu pedido #{order_number} está en camino a:\n{delivery_address}\n\nPronto lo recibirás.\n\n¡Gracias por tu preferencia!',
      true
    )
    ON CONFLICT (store_id, template_type) DO UPDATE
    SET message_body = EXCLUDED.message_body,
        updated_at = now();

    -- Order Delivered Template
    INSERT INTO whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
    VALUES (
      v_store.id,
      'order_delivered',
      'Pedido Entregado',
      E'Hola {customer_name},\n\n🎉 Tu pedido #{order_number} ha sido entregado exitosamente.\n\nEsperamos que disfrutes tu pedido.\n\n¡Gracias por tu preferencia!',
      true
    )
    ON CONFLICT (store_id, template_type) DO UPDATE
    SET message_body = EXCLUDED.message_body,
        updated_at = now();

    -- Order Cancelled Template
    INSERT INTO whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
    VALUES (
      v_store.id,
      'order_cancelled',
      'Pedido Cancelado',
      E'Hola {customer_name},\n\nTu pedido #{order_number} ha sido cancelado.\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\nTotal del pedido: {order_total}',
      false
    )
    ON CONFLICT (store_id, template_type) DO UPDATE
    SET message_body = EXCLUDED.message_body,
        updated_at = now();
  END LOOP;
END $$;

-- ============================================================================
-- STEP 7: Update existing templates with corrected spelling and format
-- ============================================================================

DO $$
DECLARE
  v_store RECORD;
BEGIN
  FOR v_store IN SELECT id FROM stores
  LOOP
    -- Update Order Confirmation Template (corregir ortografía y formato)
    UPDATE whatsapp_message_templates
    SET message_body = E'Hola {customer_name},\n\n✅ CONFIRMADO\n\nTu pedido #{order_number} ha sido confirmado.\n\nTipo de pedido: {order_type}\nMonto total: {order_total}\n\nTe avisaremos cuando esté listo.\n\n¡Gracias por tu preferencia!',
        updated_at = now()
    WHERE store_id = v_store.id
      AND template_type = 'order_confirmation';

    -- Update Order Ready Template (corregir ortografía y formato)
    UPDATE whatsapp_message_templates
    SET message_body = E'Hola {customer_name},\n\n🎉 LISTO\n\nTu pedido #{order_number} está listo.\n\nPuedes pasar a recogerlo cuando gustes.\n\n¡Gracias por tu preferencia!',
        updated_at = now()
    WHERE store_id = v_store.id
      AND template_type = 'order_ready';
  END LOOP;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION notify_order_preparing_whatsapp() IS
'Sends WhatsApp notification when order status changes to preparing';

COMMENT ON FUNCTION notify_order_out_for_delivery_whatsapp() IS
'Sends WhatsApp notification when order status changes to out_for_delivery';

COMMENT ON FUNCTION notify_order_delivered_whatsapp() IS
'Sends WhatsApp notification when order status changes to delivered';

COMMENT ON FUNCTION notify_order_cancelled_whatsapp() IS
'Sends WhatsApp notification when order status changes to cancelled';

COMMENT ON TRIGGER trigger_notify_order_preparing_whatsapp ON orders IS
'Triggers WhatsApp notification when order is being prepared';

COMMENT ON TRIGGER trigger_notify_order_out_for_delivery_whatsapp ON orders IS
'Triggers WhatsApp notification when order is out for delivery';

COMMENT ON TRIGGER trigger_notify_order_delivered_whatsapp ON orders IS
'Triggers WhatsApp notification when order is delivered';

COMMENT ON TRIGGER trigger_notify_order_cancelled_whatsapp ON orders IS
'Triggers WhatsApp notification when order is cancelled';
