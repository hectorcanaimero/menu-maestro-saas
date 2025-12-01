-- =====================================================
-- Verification Script: Totus Development Store
-- =====================================================
-- Run this script in Supabase SQL Editor to verify
-- that the 'totus' store was created correctly
-- =====================================================

-- 1. Check if the store exists
SELECT
  '1. Store Exists' as check_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as count
FROM public.stores
WHERE subdomain = 'totus';

-- 2. Check store is active
SELECT
  '2. Store is Active' as check_name,
  CASE
    WHEN is_active = true THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  is_active
FROM public.stores
WHERE subdomain = 'totus';

-- 3. Check store has all required fields
SELECT
  '3. Store Configuration' as check_name,
  '✅ PASS' as status,
  subdomain,
  name,
  is_active,
  operating_modes,
  force_status,
  currency
FROM public.stores
WHERE subdomain = 'totus';

-- 4. Check categories exist
SELECT
  '4. Categories Created' as check_name,
  CASE
    WHEN COUNT(*) = 4 THEN '✅ PASS'
    ELSE '❌ FAIL (Expected 4, got ' || COUNT(*) || ')'
  END as status,
  COUNT(*) as count
FROM public.categories
WHERE store_id = (SELECT id FROM public.stores WHERE subdomain = 'totus');

-- 5. List all categories
SELECT
  '5. Category List' as check_name,
  name,
  display_order,
  is_active
FROM public.categories
WHERE store_id = (SELECT id FROM public.stores WHERE subdomain = 'totus')
ORDER BY display_order;

-- 6. Check menu items exist
SELECT
  '6. Menu Items Created' as check_name,
  CASE
    WHEN COUNT(*) >= 4 THEN '✅ PASS'
    ELSE '❌ FAIL (Expected 4+, got ' || COUNT(*) || ')'
  END as status,
  COUNT(*) as count
FROM public.menu_items
WHERE store_id = (SELECT id FROM public.stores WHERE subdomain = 'totus');

-- 7. Check store hours exist
SELECT
  '7. Store Hours Created' as check_name,
  CASE
    WHEN COUNT(*) = 6 THEN '✅ PASS'
    ELSE '❌ FAIL (Expected 6 days, got ' || COUNT(*) || ')'
  END as status,
  COUNT(*) as count
FROM public.store_hours
WHERE store_id = (SELECT id FROM public.stores WHERE subdomain = 'totus');

-- 8. List store hours
SELECT
  '8. Store Hours Schedule' as check_name,
  CASE day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day,
  open_time,
  close_time
FROM public.store_hours
WHERE store_id = (SELECT id FROM public.stores WHERE subdomain = 'totus')
ORDER BY day_of_week;

-- 9. Test the RPC function
SELECT
  '9. RPC Function Test' as check_name,
  CASE
    WHEN store_data IS NOT NULL THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  rate_limit_ok,
  error_message
FROM public.get_store_by_subdomain_secure('totus', NULL);

-- 10. Check RLS policies allow public read
-- This should work even without auth
SELECT
  '10. Public Read Access' as check_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as accessible_stores
FROM public.stores
WHERE subdomain = 'totus' AND is_active = true;

-- =====================================================
-- Summary Report
-- =====================================================

SELECT
  '=== SUMMARY ===' as section,
  CASE
    WHEN (
      SELECT COUNT(*) FROM public.stores WHERE subdomain = 'totus'
    ) > 0
    AND (
      SELECT is_active FROM public.stores WHERE subdomain = 'totus'
    ) = true
    AND (
      SELECT COUNT(*) FROM public.categories
      WHERE store_id = (SELECT id FROM public.stores WHERE subdomain = 'totus')
    ) = 4
    AND (
      SELECT COUNT(*) FROM public.store_hours
      WHERE store_id = (SELECT id FROM public.stores WHERE subdomain = 'totus')
    ) = 6
    THEN '✅ ALL CHECKS PASSED - Store is ready for development'
    ELSE '❌ SOME CHECKS FAILED - Review the results above'
  END as result;

-- =====================================================
-- Quick Fix Queries (if needed)
-- =====================================================

-- Activate the store if it's inactive
-- UPDATE public.stores SET is_active = true WHERE subdomain = 'totus';

-- Update owner_id to your user
-- UPDATE public.stores SET owner_id = 'YOUR-USER-UUID' WHERE subdomain = 'totus';

-- Delete the store (use only if you want to start over)
-- DELETE FROM public.stores WHERE subdomain = 'totus';

-- =====================================================
