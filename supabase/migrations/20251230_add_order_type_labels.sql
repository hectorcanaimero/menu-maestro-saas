-- Add custom order type labels to stores table
-- PIDEA-77: Traducción personalizable en configuración de tienda

-- Add columns for custom order type labels
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS delivery_label VARCHAR(50) DEFAULT 'Delivery',
ADD COLUMN IF NOT EXISTS pickup_label VARCHAR(50) DEFAULT 'Pick-up',
ADD COLUMN IF NOT EXISTS digital_menu_label VARCHAR(50) DEFAULT 'Mesa';

-- Add comments for documentation
COMMENT ON COLUMN stores.delivery_label IS 'Custom label for delivery order type (default: Delivery)';
COMMENT ON COLUMN stores.pickup_label IS 'Custom label for pickup order type (default: Pick-up)';
COMMENT ON COLUMN stores.digital_menu_label IS 'Custom label for digital menu/table order type (default: Mesa)';

-- Update existing stores with default values
UPDATE stores
SET
  delivery_label = COALESCE(delivery_label, 'Delivery'),
  pickup_label = COALESCE(pickup_label, 'Pick-up'),
  digital_menu_label = COALESCE(digital_menu_label, 'Mesa')
WHERE
  delivery_label IS NULL
  OR pickup_label IS NULL
  OR digital_menu_label IS NULL;
