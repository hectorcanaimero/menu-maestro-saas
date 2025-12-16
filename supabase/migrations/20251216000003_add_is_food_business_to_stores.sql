-- Add is_food_business field to stores table
-- This field determines if the business is a food-related business
-- When false, kitchen/cooking related features will be hidden

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS is_food_business BOOLEAN DEFAULT true;

-- Add comment to document the field
COMMENT ON COLUMN public.stores.is_food_business IS 'Indicates if the store is a food business. When false, kitchen-related features are hidden.';

-- Update existing stores to be food businesses by default (backward compatibility)
UPDATE public.stores
SET is_food_business = true
WHERE is_food_business IS NULL;
