# WhatsApp Triggers - Flow Diagrams

## Current Flow (After Fix)

### Order Confirmation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin updates order status to 'confirmed' in Admin Dashboard    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ PostgreSQL: UPDATE orders SET status = 'confirmed' WHERE ...    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Trigger: trigger_notify_order_confirmed_whatsapp                │
│ Event: AFTER UPDATE ON orders                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Function: notify_order_confirmed_whatsapp()                     │
│                                                                  │
│ Step 1: Check if status changed                                 │
│   ├─ TG_OP = 'UPDATE'? ✓                                        │
│   ├─ NEW.status = 'confirmed'? ✓                                │
│   └─ OLD.status ≠ 'confirmed'? ✓                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Get WhatsApp settings                                   │
│                                                                  │
│ SELECT is_enabled, is_connected, auto_order_confirmation        │
│ FROM whatsapp_settings WHERE store_id = NEW.store_id            │
│                                                                  │
│ Checks:                                                          │
│   ├─ is_enabled = true? ✓                                       │
│   ├─ is_connected = true? ✓                                     │
│   └─ auto_order_confirmation = true? ✓                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Build payload                                           │
│                                                                  │
│ {                                                                │
│   storeId: "uuid",                                              │
│   customerPhone: "+5541988003278",                              │
│   customerName: "Customer Name",                                │
│   messageType: "order_confirmation",                            │
│   orderId: "uuid",                                              │
│   variables: {                                                  │
│     customer_name: "Customer Name",                             │
│     order_number: "12345678",                                   │
│     order_total: "150.00",                                      │
│     order_type: "delivery",                                     │
│     delivery_address: "123 Main St"                             │
│   }                                                             │
│ }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Get configuration from system_settings                  │
│                                                                  │
│ url := get_supabase_url()                                       │
│   └─ Returns: "https://wdpexjymbiyqwdttqhz.supabase.co"        │
│                                                                  │
│ key := get_service_role_key()                                   │
│   └─ Returns: "eyJhbGciOiJIUzI1NiIs..." (JWT token)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Queue HTTP request via pg_net                           │
│                                                                  │
│ SELECT net.http_post(                                           │
│   url := 'https://...supabase.co/functions/v1/send-whatsapp-    │
│            message',                                             │
│   headers := {                                                  │
│     'Content-Type': 'application/json',                         │
│     'Authorization': 'Bearer eyJhbGc...'                        │
│   },                                                             │
│   body := {...payload...}                                       │
│ ) INTO v_response_id;                                           │
│                                                                  │
│ ✓ Request queued successfully! Request ID: 123                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ pg_net: Asynchronous HTTP request to Edge Function              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Edge Function: send-whatsapp-message                            │
│                                                                  │
│ Step 1: Get WhatsApp settings + store subdomain                 │
│ Step 2: Check and use credits                                   │
│ Step 3: Get message template                                    │
│ Step 4: Format phone number                                     │
│ Step 5: Send via Evolution API                                  │
│ Step 6: Log message in whatsapp_messages table                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Evolution API: Send WhatsApp message                            │
│                                                                  │
│ POST /message/sendText/totus                                    │
│ {                                                                │
│   number: "5541988003278",                                      │
│   text: "Olá {customer_name}! Seu pedido #{order_number}..."   │
│ }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ WhatsApp: Message delivered to customer phone                   │
│ Customer receives: "Olá Customer! Seu pedido #12345678..."      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Failure Scenarios

### Scenario 1: system_settings Not Configured (MAIN ISSUE)

```
┌─────────────────────────────────────────────────────────────────┐
│ Trigger: notify_order_confirmed_whatsapp()                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Get configuration                                       │
│                                                                  │
│ url := get_supabase_url()                                       │
│   ├─ SELECT value FROM system_settings WHERE key = 'supabase    │
│   │   _url'                                                      │
│   ├─ Returns: "https://YOUR_PROJECT_REF.supabase.co"           │
│   └─ ❌ Placeholder detected! Returns NULL                      │
│                                                                  │
│ RAISE WARNING 'Supabase URL is NULL - check system_settings'    │
│ RETURN NEW; (exit without sending)                              │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Result: Order updated successfully, NO WhatsApp sent            │
│ Logs: "Supabase URL is NULL - check system_settings"            │
└─────────────────────────────────────────────────────────────────┘
```

### Scenario 2: WhatsApp Not Enabled

```
┌─────────────────────────────────────────────────────────────────┐
│ Trigger: notify_order_confirmed_whatsapp()                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Get WhatsApp settings                                   │
│                                                                  │
│ SELECT is_enabled, is_connected, auto_order_confirmation        │
│ FROM whatsapp_settings WHERE store_id = NEW.store_id            │
│                                                                  │
│ Returns:                                                         │
│   ├─ is_enabled = FALSE ❌                                      │
│   ├─ is_connected = TRUE                                        │
│   └─ auto_order_confirmation = TRUE                             │
│                                                                  │
│ RAISE NOTICE 'WhatsApp not enabled for store_id=xxx'            │
│ RETURN NEW; (exit without sending)                              │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Result: Order updated successfully, NO WhatsApp sent            │
│ Logs: "WhatsApp not enabled for store_id=xxx"                   │
└─────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Payload Format Mismatch (Old Triggers)

```
┌─────────────────────────────────────────────────────────────────┐
│ Old Trigger (before fix): notify_new_order_whatsapp()           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Builds payload with WRONG format:                               │
│                                                                  │
│ {                                                                │
│   store_id: "uuid",          ❌ snake_case                      │
│   customer_phone: "+55...",  ❌ snake_case                      │
│   message_type: "order_...", ❌ snake_case                      │
│   variables: {...}                                              │
│ }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Edge Function receives payload                                  │
│                                                                  │
│ const { storeId, customerPhone, messageType } = await req.json  │
│   ();                                                            │
│                                                                  │
│ storeId = undefined ❌ (expects storeId, gets store_id)         │
│                                                                  │
│ Cannot find WhatsApp settings because storeId is undefined      │
│ Returns: 400 Bad Request "WhatsApp not configured for this      │
│           store"                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Result: Trigger queued request, but Edge Function failed        │
│ Logs: "WhatsApp not configured for this store"                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Dependency Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
│                                                                  │
│  ┌────────────────┐         ┌────────────────┐                 │
│  │ pg_net         │         │ system_settings│                 │
│  │ Extension      │         │ Table          │                 │
│  │                │         │                │                 │
│  │ Provides:      │         │ Contains:      │                 │
│  │ net.http_post()│         │ - supabase_url │                 │
│  └────────┬───────┘         │ - service_role │                 │
│           │                 │   _key         │                 │
│           │                 └────────┬───────┘                 │
│           │                          │                          │
│           │    ┌─────────────────────┘                          │
│           │    │                                                 │
│           ▼    ▼                                                 │
│  ┌────────────────────────────┐    ┌────────────────────────┐  │
│  │ Helper Functions           │    │ Trigger Functions      │  │
│  │                            │    │                        │  │
│  │ - get_supabase_url()       │◄───┤ notify_order_confirmed │  │
│  │ - get_service_role_key()   │    │   _whatsapp()          │  │
│  └────────────────────────────┘    │ notify_order_ready_    │  │
│                                     │   whatsapp()           │  │
│                                     └────────┬───────────────┘  │
│                                              │                   │
└──────────────────────────────────────────────┼───────────────────┘
                                               │
                                               │ HTTP POST via
                                               │ pg_net
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTION LAYER                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ send-whatsapp-message                                     │  │
│  │                                                            │  │
│  │ Receives:                                                  │  │
│  │ - storeId (camelCase)                                     │  │
│  │ - customerPhone                                           │  │
│  │ - messageType                                             │  │
│  │ - variables                                               │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ HTTP POST
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL API LAYER                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Evolution API                                             │  │
│  │                                                            │  │
│  │ POST /message/sendText/{instanceName}                     │  │
│  │ {                                                          │  │
│  │   number: "5541988003278",                                │  │
│  │   text: "Olá Customer! Seu pedido..."                     │  │
│  │ }                                                          │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
                   WhatsApp Message Delivered
```

---

## Trigger Decision Tree

```
Order status updated
    │
    ▼
Is TG_OP = 'UPDATE'?
    ├─ No  → EXIT (no action)
    └─ Yes ▼
         │
         ▼
Is NEW.status = 'confirmed' OR 'ready'?
    ├─ No  → EXIT (no action)
    └─ Yes ▼
         │
         ▼
Was OLD.status already 'confirmed'/'ready'?
    ├─ Yes → EXIT (already processed)
    └─ No  ▼
         │
         ▼
Get WhatsApp settings for store
    │
    ▼
Settings found?
    ├─ No  → NOTICE: "No WhatsApp settings" → EXIT
    └─ Yes ▼
         │
         ▼
is_enabled = true?
    ├─ No  → NOTICE: "WhatsApp not enabled" → EXIT
    └─ Yes ▼
         │
         ▼
is_connected = true?
    ├─ No  → NOTICE: "WhatsApp not connected" → EXIT
    └─ Yes ▼
         │
         ▼
auto_order_confirmation/auto_order_ready = true?
    ├─ No  → NOTICE: "Automation not enabled" → EXIT
    └─ Yes ▼
         │
         ▼
Build payload (camelCase)
    │
    ▼
Get Supabase URL from system_settings
    │
    ▼
URL configured (not placeholder)?
    ├─ No  → WARNING: "URL not configured" → EXIT
    └─ Yes ▼
         │
         ▼
Get Service Role Key from system_settings
    │
    ▼
Key configured (not placeholder)?
    ├─ No  → WARNING: "Key not configured" → EXIT
    └─ Yes ▼
         │
         ▼
Queue HTTP request via pg_net
    │
    ▼
Request queued successfully?
    ├─ No  → WARNING: "Error: {error}" → EXIT
    └─ Yes ▼
         │
         ▼
NOTICE: "✓ Request queued! Request ID: {id}"
    │
    ▼
Edge Function called asynchronously
    │
    ▼
WhatsApp message sent
```

---

## Data Flow: Successful WhatsApp Message

```
┌──────────────────┐
│ Admin Dashboard  │ Admin clicks "Confirm Order"
└────────┬─────────┘
         │
         │ HTTP PATCH /orders/{id}
         │ { status: "confirmed" }
         ▼
┌──────────────────────────────────────────────┐
│ Supabase REST API                            │
│ (with RLS policies check)                    │
└────────┬─────────────────────────────────────┘
         │
         │ SQL UPDATE
         ▼
┌──────────────────────────────────────────────┐
│ PostgreSQL: orders table                     │
│ UPDATE orders SET status = 'confirmed', ...  │
└────────┬─────────────────────────────────────┘
         │
         │ AFTER UPDATE trigger fires
         ▼
┌──────────────────────────────────────────────┐
│ Trigger Function: notify_order_confirmed_    │
│                   whatsapp()                  │
│                                               │
│ 1. Validate status change ✓                  │
│ 2. Check WhatsApp settings ✓                 │
│ 3. Build payload ✓                           │
│ 4. Get URL & Key from system_settings ✓      │
│ 5. Queue HTTP request ✓                      │
└────────┬─────────────────────────────────────┘
         │
         │ pg_net.http_post()
         │ (asynchronous)
         ▼
┌──────────────────────────────────────────────┐
│ Edge Function: send-whatsapp-message         │
│                                               │
│ 1. Get WhatsApp settings ✓                   │
│ 2. Use credit ✓                              │
│ 3. Get message template ✓                    │
│ 4. Format phone number ✓                     │
│ 5. Call Evolution API ✓                      │
│ 6. Log to whatsapp_messages ✓                │
└────────┬─────────────────────────────────────┘
         │
         │ HTTP POST to Evolution API
         ▼
┌──────────────────────────────────────────────┐
│ Evolution API                                 │
│ POST /message/sendText/totus                 │
└────────┬─────────────────────────────────────┘
         │
         │ WhatsApp Business API
         ▼
┌──────────────────────────────────────────────┐
│ Customer's WhatsApp                           │
│ "Olá Customer! Seu pedido #12345678 foi      │
│  confirmado! Total: R$ 150.00..."            │
└──────────────────────────────────────────────┘
```

---

## Fix Verification Flow

```
Run diagnostic script
    │
    ▼
Check pg_net extension
    ├─ Missing → CREATE EXTENSION pg_net;
    └─ Exists → ✓
         │
         ▼
Check helper functions
    ├─ Missing → Run 20251201000002_configure_whatsapp_settings.sql
    └─ Exist → ✓
         │
         ▼
Check system_settings values
    ├─ Placeholders → UPDATE system_settings SET value = '...'
    └─ Configured → ✓
         │
         ▼
Check trigger functions
    ├─ Missing/Old → Run FIX_WHATSAPP_TRIGGERS_COMPLETE.sql
    └─ Correct → ✓
         │
         ▼
Check WhatsApp settings
    ├─ Disabled → UPDATE whatsapp_settings SET is_enabled = true, ...
    └─ Enabled → ✓
         │
         ▼
Run test
    │
    ▼
Update order status
    │
    ▼
Check logs for [WhatsApp Trigger] messages
    ├─ Success → ✓ Working!
    └─ Error → Review error message, fix, and retry
```

This visual representation should help understand exactly where the issue occurs and how to fix it!
