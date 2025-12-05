-- ============================================================================
-- COMPLETE FIX: WhatsApp Triggers Not Firing
-- Description: Comprehensive fix for all potential issues
-- Run this in Supabase SQL Editor
-- Created: 2025-12-03
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable pg_net extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- STEP 2: Create/Update system_settings table
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can manage system settings" ON system_settings;

-- Only service role can read/write system settings
CREATE POLICY "Service role can manage system settings"
  ON system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 3: Insert/Update system_settings (CRITICAL - UPDATE THESE VALUES!)
-- ============================================================================

-- Insert or update Supabase URL
INSERT INTO system_settings (key, value, description)
VALUES (
  'supabase_url',
  'https://YOUR_PROJECT_REF.supabase.co',  -- ⚠️ REPLACE THIS!
  'Supabase project URL for pg_net HTTP calls'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Insert or update Service Role Key
INSERT INTO system_settings (key, value, description)
VALUES (
  'supabase_service_role_key',
  'YOUR_SERVICE_ROLE_KEY',  -- ⚠️ REPLACE THIS!
  'Supabase service role key for authenticated API calls'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- ⚠️ IMPORTANT: Update the values above before continuing!
-- ============================================================================
-- Run these commands to configure (replace with your actual values):
--
-- UPDATE system_settings
-- SET value = 'https://wdpexjymbiyqwdttqhz.supabase.co'
-- WHERE key = 'supabase_url';
--
-- UPDATE system_settings
-- SET value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
-- WHERE key = 'supabase_service_role_key';
--
-- Verify:
-- SELECT key, value FROM system_settings;
-- ============================================================================

-- ============================================================================
-- STEP 4: Create helper functions
-- ============================================================================

-- Helper function to get Supabase URL
CREATE OR REPLACE FUNCTION get_supabase_url()
RETURNS TEXT AS $$
DECLARE
  v_url TEXT;
BEGIN
  SELECT value INTO v_url
  FROM system_settings
  WHERE key = 'supabase_url'
  LIMIT 1;

  IF v_url IS NULL OR v_url = 'https://YOUR_PROJECT_REF.supabase.co' THEN
    RAISE WARNING 'Supabase URL not configured in system_settings table. Please update system_settings.';
    RETURN NULL;
  END IF;

  RETURN v_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get service role key
CREATE OR REPLACE FUNCTION get_service_role_key()
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
BEGIN
  SELECT value INTO v_key
  FROM system_settings
  WHERE key = 'supabase_service_role_key'
  LIMIT 1;

  IF v_key IS NULL OR v_key = 'YOUR_SERVICE_ROLE_KEY' THEN
    RAISE WARNING 'Service role key not configured in system_settings table. Please update system_settings.';
    RETURN NULL;
  END IF;

  RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Grant permissions for pg_net
-- ============================================================================

GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- STEP 6: Create trigger functions with enhanced logging
-- ============================================================================

-- Function: Send WhatsApp notification when order is CONFIRMED
CREATE OR REPLACE FUNCTION notify_order_confirmed_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_response_id BIGINT;
  v_payload JSONB;
  v_url TEXT;
  v_key TEXT;
BEGIN
  RAISE NOTICE '[WhatsApp Trigger] notify_order_confirmed_whatsapp() called for order %', NEW.id;

  -- Only process if status changed to 'confirmed'
  IF (TG_OP != 'UPDATE') THEN
    RAISE NOTICE '[WhatsApp Trigger] Skipped: Not an UPDATE operation (TG_OP=%)', TG_OP;
    RETURN NEW;
  END IF;

  IF (NEW.status != 'confirmed') THEN
    RAISE NOTICE '[WhatsApp Trigger] Skipped: Status is not confirmed (status=%)', NEW.status;
    RETURN NEW;
  END IF;

  IF (OLD.status = 'confirmed') THEN
    RAISE NOTICE '[WhatsApp Trigger] Skipped: Status was already confirmed';
    RETURN NEW;
  END IF;

  RAISE NOTICE '[WhatsApp Trigger] Processing confirmed status change: % -> %', OLD.status, NEW.status;

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
  IF NOT FOUND THEN
    RAISE NOTICE '[WhatsApp Trigger] No WhatsApp settings found for store_id=%', NEW.store_id;
    RETURN NEW;
  END IF;

  IF NOT v_settings.is_enabled THEN
    RAISE NOTICE '[WhatsApp Trigger] WhatsApp not enabled for store_id=%', NEW.store_id;
    RETURN NEW;
  END IF;

  IF NOT v_settings.is_connected THEN
    RAISE NOTICE '[WhatsApp Trigger] WhatsApp not connected for store_id=%', NEW.store_id;
    RETURN NEW;
  END IF;

  IF NOT v_settings.auto_order_confirmation THEN
    RAISE NOTICE '[WhatsApp Trigger] Auto order confirmation not enabled for store_id=%', NEW.store_id;
    RETURN NEW;
  END IF;

  RAISE NOTICE '[WhatsApp Trigger] Settings validated. Building payload...';

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'storeId', NEW.store_id,
    'customerPhone', NEW.customer_phone,
    'customerName', NEW.customer_name,
    'messageType', 'order_confirmation',
    'orderId', NEW.id,
    'variables', jsonb_build_object(
      'customer_name', NEW.customer_name,
      'order_number', SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
      'order_total', NEW.total_amount::TEXT,
      'order_type', COALESCE(NEW.order_type, 'pickup'),
      'delivery_address', COALESCE(NEW.delivery_address, '')
    )
  );

  RAISE NOTICE '[WhatsApp Trigger] Payload built: %', v_payload::TEXT;

  -- Get configuration
  v_url := get_supabase_url();
  v_key := get_service_role_key();

  IF v_url IS NULL THEN
    RAISE WARNING '[WhatsApp Trigger] Supabase URL is NULL - check system_settings';
    RETURN NEW;
  END IF;

  IF v_key IS NULL THEN
    RAISE WARNING '[WhatsApp Trigger] Service role key is NULL - check system_settings';
    RETURN NEW;
  END IF;

  RAISE NOTICE '[WhatsApp Trigger] Calling edge function at: %', v_url || '/functions/v1/send-whatsapp-message';

  -- Call edge function asynchronously using pg_net
  SELECT net.http_post(
    url := v_url || '/functions/v1/send-whatsapp-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := v_payload
  ) INTO v_response_id;

  RAISE NOTICE '[WhatsApp Trigger] ✓ Request queued successfully! Order: %, Request ID: %', NEW.id, v_response_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order update
    RAISE WARNING '[WhatsApp Trigger] ✗ Error sending notification for order %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Send WhatsApp notification when order is READY
CREATE OR REPLACE FUNCTION notify_order_ready_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_response_id BIGINT;
  v_payload JSONB;
  v_url TEXT;
  v_key TEXT;
BEGIN
  RAISE NOTICE '[WhatsApp Trigger] notify_order_ready_whatsapp() called for order %', NEW.id;

  -- Only process if status changed to 'ready'
  IF (TG_OP != 'UPDATE') THEN
    RAISE NOTICE '[WhatsApp Trigger] Skipped: Not an UPDATE operation (TG_OP=%)', TG_OP;
    RETURN NEW;
  END IF;

  IF (NEW.status != 'ready') THEN
    RAISE NOTICE '[WhatsApp Trigger] Skipped: Status is not ready (status=%)', NEW.status;
    RETURN NEW;
  END IF;

  IF (OLD.status = 'ready') THEN
    RAISE NOTICE '[WhatsApp Trigger] Skipped: Status was already ready';
    RETURN NEW;
  END IF;

  RAISE NOTICE '[WhatsApp Trigger] Processing ready status change: % -> %', OLD.status, NEW.status;

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
  IF NOT FOUND THEN
    RAISE NOTICE '[WhatsApp Trigger] No WhatsApp settings found for store_id=%', NEW.store_id;
    RETURN NEW;
  END IF;

  IF NOT v_settings.is_enabled THEN
    RAISE NOTICE '[WhatsApp Trigger] WhatsApp not enabled for store_id=%', NEW.store_id;
    RETURN NEW;
  END IF;

  IF NOT v_settings.is_connected THEN
    RAISE NOTICE '[WhatsApp Trigger] WhatsApp not connected for store_id=%', NEW.store_id;
    RETURN NEW;
  END IF;

  IF NOT v_settings.auto_order_ready THEN
    RAISE NOTICE '[WhatsApp Trigger] Auto order ready not enabled for store_id=%', NEW.store_id;
    RETURN NEW;
  END IF;

  RAISE NOTICE '[WhatsApp Trigger] Settings validated. Building payload...';

  -- Build payload for edge function
  v_payload := jsonb_build_object(
    'storeId', NEW.store_id,
    'customerPhone', NEW.customer_phone,
    'customerName', NEW.customer_name,
    'messageType', 'order_ready',
    'orderId', NEW.id,
    'variables', jsonb_build_object(
      'customer_name', NEW.customer_name,
      'order_number', SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
      'order_type', COALESCE(NEW.order_type, 'pickup')
    )
  );

  RAISE NOTICE '[WhatsApp Trigger] Payload built: %', v_payload::TEXT;

  -- Get configuration
  v_url := get_supabase_url();
  v_key := get_service_role_key();

  IF v_url IS NULL THEN
    RAISE WARNING '[WhatsApp Trigger] Supabase URL is NULL - check system_settings';
    RETURN NEW;
  END IF;

  IF v_key IS NULL THEN
    RAISE WARNING '[WhatsApp Trigger] Service role key is NULL - check system_settings';
    RETURN NEW;
  END IF;

  RAISE NOTICE '[WhatsApp Trigger] Calling edge function at: %', v_url || '/functions/v1/send-whatsapp-message';

  -- Call edge function asynchronously using pg_net
  SELECT net.http_post(
    url := v_url || '/functions/v1/send-whatsapp-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := v_payload
  ) INTO v_response_id;

  RAISE NOTICE '[WhatsApp Trigger] ✓ Request queued successfully! Order: %, Request ID: %', NEW.id, v_response_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order update
    RAISE WARNING '[WhatsApp Trigger] ✗ Error sending notification for order %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Drop old triggers and functions
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_notify_new_order_whatsapp ON orders;
DROP TRIGGER IF EXISTS trigger_notify_order_confirmed_whatsapp ON orders;
DROP TRIGGER IF EXISTS trigger_notify_order_ready_whatsapp ON orders;

DROP FUNCTION IF EXISTS notify_new_order_whatsapp();

-- ============================================================================
-- STEP 8: Create new triggers
-- ============================================================================

-- Trigger for order confirmation (status changes to 'confirmed')
CREATE TRIGGER trigger_notify_order_confirmed_whatsapp
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_confirmed_whatsapp();

-- Trigger for order ready (status changes to 'ready')
CREATE TRIGGER trigger_notify_order_ready_whatsapp
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_ready_whatsapp();

-- ============================================================================
-- STEP 9: Add comments
-- ============================================================================

COMMENT ON FUNCTION notify_order_confirmed_whatsapp() IS
'Sends WhatsApp notification when order status changes to confirmed. Checks if auto_order_confirmation is enabled.';

COMMENT ON FUNCTION notify_order_ready_whatsapp() IS
'Sends WhatsApp notification when order status changes to ready. Checks if auto_order_ready is enabled.';

COMMENT ON TRIGGER trigger_notify_order_confirmed_whatsapp ON orders IS
'Triggers WhatsApp notification when order is confirmed';

COMMENT ON TRIGGER trigger_notify_order_ready_whatsapp ON orders IS
'Triggers WhatsApp notification when order is ready';

-- ============================================================================
-- STEP 10: Verification queries
-- ============================================================================

-- Verify triggers were created
SELECT
  'Triggers Created' AS verification_step,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_notify_order_confirmed_whatsapp',
  'trigger_notify_order_ready_whatsapp'
)
ORDER BY trigger_name;

-- Verify functions exist
SELECT
  'Functions Created' AS verification_step,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'notify_order_confirmed_whatsapp',
  'notify_order_ready_whatsapp',
  'get_supabase_url',
  'get_service_role_key'
)
ORDER BY routine_name;

-- Check system_settings
SELECT
  'System Settings' AS verification_step,
  key,
  CASE
    WHEN key = 'supabase_service_role_key' THEN '***' || RIGHT(value, 4)
    ELSE value
  END AS value_display,
  CASE
    WHEN value LIKE 'YOUR_%' OR value LIKE 'https://YOUR_%' THEN '⚠️ NOT CONFIGURED'
    ELSE '✓ CONFIGURED'
  END AS status
FROM system_settings
WHERE key IN ('supabase_url', 'supabase_service_role_key')
ORDER BY key;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Update system_settings with your actual Supabase URL and service role key
-- 2. Ensure WhatsApp settings are enabled for your store
-- 3. Test by updating an order status to 'confirmed' or 'ready'
-- 4. Check Supabase logs for RAISE NOTICE messages
-- ============================================================================
