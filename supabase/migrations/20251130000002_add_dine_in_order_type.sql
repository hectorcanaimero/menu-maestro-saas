-- ============================================================================
-- Migration: Add dine_in order type support
-- Date: 2025-11-30
-- Description: Updates order_type constraint and admin_create_order function to support dine_in
-- ============================================================================

-- Step 1: Drop existing constraint on orders table
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_order_type_check;

-- Step 2: Add new constraint with dine_in included
ALTER TABLE public.orders
ADD CONSTRAINT orders_order_type_check
CHECK (order_type IN ('delivery', 'pickup', 'dine_in'));

-- Step 3: Update the admin_create_order function (already modified in previous migration file)
-- The function validation is already updated in 20251130000001_admin_order_management.sql

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Note: The admin_create_order function now accepts 'dine_in' as a valid order_type
-- Note: Removed 'digital_menu' from allowed order types (admin should only create real orders)
