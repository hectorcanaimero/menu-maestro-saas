# WhatsApp Triggers - Quick Fix Guide

## TL;DR - The Issue

Triggers exist but **`system_settings` is not configured** with actual Supabase credentials.

## Quick Fix (2 minutes)

### Step 1: Run this in Supabase SQL Editor

```sql
-- Update Supabase URL
UPDATE system_settings
SET value = 'https://wdpexjymbiyqwdttqhz.supabase.co'
WHERE key = 'supabase_url';

-- Update Service Role Key (get from Supabase Dashboard → Settings → API)
UPDATE system_settings
SET value = 'YOUR_ACTUAL_SERVICE_ROLE_KEY'
WHERE key = 'supabase_service_role_key';

-- Verify
SELECT key,
       CASE
         WHEN key = 'supabase_service_role_key' THEN '***' || RIGHT(value, 4)
         ELSE value
       END as value
FROM system_settings;
```

### Step 2: Ensure WhatsApp is enabled

```sql
-- Enable WhatsApp automations for 'totus' store
UPDATE whatsapp_settings
SET is_enabled = true,
    is_connected = true,
    auto_order_confirmation = true,
    auto_order_ready = true
WHERE store_id = (SELECT id FROM stores WHERE subdomain = 'totus');

-- Verify
SELECT is_enabled, is_connected, auto_order_confirmation, auto_order_ready
FROM whatsapp_settings ws
JOIN stores s ON s.id = ws.store_id
WHERE s.subdomain = 'totus';
```

### Step 3: Test

```sql
-- Find a test order
SELECT id, status, customer_name, customer_phone
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE s.subdomain = 'totus'
ORDER BY created_at DESC
LIMIT 1;

-- Update status to trigger WhatsApp
UPDATE orders
SET status = 'confirmed'
WHERE id = 'YOUR_ORDER_ID_FROM_ABOVE';
```

### Step 4: Check Logs

Go to Supabase Dashboard → Logs → Look for:
- ✅ `[WhatsApp Trigger] ✓ Request queued successfully!`
- ✅ Edge function logs showing message sent

OR

- ❌ `[WhatsApp Trigger] ✗ Error...` (if still failing)

## If Quick Fix Doesn't Work

### Option A: Run Diagnostic

**File:** `/scripts/DIAGNOSE_WHATSAPP_TRIGGERS.sql`

This will tell you exactly what's wrong.

### Option B: Run Complete Fix

**File:** `/scripts/FIX_WHATSAPP_TRIGGERS_COMPLETE.sql`

This fixes everything:
- Enables pg_net extension
- Creates helper functions
- Creates trigger functions with logging
- Registers triggers
- Sets up system_settings

**Important:** After running, you still need to update `system_settings` (Step 1 above).

## Common Issues & Solutions

| Issue | Check | Fix |
|-------|-------|-----|
| No triggers firing | `SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%whatsapp%'` | Run `/scripts/FIX_WHATSAPP_TRIGGERS_COMPLETE.sql` |
| `system_settings` has placeholders | `SELECT * FROM system_settings` | Run Step 1 above with actual values |
| WhatsApp not enabled | `SELECT * FROM whatsapp_settings WHERE store_id = (SELECT id FROM stores WHERE subdomain = 'totus')` | Run Step 2 above |
| `pg_net` not installed | `SELECT * FROM pg_extension WHERE extname = 'pg_net'` | `CREATE EXTENSION pg_net;` |
| Helper functions missing | `SELECT * FROM information_schema.routines WHERE routine_name = 'get_supabase_url'` | Run `/scripts/FIX_WHATSAPP_TRIGGERS_COMPLETE.sql` |

## Expected Behavior

When you change order status to 'confirmed' or 'ready':

1. ✅ Trigger fires (`trigger_notify_order_confirmed_whatsapp` or `trigger_notify_order_ready_whatsapp`)
2. ✅ Trigger checks WhatsApp settings (must be enabled & connected)
3. ✅ Trigger builds payload with order details
4. ✅ Trigger calls `get_supabase_url()` and `get_service_role_key()`
5. ✅ Trigger queues HTTP request via `pg_net.http_post()`
6. ✅ Edge function receives request
7. ✅ Edge function sends WhatsApp message via Evolution API
8. ✅ Message logged in `whatsapp_messages` table

## Where to Get Service Role Key

1. Go to Supabase Dashboard
2. Click on your project
3. Settings → API
4. Under "Project API keys" → Copy "service_role" key
5. **IMPORTANT:** This is a secret key - never commit it to git or share publicly

## Test Phone Number

Test with: `+5541988003278` (from user's context)

## Files Reference

- **Diagnostic:** `/scripts/DIAGNOSE_WHATSAPP_TRIGGERS.sql`
- **Complete Fix:** `/scripts/FIX_WHATSAPP_TRIGGERS_COMPLETE.sql`
- **Test Script:** `/scripts/TEST_WHATSAPP_TRIGGERS.sql`
- **Analysis:** `/docs/WHATSAPP_TRIGGERS_ANALYSIS.md`
- **Migration:** `/supabase/migrations/20251203000001_update_whatsapp_triggers.sql`

## Need More Help?

Read the detailed analysis: `/docs/WHATSAPP_TRIGGERS_ANALYSIS.md`
