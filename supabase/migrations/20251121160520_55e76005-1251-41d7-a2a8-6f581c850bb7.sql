-- Create categories table for menu organization
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (menu is public)
CREATE POLICY "Categories are publicly readable"
  ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Menu items are publicly readable"
  ON public.menu_items
  FOR SELECT
  USING (true);

-- Insert sample categories
INSERT INTO public.categories (name, description, display_order) VALUES
  ('Entradas', 'Comienza tu experiencia culinaria', 1),
  ('Platos Principales', 'Nuestras especialidades de la casa', 2),
  ('Postres', 'El final perfecto', 3),
  ('Bebidas', 'Refrescantes y deliciosas', 4);

-- Insert sample menu items
INSERT INTO public.menu_items (category_id, name, description, price, display_order) 
SELECT 
  c.id,
  'Ensalada César',
  'Lechuga romana fresca, crutones artesanales, parmesano y nuestra salsa césar especial',
  12.99,
  1
FROM public.categories c WHERE c.name = 'Entradas';

INSERT INTO public.menu_items (category_id, name, description, price, display_order)
SELECT 
  c.id,
  'Carpaccio de Res',
  'Finas láminas de res con rúcula, parmesano y reducción balsámica',
  16.99,
  2
FROM public.categories c WHERE c.name = 'Entradas';

INSERT INTO public.menu_items (category_id, name, description, price, display_order)
SELECT 
  c.id,
  'Filete Mignon',
  'Corte premium 250g con papas al romero y vegetales asados',
  34.99,
  1
FROM public.categories c WHERE c.name = 'Platos Principales';

INSERT INTO public.menu_items (category_id, name, description, price, display_order)
SELECT 
  c.id,
  'Salmón Glaseado',
  'Salmón fresco con glaseado de miel y mostaza, arroz salvaje y espárragos',
  28.99,
  2
FROM public.categories c WHERE c.name = 'Platos Principales';

INSERT INTO public.menu_items (category_id, name, description, price, display_order)
SELECT 
  c.id,
  'Tiramisú Clásico',
  'El postre italiano por excelencia con café y mascarpone',
  8.99,
  1
FROM public.categories c WHERE c.name = 'Postres';

INSERT INTO public.menu_items (category_id, name, description, price, display_order)
SELECT 
  c.id,
  'Cheesecake de Frutos Rojos',
  'Cremoso cheesecake con salsa de frutos rojos del bosque',
  9.99,
  2
FROM public.categories c WHERE c.name = 'Postres';