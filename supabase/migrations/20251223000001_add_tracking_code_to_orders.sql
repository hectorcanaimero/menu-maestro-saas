-- Add tracking_code field to orders table
-- This field stores a unique code for order tracking

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;

-- Create index for faster lookups by tracking_code
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);

-- Create function to generate unique tracking code
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes confusing characters
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate tracking_code on insert
CREATE OR REPLACE FUNCTION set_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code := generate_tracking_code();

    -- Ensure uniqueness (very unlikely collision, but just in case)
    WHILE EXISTS (SELECT 1 FROM orders WHERE tracking_code = NEW.tracking_code) LOOP
      NEW.tracking_code := generate_tracking_code();
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS orders_set_tracking_code ON orders;
CREATE TRIGGER orders_set_tracking_code
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_code();

-- Backfill tracking codes for existing orders
UPDATE orders
SET tracking_code = generate_tracking_code()
WHERE tracking_code IS NULL;

-- Ensure all tracking codes are unique after backfill
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tracking_code, array_agg(id) as order_ids
    FROM orders
    WHERE tracking_code IS NOT NULL
    GROUP BY tracking_code
    HAVING COUNT(*) > 1
  ) LOOP
    -- For duplicate tracking codes, regenerate for all but the first
    DECLARE
      order_id_arr UUID[];
      i INTEGER;
    BEGIN
      order_id_arr := r.order_ids;
      FOR i IN 2..array_length(order_id_arr, 1) LOOP
        UPDATE orders
        SET tracking_code = generate_tracking_code()
        WHERE id = order_id_arr[i];
      END LOOP;
    END;
  END LOOP;
END $$;
