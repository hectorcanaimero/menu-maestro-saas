-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

-- Trigger to create profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update categories policies for authenticated users
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable"
  ON public.categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
CREATE POLICY "Authenticated users can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
CREATE POLICY "Authenticated users can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;
CREATE POLICY "Authenticated users can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Update menu_items policies for authenticated users
DROP POLICY IF EXISTS "Menu items are publicly readable" ON public.menu_items;
CREATE POLICY "Menu items are publicly readable"
  ON public.menu_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert menu items" ON public.menu_items;
CREATE POLICY "Authenticated users can insert menu items"
  ON public.menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update menu items" ON public.menu_items;
CREATE POLICY "Authenticated users can update menu items"
  ON public.menu_items
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete menu items" ON public.menu_items;
CREATE POLICY "Authenticated users can delete menu items"
  ON public.menu_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu images
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
CREATE POLICY "Public can view menu images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
CREATE POLICY "Authenticated users can upload menu images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
CREATE POLICY "Authenticated users can update menu images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;
CREATE POLICY "Authenticated users can delete menu images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-images');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();