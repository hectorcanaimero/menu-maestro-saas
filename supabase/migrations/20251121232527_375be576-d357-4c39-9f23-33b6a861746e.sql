-- Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
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
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
DROP POLICY IF EXISTS "Stores are publicly readable if active" ON public.stores;
CREATE POLICY "Stores are publicly readable if active"
ON public.stores FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Store owners can view their stores" ON public.stores;
CREATE POLICY "Store owners can view their stores"
ON public.stores FOR SELECT
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create stores" ON public.stores;
CREATE POLICY "Authenticated users can create stores"
ON public.stores FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Store owners can update their stores" ON public.stores;
CREATE POLICY "Store owners can update their stores"
ON public.stores FOR UPDATE
USING (owner_id = auth.uid());

-- Add store_id to categories
DO $$
BEGIN
  ALTER TABLE public.categories ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add store_id to menu_items
DO $$
BEGIN
  ALTER TABLE public.menu_items ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add store_id to orders
DO $$
BEGIN
  ALTER TABLE public.orders ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Update RLS policies for categories
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Categories are publicly readable in active stores" ON public.categories;
DROP POLICY IF EXISTS "Store owners can manage their categories" ON public.categories;

CREATE POLICY "Categories are publicly readable in active stores"
ON public.categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = categories.store_id
    AND stores.is_active = true
  )
);

CREATE POLICY "Store owners can manage their categories"
ON public.categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = categories.store_id
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = categories.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Update RLS policies for menu_items
DROP POLICY IF EXISTS "Menu items are publicly readable" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Menu items are publicly readable in active stores" ON public.menu_items;
DROP POLICY IF EXISTS "Store owners can manage their menu items" ON public.menu_items;

CREATE POLICY "Menu items are publicly readable in active stores"
ON public.menu_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = menu_items.store_id
    AND stores.is_active = true
  )
);

CREATE POLICY "Store owners can manage their menu items"
ON public.menu_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = menu_items.store_id
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = menu_items.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Update RLS policies for orders
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders in active stores" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders by email" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update their store orders" ON public.orders;

CREATE POLICY "Anyone can create orders in active stores"
ON public.orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
    AND stores.is_active = true
  )
);

CREATE POLICY "Users can view orders by email"
ON public.orders FOR SELECT
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Store owners can view their store orders"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their store orders"
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = orders.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Add trigger for stores updated_at
DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for subdomain lookups
CREATE INDEX IF NOT EXISTS idx_stores_subdomain ON public.stores(subdomain);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_store_id ON public.menu_items(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);