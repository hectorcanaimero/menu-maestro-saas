-- Add design customization fields to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS primary_color TEXT,
ADD COLUMN IF NOT EXISTS price_color TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN stores.primary_color IS 'Primary brand color in hex format (e.g., #FF0000)';
COMMENT ON COLUMN stores.price_color IS 'Price display color in hex format (e.g., #00FF00)';