# WhatsApp Triggers Analysis - Root Cause & Fix

## Problem Summary

WhatsApp edge function works when called directly, but database triggers are NOT firing when order status changes to 'confirmed' or 'ready'.

## Root Cause Analysis

After analyzing the codebase, I've identified **5 potential root causes** why triggers might not be firing:

### 1. **CRITICAL: system_settings Not Configured** (Most Likely)

**Issue:** The helper functions `get_supabase_url()` and `get_service_role_key()` depend on the `system_settings` table having the correct Supabase URL and service role key. If these contain placeholder values, the triggers will fail silently.

**Location:** `/supabase/migrations/20251201000002_configure_whatsapp_settings.sql`

**Default Values:**
```sql
INSERT INTO system_settings (key, value, description) VALUES
  ('supabase_url', 'https://YOUR_PROJECT_REF.supabase.co', ...),
  ('supabase_service_role_key', 'YOUR_SERVICE_ROLE_KEY', ...);
```

**How it fails:**
- Trigger fires → Calls `get_supabase_url()` → Returns NULL or placeholder
- `pg_net.http_post()` fails with invalid URL
- Error is caught by EXCEPTION handler → Fails silently with RAISE WARNING
- Order update succeeds, but no WhatsApp message sent

**Evidence:**
```sql
-- From helper function:
IF v_url IS NULL OR v_url = 'https://YOUR_PROJECT_REF.supabase.co' THEN
    RAISE NOTICE 'Supabase URL not configured in system_settings table';
    RETURN NULL;
END IF;
```

### 2. **pg_net Extension Not Enabled**

**Issue:** The `pg_net` extension is required for making HTTP requests from database triggers. If not enabled, `net.http_post()` will fail.

**How to check:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**Fix:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 3. **Helper Functions Missing**

**Issue:** If migration `20251201000002_configure_whatsapp_settings.sql` wasn't run, the helper functions won't exist.

**Required Functions:**
- `get_supabase_url()` - Returns Supabase project URL
- `get_service_role_key()` - Returns service role key for authentication

**How it fails:**
- Trigger tries to call `get_supabase_url()` → Function doesn't exist
- PostgreSQL error: "function get_supabase_url() does not exist"
- EXCEPTION handler catches error → Fails silently

### 4. **WhatsApp Settings Not Enabled**

**Issue:** Even if triggers exist, they check WhatsApp settings before sending. If any of these are false, the trigger exits early:
- `is_enabled` - WhatsApp module enabled
- `is_connected` - Evolution API connected
- `auto_order_confirmation` - Auto-send confirmation messages
- `auto_order_ready` - Auto-send ready messages

**Code:**
```sql
IF NOT FOUND OR
   NOT v_settings.is_enabled OR
   NOT v_settings.is_connected OR
   NOT v_settings.auto_order_confirmation THEN
  RAISE NOTICE 'WhatsApp notification skipped...';
  RETURN NEW;
END IF;
```

### 5. **Payload Format Mismatch**

**Issue:** The trigger payload format MUST match what the edge function expects.

**Old Migration (20251201000001):**
```sql
v_payload := jsonb_build_object(
  'store_id', NEW.store_id,              -- ❌ snake_case
  'customer_phone', NEW.customer_phone,
  'message_type', 'order_confirmation',
  'variables', ...
);
```

**New Fix (APPLY_WHATSAPP_TRIGGERS_FIX.sql & 20251203000001):**
```sql
v_payload := jsonb_build_object(
  'storeId', NEW.store_id,               -- ✅ camelCase
  'customerPhone', NEW.customer_phone,
  'customerName', NEW.customer_name,
  'messageType', 'order_confirmation',
  'orderId', NEW.id,
  'variables', ...
);
```

**Edge Function Expected Format:**
```typescript
interface SendMessageRequest {
  storeId: string;           // ✅ camelCase
  customerPhone: string;
  customerName?: string;
  messageType: 'order_confirmation' | 'order_ready' | ...;
  orderId?: string;
  variables?: { ... };
}
```

**Impact:** Old triggers sent `store_id` (snake_case), but edge function expects `storeId` (camelCase). This causes the edge function to fail with "WhatsApp not configured for this store" because it can't find the store.

## File Comparison

### Old Triggers (20251201000001_whatsapp_order_notifications.sql)
- ❌ Trigger on INSERT for new orders (`notify_new_order_whatsapp`)
- ✅ Trigger on UPDATE for ready status (`notify_order_ready_whatsapp`)
- ❌ Uses snake_case in payload (`store_id`, `customer_phone`, `message_type`)
- ❌ Missing `orderId` and `customerName` in payload

### New Triggers (20251203000001_update_whatsapp_triggers.sql)
- ✅ Trigger on UPDATE for confirmed status (`notify_order_confirmed_whatsapp`)
- ✅ Trigger on UPDATE for ready status (`notify_order_ready_whatsapp`)
- ✅ Uses camelCase in payload (`storeId`, `customerPhone`, `messageType`)
- ✅ Includes `orderId` and `customerName` in payload
- ❌ Removed INSERT trigger (no more new order notifications)

### Migration File (20251203000001_update_whatsapp_triggers.sql)
**Status:** ✅ Already created in migrations folder

**Key Changes:**
1. Drops old INSERT trigger (`trigger_notify_new_order_whatsapp`)
2. Recreates UPDATE triggers with fixed payload format
3. Uses camelCase keys matching edge function interface

## Verification Steps

### Step 1: Check if triggers exist
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_name LIKE '%whatsapp%';
```

**Expected Output:**
- `trigger_notify_order_confirmed_whatsapp` - AFTER UPDATE
- `trigger_notify_order_ready_whatsapp` - AFTER UPDATE

### Step 2: Check if functions exist
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN (
  'notify_order_confirmed_whatsapp',
  'notify_order_ready_whatsapp',
  'get_supabase_url',
  'get_service_role_key'
);
```

**Expected Output:** All 4 functions should exist

### Step 3: Check system_settings
```sql
SELECT key, value FROM system_settings
WHERE key IN ('supabase_url', 'supabase_service_role_key');
```

**Expected Output:**
- `supabase_url` should be `https://wdpexjymbiyqwdttqhz.supabase.co` (actual URL, not placeholder)
- `supabase_service_role_key` should be actual JWT token (not 'YOUR_SERVICE_ROLE_KEY')

### Step 4: Check WhatsApp settings
```sql
SELECT is_enabled, is_connected, auto_order_confirmation, auto_order_ready
FROM whatsapp_settings ws
JOIN stores s ON s.id = ws.store_id
WHERE s.subdomain = 'totus';
```

**Expected Output:**
- `is_enabled`: true
- `is_connected`: true
- `auto_order_confirmation`: true
- `auto_order_ready`: true

### Step 5: Test trigger manually
```sql
-- Replace with actual order ID
UPDATE orders
SET status = 'confirmed'
WHERE id = 'YOUR_ORDER_ID';
```

Check Supabase logs for `[WhatsApp Trigger]` NOTICE messages.

## Fix Implementation

### Option 1: Run Complete Fix (Recommended)

Run the comprehensive fix script that handles all potential issues:

**File:** `/scripts/FIX_WHATSAPP_TRIGGERS_COMPLETE.sql`

**What it does:**
1. ✅ Enables `pg_net` extension
2. ✅ Creates `system_settings` table with RLS policies
3. ✅ Creates helper functions (`get_supabase_url`, `get_service_role_key`)
4. ✅ Creates trigger functions with enhanced logging
5. ✅ Drops old triggers and creates new ones
6. ✅ Provides verification queries

**IMPORTANT:** After running, you MUST update system_settings:
```sql
UPDATE system_settings
SET value = 'https://wdpexjymbiyqwdttqhz.supabase.co'
WHERE key = 'supabase_url';

UPDATE system_settings
SET value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
WHERE key = 'supabase_service_role_key';
```

### Option 2: Run Existing Migration

The migration file already exists in the migrations folder:

**File:** `/supabase/migrations/20251203000001_update_whatsapp_triggers.sql`

**BUT:** This assumes:
- `pg_net` is already enabled
- Helper functions already exist
- `system_settings` is already configured

If any of these are missing, use Option 1 instead.

### Option 3: Quick Fix (If only system_settings is the issue)

If triggers exist but aren't working:

```sql
-- Update system_settings with actual values
UPDATE system_settings
SET value = 'https://wdpexjymbiyqwdttqhz.supabase.co'
WHERE key = 'supabase_url';

UPDATE system_settings
SET value = 'YOUR_ACTUAL_SERVICE_ROLE_KEY'
WHERE key = 'supabase_service_role_key';

-- Enable WhatsApp automations
UPDATE whatsapp_settings
SET is_enabled = true,
    is_connected = true,
    auto_order_confirmation = true,
    auto_order_ready = true
WHERE store_id = (SELECT id FROM stores WHERE subdomain = 'totus');
```

## Diagnostic Script

**File:** `/scripts/DIAGNOSE_WHATSAPP_TRIGGERS.sql`

Run this to identify exactly which component is failing. It checks:
1. pg_net extension status
2. Helper functions existence
3. Trigger functions existence
4. Triggers registration on orders table
5. system_settings configuration
6. WhatsApp settings for store
7. Recent orders
8. pg_net request history

## Testing

**File:** `/scripts/TEST_WHATSAPP_TRIGGERS.sql`

After applying fixes:
1. Run prerequisites check
2. Check system_settings configuration
3. Find a test order
4. Verify WhatsApp settings
5. Manually trigger status update
6. Check pg_net request history
7. Verify WhatsApp message was logged

## Key Differences: Old vs New Approach

### Old Approach (20251201000001)
- Triggered on INSERT (new orders)
- Sent message immediately when order created
- Used snake_case payload keys

### New Approach (20251203000001)
- Triggers on UPDATE (status changes)
- Sends message when status → 'confirmed' or 'ready'
- Uses camelCase payload keys (matches edge function)
- No more automatic messages on order creation

### Why the Change?

The user wants messages sent when:
- Admin **confirms** order → Send "order confirmed" message
- Admin marks order as **ready** → Send "order ready" message

NOT when customer first creates the order (INSERT).

## Enhanced Logging

The new trigger functions include detailed logging:

```sql
RAISE NOTICE '[WhatsApp Trigger] notify_order_confirmed_whatsapp() called for order %', NEW.id;
RAISE NOTICE '[WhatsApp Trigger] Processing confirmed status change: % -> %', OLD.status, NEW.status;
RAISE NOTICE '[WhatsApp Trigger] Settings validated. Building payload...';
RAISE NOTICE '[WhatsApp Trigger] Payload built: %', v_payload::TEXT;
RAISE NOTICE '[WhatsApp Trigger] Calling edge function at: %', v_url;
RAISE NOTICE '[WhatsApp Trigger] ✓ Request queued successfully! Order: %, Request ID: %', NEW.id, v_response_id;
RAISE WARNING '[WhatsApp Trigger] ✗ Error sending notification for order %: %', NEW.id, SQLERRM;
```

These messages appear in Supabase logs and help identify exactly where the trigger fails.

## Summary

**Most Likely Root Cause:** `system_settings` table contains placeholder values instead of actual Supabase URL and service role key.

**Secondary Issues:**
1. Payload format mismatch (snake_case vs camelCase)
2. pg_net extension not enabled
3. Helper functions missing
4. WhatsApp settings not enabled

**Solution:** Run `/scripts/FIX_WHATSAPP_TRIGGERS_COMPLETE.sql` and update system_settings with actual values.

**Verification:** Run `/scripts/DIAGNOSE_WHATSAPP_TRIGGERS.sql` to identify issues, then `/scripts/TEST_WHATSAPP_TRIGGERS.sql` to verify fix.
