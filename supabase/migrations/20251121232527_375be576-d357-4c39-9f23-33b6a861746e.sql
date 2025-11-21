-- Create stores table
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$')
);

-- Enable RLS on stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
CREATE POLICY "Stores are publicly readable if active"
ON stores FOR SELECT
USING (is_active = true);

CREATE POLICY "Store owners can view their stores"
ON stores FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create stores"
ON stores FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Store owners can update their stores"
ON stores FOR UPDATE
USING (owner_id = auth.uid());

-- Add store_id to categories
ALTER TABLE categories ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Add store_id to menu_items
ALTER TABLE menu_items ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Add store_id to orders
ALTER TABLE orders ADD COLUMN store_id UUID REFERENCES orders(id) ON DELETE CASCADE;

-- Update RLS policies for categories
DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Categories are publicly readable in active stores"
ON categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = categories.store_id 
    AND stores.is_active = true
  )
);

CREATE POLICY "Store owners can manage their categories"
ON categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = categories.store_id 
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = categories.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Update RLS policies for menu_items
DROP POLICY IF EXISTS "Menu items are publicly readable" ON menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON menu_items;

CREATE POLICY "Menu items are publicly readable in active stores"
ON menu_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = menu_items.store_id 
    AND stores.is_active = true
  )
);

CREATE POLICY "Store owners can manage their menu items"
ON menu_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = menu_items.store_id 
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = menu_items.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Update RLS policies for orders
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view their orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Anyone can create orders in active stores"
ON orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = orders.store_id 
    AND stores.is_active = true
  )
);

CREATE POLICY "Users can view orders by email"
ON orders FOR SELECT
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Store owners can view their store orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = orders.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their store orders"
ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = orders.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Add trigger for stores updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON stores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create index for subdomain lookups
CREATE INDEX idx_stores_subdomain ON stores(subdomain);
CREATE INDEX idx_categories_store_id ON categories(store_id);
CREATE INDEX idx_menu_items_store_id ON menu_items(store_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);