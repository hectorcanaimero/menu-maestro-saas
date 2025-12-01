-- ============================================================================
-- WhatsApp Integration - Database Configuration Setup
-- ============================================================================
-- This script configures the system_settings table for WhatsApp integration.
-- Run this in your Supabase SQL Editor after applying migrations.
--
-- IMPORTANT: Replace the placeholder values with your actual credentials!
-- ============================================================================

-- Step 1: Update Supabase URL
-- Get this from: Supabase Dashboard > Project Settings > API > Project URL
UPDATE system_settings
SET value = 'https://wdpexjymbiyqwdttqhz.supabase.co'
WHERE key = 'supabase_url';

-- Step 2: Update Service Role Key
-- Get this from: Supabase Dashboard > Project Settings > API > service_role (secret)
-- ⚠️ WARNING: Keep this key secret! Never expose it in frontend code.
UPDATE system_settings
SET value = 'YOUR_SERVICE_ROLE_KEY_HERE'
WHERE key = 'supabase_service_role_key';

-- Step 3: Verify configuration
SELECT
  key,
  CASE
    WHEN key = 'supabase_service_role_key' THEN LEFT(value, 20) || '...'
    ELSE value
  END as value,
  description,
  updated_at
FROM system_settings
ORDER BY key;

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- key                          | value                              | description
-- ---------------------------- | ---------------------------------- | -----------
-- supabase_service_role_key   | eyJhbGciOiJIUzI1NiI...             | Supabase service role key...
-- supabase_url                 | https://wdpexjymbiyqwdttqhz.sub... | Supabase project URL...
--
-- If you see "YOUR_PROJECT_REF" or "YOUR_SERVICE_ROLE_KEY", update the values above!
-- ============================================================================
