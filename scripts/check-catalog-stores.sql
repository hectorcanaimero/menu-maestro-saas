-- Script to check catalog stores and their configuration
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check all stores and their catalog_mode status
SELECT
  id,
  name,
  subdomain,
  catalog_mode,
  operating_mode,
  owner_id,
  created_at
FROM stores
ORDER BY catalog_mode DESC, created_at DESC;

-- 2. Count stores by catalog_mode
SELECT
  catalog_mode,
  COUNT(*) as count
FROM stores
GROUP BY catalog_mode;

-- 3. Check stores with catalog_mode = true (should appear in the admin panel)
SELECT
  s.id,
  s.name,
  s.subdomain,
  s.catalog_mode,
  s.operating_mode,
  u.email as owner_email
FROM stores s
LEFT JOIN auth.users u ON s.owner_id = u.id
WHERE s.catalog_mode = true;

-- 4. Test check_catalog_view_limit function for each catalog store
SELECT
  s.id,
  s.name,
  s.subdomain,
  check_catalog_view_limit(s.id) as limit_status
FROM stores s
WHERE s.catalog_mode = true;

-- 5. Check catalog_views_monthly table
SELECT
  cvm.id,
  cvm.store_id,
  s.name as store_name,
  s.subdomain,
  cvm.month,
  cvm.view_count,
  cvm.created_at,
  cvm.updated_at
FROM catalog_views_monthly cvm
LEFT JOIN stores s ON cvm.store_id = s.id
ORDER BY cvm.month DESC, cvm.view_count DESC;

-- 6. Check subscription plans with catalog_view_limit
SELECT
  id,
  name,
  catalog_view_limit,
  price,
  interval
FROM subscription_plans
ORDER BY price;

-- 7. Check active subscriptions for catalog stores
SELECT
  s.id as store_id,
  s.name as store_name,
  s.subdomain,
  s.catalog_mode,
  sub.status as subscription_status,
  sub.current_period_end,
  sp.name as plan_name,
  sp.catalog_view_limit
FROM stores s
LEFT JOIN subscriptions sub ON s.id = sub.store_id
  AND sub.status = 'active'
  AND sub.current_period_end > NOW()
LEFT JOIN subscription_plans sp ON sub.plan_id = sp.id
WHERE s.catalog_mode = true;
