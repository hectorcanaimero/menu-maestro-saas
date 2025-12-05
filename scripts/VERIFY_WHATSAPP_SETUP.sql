-- ============================================================================
-- SCRIPT: Verify WhatsApp Setup
-- Description: Checks all WhatsApp configuration before testing
-- Run this in Supabase SQL Editor BEFORE applying triggers
-- ============================================================================

-- ============================================================================
-- 1. Check Evolution API Configuration (System Settings)
-- ============================================================================
SELECT
  key,
  CASE
    WHEN key = 'supabase_service_role_key' THEN '***HIDDEN***'
    ELSE value
  END as value,
  CASE
    WHEN key = 'supabase_url' AND value LIKE 'https://%' THEN '✅'
    WHEN key = 'supabase_service_role_key' AND LENGTH(value) > 50 THEN '✅'
    ELSE '❌ NEEDS CONFIGURATION'
  END as status
FROM system_settings
WHERE key IN ('supabase_url', 'supabase_service_role_key')
ORDER BY key;

-- ============================================================================
-- 2. Check WhatsApp Settings for Stores
-- ============================================================================
SELECT
  s.name as store_name,
  s.subdomain,
  ws.is_enabled,
  ws.is_connected,
  ws.connected_phone,
  ws.auto_order_confirmation,
  ws.auto_order_ready,
  CASE
    WHEN ws.is_enabled AND ws.is_connected THEN '✅ READY'
    WHEN ws.is_enabled AND NOT ws.is_connected THEN '⚠️ ENABLED BUT NOT CONNECTED'
    ELSE '❌ DISABLED'
  END as status
FROM stores s
LEFT JOIN whatsapp_settings ws ON ws.store_id = s.id
ORDER BY s.created_at DESC
LIMIT 10;

-- ============================================================================
-- 3. Check WhatsApp Credits
-- ============================================================================
SELECT
  s.name as store_name,
  wc.monthly_credits,
  wc.extra_credits,
  wc.credits_used_this_month,
  (wc.monthly_credits + wc.extra_credits - wc.credits_used_this_month) as available_credits,
  wc.last_reset_date,
  CASE
    WHEN (wc.monthly_credits + wc.extra_credits - wc.credits_used_this_month) > 0 THEN '✅ HAS CREDITS'
    ELSE '❌ NO CREDITS'
  END as status
FROM stores s
LEFT JOIN whatsapp_credits wc ON wc.store_id = s.id
ORDER BY s.created_at DESC
LIMIT 10;

-- ============================================================================
-- 4. Check Message Templates
-- ============================================================================
SELECT
  s.name as store_name,
  wmt.template_type,
  wmt.template_name,
  wmt.is_active,
  SUBSTRING(wmt.message_body FROM 1 FOR 50) || '...' as preview,
  CASE
    WHEN wmt.is_active THEN '✅ ACTIVE'
    ELSE '❌ INACTIVE'
  END as status
FROM stores s
JOIN whatsapp_message_templates wmt ON wmt.store_id = s.id
WHERE wmt.template_type IN ('order_confirmation', 'order_ready')
ORDER BY s.created_at DESC, wmt.template_type
LIMIT 20;

-- ============================================================================
-- 5. Check Existing Triggers
-- ============================================================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  CASE
    WHEN trigger_name IN ('trigger_notify_order_confirmed_whatsapp', 'trigger_notify_order_ready_whatsapp') THEN '✅ CORRECT TRIGGER'
    WHEN trigger_name = 'trigger_notify_new_order_whatsapp' THEN '⚠️ OLD TRIGGER (will be replaced)'
    ELSE '❓ OTHER TRIGGER'
  END as status
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_name LIKE '%whatsapp%'
ORDER BY trigger_name;

-- ============================================================================
-- 6. Check Recent Orders (for testing)
-- ============================================================================
SELECT
  o.id,
  SUBSTRING(o.id::TEXT FROM 1 FOR 8) as order_number,
  s.name as store_name,
  o.customer_name,
  o.customer_phone,
  o.status,
  o.created_at,
  CASE
    WHEN o.customer_phone IS NULL THEN '❌ NO PHONE'
    WHEN o.customer_phone LIKE '%5541988003278%' THEN '✅ TEST PHONE'
    ELSE '📞 ' || o.customer_phone
  END as phone_status
FROM orders o
JOIN stores s ON s.id = o.store_id
ORDER BY o.created_at DESC
LIMIT 10;

-- ============================================================================
-- 7. Check Recent WhatsApp Messages Sent
-- ============================================================================
SELECT
  wm.created_at,
  s.name as store_name,
  wm.customer_phone,
  wm.message_type,
  wm.status,
  wm.error_message,
  CASE
    WHEN wm.status = 'sent' THEN '✅ SENT'
    WHEN wm.status = 'failed' THEN '❌ FAILED'
    ELSE '⏳ ' || wm.status
  END as delivery_status
FROM whatsapp_messages wm
JOIN stores s ON s.id = wm.store_id
ORDER BY wm.created_at DESC
LIMIT 10;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WHATSAPP SETUP VERIFICATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:

1. ✅ Verify system_settings have real Supabase URL and Service Role Key
2. ✅ Verify Evolution API credentials in Edge Functions Secrets
3. ✅ Apply triggers script: /scripts/APPLY_WHATSAPP_TRIGGERS_FIX.sql
4. ✅ Enable WhatsApp for your test store (is_enabled = true)
5. ✅ Connect WhatsApp instance (Admin > WhatsApp > Connect)
6. ✅ Create test order with phone: +5541988003278

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as instructions;
