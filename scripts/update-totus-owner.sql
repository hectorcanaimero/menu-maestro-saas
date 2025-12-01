-- =====================================================
-- Helper Script: Update Totus Store Owner
-- =====================================================
-- Use this script to update the owner_id of the 'totus'
-- development store to your user UUID
-- =====================================================

-- STEP 1: Find your user ID
-- Replace 'your-email@example.com' with your actual email
SELECT
  id as user_uuid,
  email,
  created_at as user_created_at
FROM auth.users
WHERE email = 'your-email@example.com';  -- REPLACE WITH YOUR EMAIL

-- Copy the user_uuid from the result above

-- =====================================================

-- STEP 2: Update the store owner
-- Replace 'YOUR-USER-UUID-HERE' with the UUID from Step 1
UPDATE public.stores
SET
  owner_id = 'YOUR-USER-UUID-HERE',  -- REPLACE WITH YOUR UUID
  updated_at = NOW()
WHERE subdomain = 'totus';

-- =====================================================

-- STEP 3: Verify the update
SELECT
  id as store_id,
  subdomain,
  name,
  owner_id,
  is_active,
  created_at,
  updated_at
FROM public.stores
WHERE subdomain = 'totus';

-- =====================================================

-- STEP 4: Verify ownership (optional)
-- This should return TRUE if the owner_id matches your user
SELECT
  s.subdomain,
  s.name,
  s.owner_id,
  u.email as owner_email,
  (s.owner_id = auth.uid()) as is_current_user_owner
FROM public.stores s
LEFT JOIN auth.users u ON u.id = s.owner_id
WHERE s.subdomain = 'totus';

-- =====================================================

-- ADDITIONAL: Get all users (for debugging)
-- Uncomment if you need to see all users in the system
-- SELECT id, email, created_at FROM auth.users;

-- =====================================================

-- CLEANUP: Delete development store (use only in production)
-- Uncomment ONLY if you want to remove the development store
-- DELETE FROM public.stores WHERE subdomain = 'totus';
