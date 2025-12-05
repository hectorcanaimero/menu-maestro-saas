-- ============================================================================
-- DIAGNOSTIC SCRIPT: WhatsApp Triggers Troubleshooting
-- Description: Comprehensive diagnostic to identify why triggers are not firing
-- Created: 2025-12-03
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if pg_net extension is enabled
-- ============================================================================
SELECT
  'pg_net Extension Status' AS check_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    THEN '✓ INSTALLED'
    ELSE '✗ NOT INSTALLED - RUN: CREATE EXTENSION pg_net;'
  END AS status;

-- ============================================================================
-- STEP 2: Check if helper functions exist
-- ============================================================================
SELECT
  'Helper Functions Status' AS check_name,
  routine_name,
  routine_type,
  '✓ EXISTS' AS status
FROM information_schema.routines
WHERE routine_name IN ('get_supabase_url', 'get_service_role_key')
  AND routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- STEP 3: Check if WhatsApp trigger functions exist
-- ============================================================================
SELECT
  'WhatsApp Trigger Functions' AS check_name,
  routine_name,
  routine_type,
  '✓ EXISTS' AS status
FROM information_schema.routines
WHERE routine_name IN (
  'notify_order_confirmed_whatsapp',
  'notify_order_ready_whatsapp',
  'notify_new_order_whatsapp'
)
  AND routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- STEP 4: Check if triggers are registered on orders table
-- ============================================================================
SELECT
  'Triggers on Orders Table' AS check_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement,
  '✓ EXISTS' AS status
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_name LIKE '%whatsapp%'
ORDER BY trigger_name;

-- ============================================================================
-- STEP 5: Check system_settings configuration
-- ============================================================================
SELECT
  'System Settings Configuration' AS check_name,
  key,
  CASE
    WHEN key = 'supabase_service_role_key' THEN '***' || RIGHT(value, 4)
    WHEN value LIKE 'YOUR_%' OR value LIKE 'https://YOUR_%' THEN '✗ NOT CONFIGURED - ' || value
    ELSE '✓ ' || value
  END AS value_status,
  description
FROM system_settings
WHERE key IN ('supabase_url', 'supabase_service_role_key')
ORDER BY key;

-- ============================================================================
-- STEP 6: Test helper functions (returns actual values)
-- ============================================================================
SELECT
  'Helper Function Test' AS check_name,
  'get_supabase_url()' AS function_name,
  get_supabase_url() AS result,
  CASE
    WHEN get_supabase_url() IS NULL THEN '✗ RETURNS NULL'
    WHEN get_supabase_url() LIKE 'https://YOUR_%' THEN '✗ NOT CONFIGURED'
    ELSE '✓ CONFIGURED'
  END AS status;

SELECT
  'Helper Function Test' AS check_name,
  'get_service_role_key()' AS function_name,
  CASE
    WHEN get_service_role_key() IS NULL THEN 'NULL'
    WHEN get_service_role_key() = 'YOUR_SERVICE_ROLE_KEY' THEN 'NOT CONFIGURED'
    ELSE '***' || RIGHT(get_service_role_key(), 4)
  END AS result,
  CASE
    WHEN get_service_role_key() IS NULL THEN '✗ RETURNS NULL'
    WHEN get_service_role_key() = 'YOUR_SERVICE_ROLE_KEY' THEN '✗ NOT CONFIGURED'
    ELSE '✓ CONFIGURED'
  END AS status;

-- ============================================================================
-- STEP 7: Check WhatsApp settings for test store
-- ============================================================================
SELECT
  'WhatsApp Settings for Stores' AS check_name,
  s.subdomain,
  s.name AS store_name,
  ws.is_enabled,
  ws.is_connected,
  ws.auto_order_confirmation,
  ws.auto_order_ready,
  CASE
    WHEN ws.is_enabled IS NULL THEN '✗ NO WHATSAPP SETTINGS'
    WHEN NOT ws.is_enabled THEN '✗ WHATSAPP DISABLED'
    WHEN NOT ws.is_connected THEN '✗ NOT CONNECTED'
    WHEN NOT ws.auto_order_confirmation AND NOT ws.auto_order_ready THEN '✗ NO AUTOMATIONS ENABLED'
    ELSE '✓ CONFIGURED'
  END AS status
FROM stores s
LEFT JOIN whatsapp_settings ws ON ws.store_id = s.id
WHERE s.subdomain = 'totus'  -- Change to your test store subdomain
ORDER BY s.name;

-- ============================================================================
-- STEP 8: Check recent orders for test store
-- ============================================================================
SELECT
  'Recent Orders (Test Store)' AS check_name,
  o.id,
  o.customer_name,
  o.customer_phone,
  o.status,
  o.created_at,
  o.updated_at
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE s.subdomain = 'totus'  -- Change to your test store subdomain
ORDER BY o.created_at DESC
LIMIT 5;

-- ============================================================================
-- STEP 9: Check pg_net request history (if available)
-- ============================================================================
-- Note: This might fail if net._http_response table doesn't exist or isn't accessible
SELECT
  'Recent pg_net Requests' AS check_name,
  id,
  created,
  status_code,
  content_type,
  LEFT(content::TEXT, 100) AS response_preview
FROM net._http_response
ORDER BY created DESC
LIMIT 10;

-- ============================================================================
-- STEP 10: Check for any database logs/notices
-- ============================================================================
-- Note: This query checks PostgreSQL logs if available
-- You may need to check Supabase logs UI for RAISE NOTICE messages

-- ============================================================================
-- SUMMARY OF REQUIRED FIXES
-- ============================================================================
SELECT
  'SUMMARY - Common Issues' AS issue_category,
  'Issue' AS problem,
  'Solution' AS fix_sql;

-- If pg_net is not installed:
SELECT
  'Extension' AS issue_category,
  'pg_net extension not installed' AS problem,
  'CREATE EXTENSION IF NOT EXISTS pg_net;' AS fix_sql;

-- If helper functions don't exist:
SELECT
  'Helper Functions' AS issue_category,
  'get_supabase_url() or get_service_role_key() missing' AS problem,
  'Run migration: 20251201000002_configure_whatsapp_settings.sql' AS fix_sql;

-- If system_settings not configured:
SELECT
  'Configuration' AS issue_category,
  'system_settings table has placeholder values' AS problem,
  E'UPDATE system_settings SET value = ''https://YOUR_PROJECT.supabase.co'' WHERE key = ''supabase_url'';\nUPDATE system_settings SET value = ''YOUR_SERVICE_ROLE_KEY'' WHERE key = ''supabase_service_role_key'';' AS fix_sql;

-- If trigger functions don't exist:
SELECT
  'Trigger Functions' AS issue_category,
  'notify_order_confirmed_whatsapp() or notify_order_ready_whatsapp() missing' AS problem,
  'Run migration: 20251203000001_update_whatsapp_triggers.sql' AS fix_sql;

-- If triggers don't exist on orders table:
SELECT
  'Triggers' AS issue_category,
  'Triggers not registered on orders table' AS problem,
  'Run migration: 20251203000001_update_whatsapp_triggers.sql' AS fix_sql;

-- If WhatsApp settings not enabled:
SELECT
  'WhatsApp Settings' AS issue_category,
  'WhatsApp module not enabled/connected for store' AS problem,
  E'-- Enable WhatsApp for store:\nUPDATE whatsapp_settings SET is_enabled = true, is_connected = true, auto_order_confirmation = true, auto_order_ready = true WHERE store_id = (SELECT id FROM stores WHERE subdomain = ''totus'');' AS fix_sql;

-- ============================================================================
-- MANUAL TEST: Simulate trigger firing
-- ============================================================================
-- Uncomment and run this to manually test if the trigger would fire
-- Replace 'YOUR_ORDER_ID' with an actual order ID from your database

/*
DO $$
DECLARE
  v_order_id UUID := 'YOUR_ORDER_ID'; -- Replace with actual order ID
BEGIN
  -- Simulate status change to 'confirmed'
  UPDATE orders
  SET status = 'confirmed'
  WHERE id = v_order_id;

  RAISE NOTICE 'Order updated to confirmed. Check logs for trigger execution.';
END $$;
*/

-- ============================================================================
-- END OF DIAGNOSTIC SCRIPT
-- ============================================================================
-- Next steps:
-- 1. Review the output of all queries above
-- 2. Identify which checks failed
-- 3. Apply the corresponding fix from the SUMMARY section
-- 4. Re-run this script to verify fixes
-- 5. Test by updating an order status to 'confirmed' or 'ready'
-- ============================================================================
