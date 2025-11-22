-- Add banner_url field to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN stores.banner_url IS 'URL of the banner/hero image for the store catalog';