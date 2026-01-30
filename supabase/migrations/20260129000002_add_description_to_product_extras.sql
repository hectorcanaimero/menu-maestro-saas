-- =============================================
-- Migration: Add Description to Product Extras
-- Description: Add description field and ensure is_available toggle works
-- Date: 2026-01-29
-- =============================================

-- ============================================================================
-- PART 1: Add description column to product_extras table
-- ============================================================================

-- Add description column if it doesn't exist
ALTER TABLE public.product_extras
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.product_extras.description IS
'Optional description text for the extra option, shown to customers';

-- ============================================================================
-- PART 2: Ensure is_available has a proper default and is not null
-- ============================================================================

-- Update any null values to true (default available)
UPDATE public.product_extras
SET is_available = true
WHERE is_available IS NULL;

-- Add default value for is_available if not already set
ALTER TABLE public.product_extras
ALTER COLUMN is_available SET DEFAULT true;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'product_extras'
-- ORDER BY ordinal_position;
