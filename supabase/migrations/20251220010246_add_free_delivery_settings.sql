-- Add free delivery settings to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS free_delivery_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS global_free_delivery_min_amount DECIMAL(10,2) DEFAULT NULL;

-- Add free delivery settings to delivery_zones table
ALTER TABLE delivery_zones
ADD COLUMN IF NOT EXISTS free_delivery_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS free_delivery_min_amount DECIMAL(10,2) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN stores.free_delivery_enabled IS 'Master toggle for free delivery feature at store level';
COMMENT ON COLUMN stores.global_free_delivery_min_amount IS 'Default minimum order amount for free delivery across all zones';
COMMENT ON COLUMN delivery_zones.free_delivery_enabled IS 'Whether this zone is included in free delivery promotion (true = use global/custom amount, false = excluded)';
COMMENT ON COLUMN delivery_zones.free_delivery_min_amount IS 'Custom minimum amount for this specific zone (NULL = use global amount from store)';
