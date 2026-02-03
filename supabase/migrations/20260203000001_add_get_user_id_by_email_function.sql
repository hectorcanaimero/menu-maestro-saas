-- Migration: Add get_user_id_by_email function for platform admin
-- Description: Creates a secure RPC function to get user_id by email for platform admins
-- Date: 2026-02-03

-- Drop function if exists
DROP FUNCTION IF EXISTS get_user_id_by_email(text);

-- Create function to get user_id by email
-- This function is used by platform admins to add new admins
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Check if caller is a platform admin
  SELECT EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = auth.uid()
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only platform admins can lookup users by email';
  END IF;

  -- Get user_id from profiles table
  SELECT id INTO v_user_id
  FROM profiles
  WHERE email = lower(trim(p_email))
  LIMIT 1;

  -- Return user_id (can be null if not found)
  RETURN v_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_by_email(text) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_id_by_email IS 'Securely retrieves user_id by email for platform admins only';
