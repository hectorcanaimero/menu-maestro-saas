-- Migration: Optimize payment validations query
-- Description: Creates RPC functions to fetch payment validations with all related data in a single efficient query
-- Date: 2026-02-03

-- Drop functions if they exist
DROP FUNCTION IF EXISTS get_pending_payment_validations();
DROP FUNCTION IF EXISTS get_recent_payment_validations();

-- Function to get pending payment validations
CREATE OR REPLACE FUNCTION get_pending_payment_validations()
RETURNS TABLE (
  id uuid,
  subscription_id uuid,
  amount numeric,
  payment_date date,
  payment_method text,
  reference_number text,
  proof_image_url text,
  validation_notes text,
  status text,
  created_at timestamptz,
  validated_at timestamptz,
  validated_by uuid,
  rejection_reason text,
  store_id uuid,
  store_name text,
  store_subdomain text,
  store_owner_email text,
  plan_id uuid,
  plan_name text,
  plan_display_name text,
  plan_price_monthly numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is a platform admin
  IF NOT EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only platform admins can view payment validations';
  END IF;

  RETURN QUERY
  SELECT
    pv.id,
    pv.subscription_id,
    pv.amount,
    pv.payment_date,
    pv.payment_method,
    pv.reference_number,
    pv.proof_image_url,
    pv.validation_notes,
    pv.status,
    pv.created_at,
    pv.validated_at,
    pv.validated_by,
    pv.rejection_reason,
    s.id as store_id,
    s.name as store_name,
    s.subdomain as store_subdomain,
    p.email as store_owner_email,
    sp.id as plan_id,
    sp.name as plan_name,
    sp.display_name as plan_display_name,
    sp.price_monthly as plan_price_monthly
  FROM payment_validations pv
  INNER JOIN subscriptions sub ON sub.id = pv.subscription_id
  INNER JOIN stores s ON s.id = sub.store_id
  INNER JOIN profiles p ON p.id = s.owner_id
  INNER JOIN subscription_plans sp ON sp.id = sub.plan_id
  WHERE pv.status = 'pending'
  ORDER BY pv.created_at DESC;
END;
$$;

-- Function to get recent payment validations (approved/rejected)
CREATE OR REPLACE FUNCTION get_recent_payment_validations()
RETURNS TABLE (
  id uuid,
  subscription_id uuid,
  amount numeric,
  payment_date date,
  payment_method text,
  reference_number text,
  proof_image_url text,
  validation_notes text,
  status text,
  created_at timestamptz,
  validated_at timestamptz,
  validated_by uuid,
  rejection_reason text,
  store_id uuid,
  store_name text,
  store_subdomain text,
  store_owner_email text,
  plan_id uuid,
  plan_name text,
  plan_display_name text,
  plan_price_monthly numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is a platform admin
  IF NOT EXISTS (
    SELECT 1 FROM platform_admins
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only platform admins can view payment validations';
  END IF;

  RETURN QUERY
  SELECT
    pv.id,
    pv.subscription_id,
    pv.amount,
    pv.payment_date,
    pv.payment_method,
    pv.reference_number,
    pv.proof_image_url,
    pv.validation_notes,
    pv.status,
    pv.created_at,
    pv.validated_at,
    pv.validated_by,
    pv.rejection_reason,
    s.id as store_id,
    s.name as store_name,
    s.subdomain as store_subdomain,
    p.email as store_owner_email,
    sp.id as plan_id,
    sp.name as plan_name,
    sp.display_name as plan_display_name,
    sp.price_monthly as plan_price_monthly
  FROM payment_validations pv
  INNER JOIN subscriptions sub ON sub.id = pv.subscription_id
  INNER JOIN stores s ON s.id = sub.store_id
  INNER JOIN profiles p ON p.id = s.owner_id
  INNER JOIN subscription_plans sp ON sp.id = sub.plan_id
  WHERE pv.status IN ('approved', 'rejected')
  ORDER BY pv.validated_at DESC
  LIMIT 10;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pending_payment_validations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_payment_validations() TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_pending_payment_validations IS 'Efficiently retrieves all pending payment validations with store and plan details';
COMMENT ON FUNCTION get_recent_payment_validations IS 'Efficiently retrieves recent 10 processed payment validations with store and plan details';
