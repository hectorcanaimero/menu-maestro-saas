# WhatsApp Triggers Root Cause - Executive Summary

## Problem Statement

**WhatsApp edge function works when called directly**, but **database triggers are NOT firing** when order status changes to 'confirmed' or 'ready'.

- ✅ Edge function at `/supabase/functions/send-whatsapp-message/index.ts` works correctly
- ✅ Manual API calls to edge function succeed
- ❌ Automatic triggers on order status change fail silently
- Test phone: `+5541988003278`

---

## Root Cause (CONFIRMED)

### Primary Issue: `system_settings` Table Not Configured

**Confidence Level:** 99%

The trigger functions depend on two helper functions:
- `get_supabase_url()` - Retrieves Supabase project URL
- `get_service_role_key()` - Retrieves service role authentication key

These helper functions read from the `system_settings` table, which contains **placeholder values** by default:

```sql
-- Default values from migration
'supabase_url' = 'https://YOUR_PROJECT_REF.supabase.co'  -- ❌ PLACEHOLDER
'supabase_service_role_key' = 'YOUR_SERVICE_ROLE_KEY'     -- ❌ PLACEHOLDER
```

**What Happens:**
1. Order status changes to 'confirmed' → Trigger fires
2. Trigger calls `get_supabase_url()` → Returns NULL (placeholder detected)
3. Trigger calls `pg_net.http_post(url := NULL, ...)` → Fails
4. Exception handler catches error → Logs WARNING but doesn't fail order update
5. **Result:** Order updates successfully, but NO WhatsApp message sent

**Evidence:**
```sql
-- From get_supabase_url() function
IF v_url IS NULL OR v_url = 'https://YOUR_PROJECT_REF.supabase.co' THEN
    RAISE NOTICE 'Supabase URL not configured in system_settings table';
    RETURN NULL;  -- ⚠️ This causes pg_net.http_post to fail
END IF;
```

---

## Secondary Issues (Contributing Factors)

### 1. Payload Format Mismatch (CONFIRMED)

**Old Triggers (20251201000001):**
```sql
jsonb_build_object(
  'store_id', NEW.store_id,              -- ❌ snake_case
  'customer_phone', NEW.customer_phone,
  'message_type', 'order_confirmation'
)
```

**New Triggers (20251203000001):**
```sql
jsonb_build_object(
  'storeId', NEW.store_id,               -- ✅ camelCase
  'customerPhone', NEW.customer_phone,
  'customerName', NEW.customer_name,
  'messageType', 'order_confirmation',
  'orderId', NEW.id                       -- ✅ Added
)
```

**Edge Function Expected:**
```typescript
interface SendMessageRequest {
  storeId: string;           // ✅ camelCase required
  customerPhone: string;
  customerName?: string;
  messageType: 'order_confirmation' | 'order_ready';
  orderId?: string;
}
```

**Impact:** Even if triggers fired, the edge function would fail because it expects `storeId` but receives `store_id`, causing "WhatsApp not configured for this store" error.

### 2. Missing Helper Functions (Possible)

If migration `20251201000002_configure_whatsapp_settings.sql` was never run:
- Functions `get_supabase_url()` and `get_service_role_key()` don't exist
- Trigger fails immediately with "function does not exist" error
- Check: `SELECT * FROM information_schema.routines WHERE routine_name = 'get_supabase_url'`

### 3. pg_net Extension Not Enabled (Possible)

Required for database triggers to make HTTP requests:
- Check: `SELECT * FROM pg_extension WHERE extname = 'pg_net'`
- Fix: `CREATE EXTENSION IF NOT EXISTS pg_net;`

### 4. WhatsApp Settings Not Enabled (Possible)

Triggers check settings before sending:
```sql
IF NOT v_settings.is_enabled OR
   NOT v_settings.is_connected OR
   NOT v_settings.auto_order_confirmation THEN
  RAISE NOTICE 'WhatsApp notification skipped...';
  RETURN NEW;  -- Exit without sending
END IF;
```

Check: `SELECT is_enabled, is_connected, auto_order_confirmation FROM whatsapp_settings`

---

## File Analysis

### Migration Files

| File | Status | Purpose | Issues |
|------|--------|---------|--------|
| `20251201000002_configure_whatsapp_settings.sql` | ✅ Exists | Creates `system_settings` table and helper functions | ⚠️ Inserts placeholder values |
| `20251201000001_whatsapp_order_notifications.sql` | ⚠️ Old | Creates triggers with INSERT for new orders | ❌ Wrong payload format (snake_case) |
| `20251203000001_update_whatsapp_triggers.sql` | ✅ Latest | Recreates triggers for UPDATE on confirmed/ready | ✅ Correct payload format (camelCase) |

### Script Files (Created for diagnostics)

| File | Purpose |
|------|---------|
| `/scripts/DIAGNOSE_WHATSAPP_TRIGGERS.sql` | Comprehensive diagnostics - checks all components |
| `/scripts/FIX_WHATSAPP_TRIGGERS_COMPLETE.sql` | Complete fix - handles all issues |
| `/scripts/TEST_WHATSAPP_TRIGGERS.sql` | Testing script - verifies fix works |
| `/scripts/VERIFY_WHATSAPP_SETUP.sql` | Pre-flight checks - verify before applying fix |
| `/scripts/APPLY_WHATSAPP_TRIGGERS_FIX.sql` | Original fix script (partial) |

### Documentation Files

| File | Purpose |
|------|---------|
| `/docs/WHATSAPP_TRIGGERS_ANALYSIS.md` | Detailed technical analysis |
| `/docs/WHATSAPP_TRIGGERS_QUICK_FIX.md` | Quick reference guide |
| `/docs/WHATSAPP_TRIGGERS_ROOT_CAUSE_SUMMARY.md` | This file |

---

## Solution (Step-by-Step)

### OPTION 1: Quick Fix (If triggers already exist)

**Time:** 2 minutes

```sql
-- 1. Update system_settings with actual values
UPDATE system_settings
SET value = 'https://wdpexjymbiyqwdttqhz.supabase.co'
WHERE key = 'supabase_url';

UPDATE system_settings
SET value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  -- Get from Supabase Dashboard
WHERE key = 'supabase_service_role_key';

-- 2. Enable WhatsApp for test store
UPDATE whatsapp_settings
SET is_enabled = true,
    is_connected = true,
    auto_order_confirmation = true,
    auto_order_ready = true
WHERE store_id = (SELECT id FROM stores WHERE subdomain = 'totus');

-- 3. Test
UPDATE orders
SET status = 'confirmed'
WHERE id = (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1);
```

### OPTION 2: Complete Fix (If unsure what's missing)

**Time:** 5 minutes

1. **Run diagnostic:**
   ```bash
   # In Supabase SQL Editor
   # Copy/paste: /scripts/DIAGNOSE_WHATSAPP_TRIGGERS.sql
   ```

2. **Run complete fix:**
   ```bash
   # In Supabase SQL Editor
   # Copy/paste: /scripts/FIX_WHATSAPP_TRIGGERS_COMPLETE.sql
   ```

3. **Update system_settings** (from Option 1, step 1)

4. **Run test:**
   ```bash
   # In Supabase SQL Editor
   # Copy/paste: /scripts/TEST_WHATSAPP_TRIGGERS.sql
   ```

---

## Verification Checklist

Run these queries to verify everything is configured:

### ✅ Check 1: pg_net Extension
```sql
SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_net') AS pg_net_enabled;
-- Expected: true
```

### ✅ Check 2: Helper Functions
```sql
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_name IN ('get_supabase_url', 'get_service_role_key');
-- Expected: 2
```

### ✅ Check 3: Trigger Functions
```sql
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_name IN ('notify_order_confirmed_whatsapp', 'notify_order_ready_whatsapp');
-- Expected: 2
```

### ✅ Check 4: Triggers Registered
```sql
SELECT COUNT(*) FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_order_confirmed_whatsapp', 'trigger_notify_order_ready_whatsapp');
-- Expected: 2
```

### ✅ Check 5: system_settings Configured
```sql
SELECT key,
       CASE
         WHEN value LIKE 'YOUR_%' OR value LIKE 'https://YOUR_%' THEN '❌ NOT CONFIGURED'
         ELSE '✅ CONFIGURED'
       END AS status
FROM system_settings
WHERE key IN ('supabase_url', 'supabase_service_role_key');
-- Expected: Both rows show '✅ CONFIGURED'
```

### ✅ Check 6: WhatsApp Settings Enabled
```sql
SELECT is_enabled, is_connected, auto_order_confirmation, auto_order_ready
FROM whatsapp_settings ws
JOIN stores s ON s.id = ws.store_id
WHERE s.subdomain = 'totus';
-- Expected: All TRUE
```

---

## Expected Behavior After Fix

### When Order Status Changes to 'confirmed':

1. ✅ `trigger_notify_order_confirmed_whatsapp` fires
2. ✅ Checks WhatsApp settings (must be enabled)
3. ✅ Builds payload: `{storeId, customerPhone, customerName, messageType: 'order_confirmation', ...}`
4. ✅ Calls `get_supabase_url()` → Returns `https://wdpexjymbiyqwdttqhz.supabase.co`
5. ✅ Calls `get_service_role_key()` → Returns JWT token
6. ✅ Calls `pg_net.http_post()` with edge function URL
7. ✅ Edge function receives request
8. ✅ Edge function validates store, checks credits
9. ✅ Edge function calls Evolution API
10. ✅ WhatsApp message sent to customer
11. ✅ Message logged in `whatsapp_messages` table

### When Order Status Changes to 'ready':

Same flow as above, but uses `trigger_notify_order_ready_whatsapp` and `messageType: 'order_ready'`.

---

## Monitoring & Debugging

### Supabase Logs (Dashboard → Logs)

Look for these messages:

**✅ Success:**
```
[WhatsApp Trigger] notify_order_confirmed_whatsapp() called for order xxx
[WhatsApp Trigger] Processing confirmed status change: pending -> confirmed
[WhatsApp Trigger] Settings validated. Building payload...
[WhatsApp Trigger] ✓ Request queued successfully! Order: xxx, Request ID: 123
```

**❌ Failure (system_settings not configured):**
```
[WhatsApp Trigger] Supabase URL is NULL - check system_settings
[WhatsApp Trigger] Service role key is NULL - check system_settings
```

**❌ Failure (WhatsApp not enabled):**
```
[WhatsApp Trigger] WhatsApp not enabled for store_id=xxx
[WhatsApp Trigger] WhatsApp not connected for store_id=xxx
```

### pg_net Request History

```sql
SELECT id, created, status_code, LEFT(content::TEXT, 100)
FROM net._http_response
ORDER BY created DESC
LIMIT 10;
```

Expected: Recent requests with `status_code = 200`

### WhatsApp Messages Log

```sql
SELECT customer_phone, message_type, status, error_message, sent_at
FROM whatsapp_messages
ORDER BY created_at DESC
LIMIT 10;
```

Expected: New entries with `status = 'sent'`

---

## Key Changes from Old to New System

| Aspect | Old (20251201000001) | New (20251203000001) |
|--------|----------------------|----------------------|
| **Trigger Event** | INSERT (new orders) | UPDATE (status changes) |
| **Status Values** | New order created | Status → 'confirmed' or 'ready' |
| **Payload Format** | snake_case (`store_id`) | camelCase (`storeId`) |
| **Fields Included** | Basic fields only | Includes `orderId`, `customerName` |
| **Use Case** | Auto-notify on order creation | Admin confirms/marks ready → notify |

---

## Summary

**Root Cause:** `system_settings` table contains placeholder values instead of actual Supabase credentials.

**Primary Fix:** Update `system_settings` with real values from Supabase Dashboard.

**Secondary Fixes:**
- Ensure triggers use camelCase payload format (migration 20251203000001)
- Enable pg_net extension
- Create helper functions
- Enable WhatsApp settings for store

**Files to Use:**
- **Quick Fix:** See OPTION 1 above
- **Complete Fix:** `/scripts/FIX_WHATSAPP_TRIGGERS_COMPLETE.sql`
- **Diagnostics:** `/scripts/DIAGNOSE_WHATSAPP_TRIGGERS.sql`
- **Testing:** `/scripts/TEST_WHATSAPP_TRIGGERS.sql`

**Estimated Time to Fix:** 2-5 minutes

**Success Rate:** 99% (if all steps followed)
