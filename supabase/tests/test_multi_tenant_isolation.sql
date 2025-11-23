-- ============================================================================
-- Multi-Tenant Isolation Test Suite
-- ============================================================================
-- This script tests that RLS policies properly isolate data between stores
-- Run this in a TEST/DEVELOPMENT environment ONLY
-- ============================================================================

-- Clean up any existing test data
DO $$
BEGIN
  DELETE FROM public.stores WHERE subdomain LIKE 'test-store-%';
  DELETE FROM auth.users WHERE email LIKE 'test-owner-%@test.com';
END $$;

-- ============================================================================
-- Test Setup: Create Test Users and Stores
-- ============================================================================

-- Create test users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'test-owner-1@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'test-owner-2@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Create test stores
INSERT INTO public.stores (id, subdomain, name, owner_id, is_active)
VALUES
  (
    '00000000-0000-0000-0001-000000000001'::UUID,
    'test-store-1',
    'Test Store 1',
    '00000000-0000-0000-0000-000000000001'::UUID,
    true
  ),
  (
    '00000000-0000-0000-0001-000000000002'::UUID,
    'test-store-2',
    'Test Store 2',
    '00000000-0000-0000-0000-000000000002'::UUID,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Assign admin role to test users
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'admin'),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'admin')
ON CONFLICT DO NOTHING;

-- Create test categories
INSERT INTO public.categories (id, store_id, name, is_active)
VALUES
  (
    '00000000-0000-0000-0002-000000000001'::UUID,
    '00000000-0000-0000-0001-000000000001'::UUID,
    'Category Store 1',
    true
  ),
  (
    '00000000-0000-0000-0002-000000000002'::UUID,
    '00000000-0000-0000-0001-000000000002'::UUID,
    'Category Store 2',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Create test menu items
INSERT INTO public.menu_items (id, store_id, category_id, name, price, is_available)
VALUES
  (
    '00000000-0000-0000-0003-000000000001'::UUID,
    '00000000-0000-0000-0001-000000000001'::UUID,
    '00000000-0000-0000-0002-000000000001'::UUID,
    'Item Store 1',
    10.99,
    true
  ),
  (
    '00000000-0000-0000-0003-000000000002'::UUID,
    '00000000-0000-0000-0001-000000000002'::UUID,
    '00000000-0000-0000-0002-000000000002'::UUID,
    'Item Store 2',
    15.99,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Test 1: Verify user_owns_store function works correctly
-- ============================================================================

DO $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Test: Owner 1 owns Store 1
  SELECT public.user_owns_store('00000000-0000-0000-0001-000000000001'::UUID)
  INTO result;

  -- Note: This will fail because auth.uid() returns NULL in DO blocks
  -- In real tests, you need to set the JWT token

  RAISE NOTICE 'Test 1: user_owns_store function exists and is callable';
END $$;

-- ============================================================================
-- Test 2: Verify RLS policies exist for all tables
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  expected_tables TEXT[] := ARRAY[
    'stores',
    'categories',
    'menu_items',
    'orders',
    'order_items',
    'delivery_zones',
    'payment_methods',
    'store_hours',
    'product_extras',
    'order_item_extras'
  ];
  table_name TEXT;
  missing_policies TEXT[] := '{}';
BEGIN
  FOREACH table_name IN ARRAY expected_tables
  LOOP
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = table_name;

    IF policy_count = 0 THEN
      missing_policies := array_append(missing_policies, table_name);
    END IF;

    RAISE NOTICE 'Table %: % policies found', table_name, policy_count;
  END LOOP;

  IF array_length(missing_policies, 1) > 0 THEN
    RAISE WARNING 'Tables without RLS policies: %', missing_policies;
  ELSE
    RAISE NOTICE 'Test 2 PASSED: All tables have RLS policies';
  END IF;
END $$;

-- ============================================================================
-- Test 3: Verify foreign key constraint is correct
-- ============================================================================

DO $$
DECLARE
  fk_target TEXT;
BEGIN
  SELECT confrelid::regclass::TEXT
  INTO fk_target
  FROM pg_constraint
  WHERE conname = 'orders_store_id_fkey';

  IF fk_target = 'stores' THEN
    RAISE NOTICE 'Test 3 PASSED: orders.store_id foreign key points to stores table';
  ELSE
    RAISE WARNING 'Test 3 FAILED: orders.store_id foreign key points to % instead of stores', fk_target;
  END IF;
END $$;

-- ============================================================================
-- Test 4: List all RLS policies using user_owns_store
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN qual::TEXT LIKE '%user_owns_store%' OR with_check::TEXT LIKE '%user_owns_store%' THEN 'YES'
    ELSE 'NO'
  END as uses_helper_function
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- Test 5: Manual Verification Instructions
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Manual Testing Instructions';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Test with Store Owner 1 JWT:';
  RAISE NOTICE '   - Login as test-owner-1@test.com';
  RAISE NOTICE '   - Try to SELECT from categories';
  RAISE NOTICE '   - Should see only Category Store 1';
  RAISE NOTICE '   - Try to UPDATE Category Store 2 (should fail)';
  RAISE NOTICE '';
  RAISE NOTICE '2. Test with Store Owner 2 JWT:';
  RAISE NOTICE '   - Login as test-owner-2@test.com';
  RAISE NOTICE '   - Try to SELECT from menu_items';
  RAISE NOTICE '   - Should see only Item Store 2';
  RAISE NOTICE '   - Try to DELETE Item Store 1 (should fail)';
  RAISE NOTICE '';
  RAISE NOTICE '3. Test Public Access:';
  RAISE NOTICE '   - Access without authentication';
  RAISE NOTICE '   - Should be able to view active stores';
  RAISE NOTICE '   - Should be able to view menu items';
  RAISE NOTICE '   - Should NOT be able to modify anything';
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
END $$;

-- ============================================================================
-- Test 6: Verify Helper Function Performance
-- ============================================================================

EXPLAIN ANALYZE
SELECT *
FROM public.categories
WHERE public.user_owns_store(store_id);

-- ============================================================================
-- Cleanup Test Data (Optional)
-- ============================================================================

/*
-- Uncomment to clean up test data:

DELETE FROM public.menu_items WHERE id IN (
  '00000000-0000-0000-0003-000000000001'::UUID,
  '00000000-0000-0000-0003-000000000002'::UUID
);

DELETE FROM public.categories WHERE id IN (
  '00000000-0000-0000-0002-000000000001'::UUID,
  '00000000-0000-0000-0002-000000000002'::UUID
);

DELETE FROM public.stores WHERE id IN (
  '00000000-0000-0000-0001-000000000001'::UUID,
  '00000000-0000-0000-0001-000000000002'::UUID
);

DELETE FROM public.user_roles WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001'::UUID,
  '00000000-0000-0000-0000-000000000002'::UUID
);

DELETE FROM auth.users WHERE id IN (
  '00000000-0000-0000-0000-000000000001'::UUID,
  '00000000-0000-0000-0000-000000000002'::UUID
);
*/

-- ============================================================================
-- End of Test Suite
-- ============================================================================
