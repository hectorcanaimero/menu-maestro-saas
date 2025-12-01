-- =====================================================
-- Migration: Insert Development Store "totus"
-- Purpose: Create default development store for local testing
-- Date: 2025-11-30
-- =====================================================
--
-- IMPORTANT: This migration is for DEVELOPMENT ONLY
-- In production, you should either:
-- 1. Skip this migration entirely
-- 2. Delete the 'totus' store after deployment
-- 3. Update owner_id to a real user
--
-- =====================================================

-- Insert development store "totus" only if it doesn't exist
-- This store is used for local development (localhost)
INSERT INTO public.stores (
  id,
  subdomain,
  name,
  owner_id,
  description,
  logo_url,
  banner_url,
  phone,
  email,
  address,
  is_active,
  operating_modes,
  force_status,
  currency,
  decimal_places,
  decimal_separator,
  thousands_separator,
  accept_cash,
  payment_on_delivery,
  require_payment_proof,
  minimum_order_price,
  redirect_to_whatsapp,
  order_product_template,
  order_message_template_delivery,
  order_message_template_pickup,
  order_message_template_digital_menu,
  estimated_delivery_time,
  skip_payment_digital_menu,
  delivery_price_mode,
  fixed_delivery_price,
  remove_zipcode,
  remove_address_number,
  enable_audio_notifications,
  notification_volume,
  notification_repeat_count,
  primary_color,
  price_color,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, -- Fixed UUID for development
  'totus', -- subdomain
  'Totus - Tienda de Desarrollo', -- name
  '00000000-0000-0000-0000-000000000000'::uuid, -- owner_id (development user)
  'Tienda de desarrollo para pruebas locales. Esta tienda se utiliza automáticamente cuando se ejecuta la aplicación en modo desarrollo (localhost).', -- description
  NULL, -- logo_url
  NULL, -- banner_url
  '+58 412 1234567', -- phone
  'dev@totus.local', -- email
  'Caracas, Venezuela', -- address
  true, -- is_active
  ARRAY['delivery', 'pickup', 'digital_menu']::public.operating_mode[], -- operating_modes
  'normal'::public.force_status, -- force_status
  'USD', -- currency
  2, -- decimal_places
  ',', -- decimal_separator
  '.', -- thousands_separator
  true, -- accept_cash
  'Pago Movil,Zelle', -- payment_on_delivery
  false, -- require_payment_proof
  0, -- minimum_order_price
  false, -- redirect_to_whatsapp (disabled for dev)
  '{product-qty} {product-name}
{product-extras}
Nota: {product-note}', -- order_product_template
  '===== Orden {order-number} =====

{order-products}
Entrega: {shipping-price}
Order Total: {order-total}
Método de Pago: {payment-method}
Cambiar: {payment-change}

===== Cliente =====

{customer-name}
{customer-phone}
{customer-address}, {customer-address-number}
{customer-address-complement}
{customer-address-neighborhood}
{customer-address-zipcode}

===== Rastreo de Ordenes =====

{order-track-page}', -- order_message_template_delivery
  '===== Orden {order-number} =====

{order-products}
Order Total: {order-total}
Método de Pago: {payment-method}

===== Cliente =====

{customer-name}
{customer-phone}', -- order_message_template_pickup
  '===== Orden {order-number} =====

{order-products}
Mesa: {order-table}
Order Total: {order-total}', -- order_message_template_digital_menu
  '30-45 minutos', -- estimated_delivery_time
  false, -- skip_payment_digital_menu
  'fixed', -- delivery_price_mode
  5.00, -- fixed_delivery_price
  false, -- remove_zipcode
  false, -- remove_address_number
  true, -- enable_audio_notifications
  80, -- notification_volume
  3, -- notification_repeat_count
  '#FF6B6B', -- primary_color (red)
  '#4ECDC4', -- price_color (teal)
  NOW(), -- created_at
  NOW() -- updated_at
)
ON CONFLICT (subdomain) DO UPDATE SET
  -- Update only if the store exists but is inactive or outdated
  is_active = EXCLUDED.is_active,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  operating_modes = EXCLUDED.operating_modes,
  updated_at = NOW();

-- Insert some development categories for the totus store
INSERT INTO public.categories (
  store_id,
  name,
  description,
  display_order,
  is_active
) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Entradas', 'Aperitivos y entradas para comenzar', 1, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Platos Principales', 'Nuestros platos principales', 2, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Bebidas', 'Bebidas frías y calientes', 3, true),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Postres', 'Dulces y postres', 4, true)
ON CONFLICT DO NOTHING;

-- Insert sample menu items for development
INSERT INTO public.menu_items (
  store_id,
  category_id,
  name,
  description,
  price,
  image_url,
  is_available,
  display_order
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  c.id,
  'Producto de Ejemplo ' || c.name,
  'Este es un producto de ejemplo para desarrollo y pruebas.',
  9.99,
  NULL,
  true,
  1
FROM public.categories c
WHERE c.store_id = '00000000-0000-0000-0000-000000000001'::uuid
ON CONFLICT DO NOTHING;

-- Insert default store hours (Mon-Fri: 9:00-18:00, Sat: 10:00-14:00)
INSERT INTO public.store_hours (
  store_id,
  day_of_week,
  open_time,
  close_time
) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 1, '09:00:00', '18:00:00'), -- Monday
  ('00000000-0000-0000-0000-000000000001'::uuid, 2, '09:00:00', '18:00:00'), -- Tuesday
  ('00000000-0000-0000-0000-000000000001'::uuid, 3, '09:00:00', '18:00:00'), -- Wednesday
  ('00000000-0000-0000-0000-000000000001'::uuid, 4, '09:00:00', '18:00:00'), -- Thursday
  ('00000000-0000-0000-0000-000000000001'::uuid, 5, '09:00:00', '18:00:00'), -- Friday
  ('00000000-0000-0000-0000-000000000001'::uuid, 6, '10:00:00', '14:00:00')  -- Saturday
ON CONFLICT DO NOTHING;

-- Create a development user account (if using Supabase Auth)
-- Note: This is a comment because user creation should be done via Supabase Auth API
-- The owner_id '00000000-0000-0000-0000-000000000000' is a placeholder
-- In real usage, you should create a user via Supabase Dashboard or Auth API
-- and update the owner_id accordingly

-- =====================================================
-- IMPORTANT NOTES FOR DEVELOPERS
-- =====================================================
--
-- 1. This migration creates a development store with subdomain "totus"
-- 2. The store owner_id is a placeholder UUID (all zeros)
-- 3. To access admin features in development:
--    - Create a user via Supabase Auth
--    - Update the owner_id to your user's UUID:
--      UPDATE stores SET owner_id = 'YOUR-USER-UUID' WHERE subdomain = 'totus';
-- 4. The store is configured with all operating modes enabled
-- 5. Sample categories and menu items are included for testing
-- 6. Default store hours are Monday-Friday 9am-6pm, Saturday 10am-2pm
--
-- =====================================================

COMMENT ON TABLE public.stores IS 'Multi-tenant stores table. Each store is identified by a unique subdomain.';
