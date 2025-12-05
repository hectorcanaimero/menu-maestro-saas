-- ============================================================================
-- TEST SCRIPT: WhatsApp Triggers
-- Description: Test if triggers fire correctly when order status changes
-- Run this AFTER running FIX_WHATSAPP_TRIGGERS_COMPLETE.sql
-- Created: 2025-12-03
-- ============================================================================

-- ============================================================================
-- PREREQUISITES CHECK
-- ============================================================================

-- 1. Check if all required components exist
SELECT
  'Prerequisites Check' AS test_name,
  EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_net') AS pg_net_installed,
  EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_supabase_url') AS helper_url_exists,
  EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_service_role_key') AS helper_key_exists,
  EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'notify_order_confirmed_whatsapp') AS confirmed_func_exists,
  EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'notify_order_ready_whatsapp') AS ready_func_exists,
  EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_order_confirmed_whatsapp') AS confirmed_trigger_exists,
  EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_order_ready_whatsapp') AS ready_trigger_exists;

-- 2. Check system_settings configuration
SELECT
  'System Settings Check' AS test_name,
  key,
  CASE
    WHEN key = 'supabase_service_role_key' THEN
      CASE
        WHEN value = 'YOUR_SERVICE_ROLE_KEY' THEN '✗ NOT CONFIGURED'
        ELSE '✓ CONFIGURED (***' || RIGHT(value, 4) || ')'
      END
    WHEN key = 'supabase_url' THEN
      CASE
        WHEN value LIKE 'https://YOUR_%' THEN '✗ NOT CONFIGURED'
        ELSE '✓ CONFIGURED (' || value || ')'
      END
    ELSE value
  END AS configuration_status
FROM system_settings
WHERE key IN ('supabase_url', 'supabase_service_role_key')
ORDER BY key;

-- ============================================================================
-- TEST 1: Find a test order (or create one)
-- ============================================================================

-- Find recent orders from 'totus' store
SELECT
  'Test Order Selection' AS test_name,
  o.id,
  o.customer_name,
  o.customer_phone,
  o.status,
  o.created_at,
  s.subdomain AS store_subdomain
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE s.subdomain = 'totus'
  AND o.status IN ('pending', 'confirmed', 'preparing')
ORDER BY o.created_at DESC
LIMIT 5;

-- ============================================================================
-- TEST 2: Check WhatsApp settings for the store
-- ============================================================================

SELECT
  'WhatsApp Settings Check' AS test_name,
  s.subdomain,
  s.name AS store_name,
  ws.is_enabled,
  ws.is_connected,
  ws.auto_order_confirmation,
  ws.auto_order_ready,
  CASE
    WHEN ws.id IS NULL THEN '✗ NO SETTINGS - Run: INSERT INTO whatsapp_settings (store_id, is_enabled, is_connected, auto_order_confirmation, auto_order_ready) VALUES ((SELECT id FROM stores WHERE subdomain = ''totus''), true, true, true, true);'
    WHEN NOT ws.is_enabled THEN '✗ DISABLED - Run: UPDATE whatsapp_settings SET is_enabled = true WHERE store_id = (SELECT id FROM stores WHERE subdomain = ''totus'');'
    WHEN NOT ws.is_connected THEN '✗ NOT CONNECTED - Connect via admin panel first'
    WHEN NOT ws.auto_order_confirmation AND NOT ws.auto_order_ready THEN '✗ NO AUTOMATIONS - Run: UPDATE whatsapp_settings SET auto_order_confirmation = true, auto_order_ready = true WHERE store_id = (SELECT id FROM stores WHERE subdomain = ''totus'');'
    ELSE '✓ CONFIGURED'
  END AS status_message
FROM stores s
LEFT JOIN whatsapp_settings ws ON ws.store_id = s.id
WHERE s.subdomain = 'totus';

-- ============================================================================
-- TEST 3: Manual trigger test (INTERACTIVE - Uncomment to run)
-- ============================================================================

-- IMPORTANT: Replace 'YOUR_ORDER_ID' with an actual order ID from TEST 1 above
-- This will update the order status and trigger the WhatsApp notification

/*
DO $$
DECLARE
  v_order_id UUID := 'YOUR_ORDER_ID'; -- ⚠️ REPLACE THIS
  v_old_status TEXT;
  v_new_status TEXT := 'confirmed'; -- Change to 'ready' to test ready notification
BEGIN
  -- Get current status
  SELECT status INTO v_old_status FROM orders WHERE id = v_order_id;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST: Updating order % from % to %', v_order_id, v_old_status, v_new_status;
  RAISE NOTICE '============================================';

  -- Update order status (this should trigger the WhatsApp notification)
  UPDATE orders
  SET status = v_new_status,
      updated_at = NOW()
  WHERE id = v_order_id;

  RAISE NOTICE 'Order updated successfully!';
  RAISE NOTICE 'Check the logs above for [WhatsApp Trigger] messages';
  RAISE NOTICE '============================================';

  -- Revert status after test (optional)
  -- UPDATE orders SET status = v_old_status WHERE id = v_order_id;
END $$;
*/

-- ============================================================================
-- TEST 4: Check pg_net request history
-- ============================================================================

-- Check recent HTTP requests made by pg_net
-- This shows if the trigger successfully queued the HTTP request
SELECT
  'Recent pg_net Requests' AS test_name,
  id AS request_id,
  created AS request_time,
  status_code,
  content_type,
  LEFT(content::TEXT, 200) AS response_preview
FROM net._http_response
ORDER BY created DESC
LIMIT 10;

-- ============================================================================
-- TEST 5: Check WhatsApp messages log
-- ============================================================================

-- Check if any WhatsApp messages were logged
SELECT
  'WhatsApp Messages Log' AS test_name,
  wm.id,
  wm.customer_phone,
  wm.customer_name,
  wm.message_type,
  wm.status,
  wm.error_message,
  wm.sent_at,
  wm.created_at
FROM whatsapp_messages wm
JOIN stores s ON s.id = wm.store_id
WHERE s.subdomain = 'totus'
ORDER BY wm.created_at DESC
LIMIT 10;

-- ============================================================================
-- QUICK FIX: Enable WhatsApp for 'totus' store (if needed)
-- ============================================================================

-- Uncomment and run this if WhatsApp settings don't exist or are disabled

/*
-- Create or update WhatsApp settings for totus store
INSERT INTO whatsapp_settings (
  store_id,
  is_enabled,
  is_connected,
  auto_order_confirmation,
  auto_order_ready,
  instance_name
)
SELECT
  id,
  true,
  true,
  true,
  true,
  'totus'
FROM stores
WHERE subdomain = 'totus'
ON CONFLICT (store_id) DO UPDATE
SET
  is_enabled = true,
  is_connected = true,
  auto_order_confirmation = true,
  auto_order_ready = true,
  updated_at = NOW();
*/

-- ============================================================================
-- DEBUGGING: View trigger definition
-- ============================================================================

-- View the actual trigger function code
SELECT
  'Trigger Function Code' AS info,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'notify_order_confirmed_whatsapp'
  AND n.nspname = 'public';

-- ============================================================================
-- END OF TEST SCRIPT
-- ============================================================================
-- EXPECTED RESULTS:
-- 1. All prerequisites should show TRUE/CONFIGURED
-- 2. WhatsApp settings should show CONFIGURED
-- 3. When you run TEST 3, you should see [WhatsApp Trigger] NOTICE messages
-- 4. pg_net should show a recent request with status_code 200
-- 5. whatsapp_messages table should have a new entry with status 'sent'
-- ============================================================================
