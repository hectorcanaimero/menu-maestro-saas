-- =============================================
-- Migration: Add out_for_delivery status to orders
-- Description: Updates the valid_status constraint to include out_for_delivery
-- Date: 2026-02-05
-- =============================================

-- Drop the old constraint
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS valid_status;

-- Add the new constraint with out_for_delivery included
ALTER TABLE public.orders
  ADD CONSTRAINT valid_status CHECK (
    status IN (
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled'
    )
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- The orders table now accepts 'out_for_delivery' as a valid status
