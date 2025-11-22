-- Add advanced settings columns to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS remove_zipcode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS remove_address_number boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_audio_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_volume integer DEFAULT 80,
ADD COLUMN IF NOT EXISTS notification_repeat_count integer DEFAULT 3;

COMMENT ON COLUMN stores.remove_zipcode IS 'Remove zipcode field from checkout forms';
COMMENT ON COLUMN stores.remove_address_number IS 'Remove address number field from checkout forms';
COMMENT ON COLUMN stores.enable_audio_notifications IS 'Enable audio notifications for new orders in admin panel';
COMMENT ON COLUMN stores.notification_volume IS 'Volume level for notification sounds (0-100)';
COMMENT ON COLUMN stores.notification_repeat_count IS 'Number of times to repeat notification sound';