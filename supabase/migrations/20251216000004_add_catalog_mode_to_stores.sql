-- Add catalog_mode field to stores table
-- This field enables "Catalog Mode" where the store displays products without purchasing functionality
-- When true, all purchase-related features (cart, checkout, payments) are hidden
-- This is useful for businesses that want to showcase their products without e-commerce

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS catalog_mode BOOLEAN DEFAULT false;

-- Add comment to document the field
COMMENT ON COLUMN public.stores.catalog_mode IS 'Enables catalog-only mode. When true, hides all purchase functionality (cart, checkout, payments). Free tier limited by page views tracked via PostHog.';

-- Update existing stores to have catalog mode disabled by default
UPDATE public.stores
SET catalog_mode = false
WHERE catalog_mode IS NULL;
