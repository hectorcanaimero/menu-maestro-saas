-- Migration: Fix get_user_owned_store() function
-- Description: Update function to use operating_modes (array) instead of operating_mode (singular)
-- Created: 2025-12-16
-- Issue: Column operating_mode no longer exists, was changed to operating_modes

CREATE OR REPLACE FUNCTION public.get_user_owned_store()
RETURNS TABLE (
  id UUID,
  subdomain TEXT,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN,
  operating_modes public.operating_mode[],
  whatsapp_number TEXT,
  whatsapp_redirect BOOLEAN,
  force_status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.subdomain,
    s.name,
    s.description,
    s.logo_url,
    s.phone,
    s.email,
    s.address,
    s.is_active,
    s.operating_modes,
    s.whatsapp_number,
    s.whatsapp_redirect,
    s.force_status::TEXT
  FROM public.stores s
  WHERE s.owner_id = auth.uid()
  LIMIT 1; -- User can only own one store for now
END;
$$;

COMMENT ON FUNCTION public.get_user_owned_store() IS
'Returns the store owned by the authenticated user. Used to quickly get user store info. Updated to use operating_modes array.';
