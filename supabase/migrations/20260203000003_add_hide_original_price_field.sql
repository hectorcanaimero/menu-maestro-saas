-- Migration: Add hide_original_price field to stores
-- Description: Allows stores to hide the original currency price and only show the converted VES price
-- Date: 2026-02-03

-- Add the hide_original_price column
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS hide_original_price boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN stores.hide_original_price IS 'When true, only shows the VES converted price (hides original USD/EUR price)';
