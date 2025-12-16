-- Migration: Backfill missing admin roles
-- Description: Assigns 'admin' role in user_roles table to all store owners who don't have it yet
-- Created: 2025-12-16
-- Purpose: Fix historical data where store owners were not automatically assigned admin role

-- Backfill: Add admin role to all existing store owners
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT s.owner_id, 'admin'
FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = s.owner_id AND ur.role = 'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.user_roles IS
'User roles for authorization. Store owners should have admin role to access their store admin panel. Platform admins are in a separate platform_admins table.';
