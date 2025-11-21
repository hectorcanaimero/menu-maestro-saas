-- Fix foreign key for orders.store_id (was incorrectly pointing to orders table)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_store_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;