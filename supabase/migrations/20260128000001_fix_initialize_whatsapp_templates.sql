-- ============================================================================
-- Migration: Fix initialize_whatsapp_templates to include ALL template types
-- Description: Updates the function to create all 8 templates instead of just 4
-- Created: 2026-01-28
-- Issue: When a store upgrades from free to pro plan, only 3-4 templates are
--        created instead of all 8 templates (including order status templates)
-- ============================================================================

-- ============================================================================
-- Update the initialize_whatsapp_templates function to include ALL templates
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initialize_whatsapp_templates(p_store_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- ========================================================================
  -- BASIC TEMPLATES (original 4)
  -- ========================================================================

  -- 1. Order Confirmation Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
  VALUES (
    p_store_id,
    'order_confirmation',
    'Confirmación de Pedido',
    E'Hola {customer_name},\n\n✅ CONFIRMADO\n\nTu pedido #{order_number} ha sido confirmado.\n\nTipo de pedido: {order_type}\nMonto total: {order_total}\n\nTe avisaremos cuando esté listo.\n\n¡Gracias por tu preferencia!',
    true
  ) ON CONFLICT (store_id, template_type) DO NOTHING;

  -- 2. Order Ready Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
  VALUES (
    p_store_id,
    'order_ready',
    'Pedido Listo',
    E'Hola {customer_name},\n\n🎉 LISTO\n\nTu pedido #{order_number} está listo.\n\nPuedes pasar a recogerlo cuando gustes.\n\n¡Gracias por tu preferencia!',
    true
  ) ON CONFLICT (store_id, template_type) DO NOTHING;

  -- 3. Abandoned Cart Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
  VALUES (
    p_store_id,
    'abandoned_cart',
    'Carrito Abandonado',
    E'¡Hola {customer_name}! 👋\n\nNotamos que dejaste algunos productos en tu carrito de {store_name}.\n\n🛒 Total: {cart_total}\n\n¿Necesitas ayuda para completar tu pedido?\nHaz clic aquí para continuar: {recovery_link}',
    true
  ) ON CONFLICT (store_id, template_type) DO NOTHING;

  -- 4. Promotion Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
  VALUES (
    p_store_id,
    'promotion',
    'Promoción General',
    E'¡Hola {customer_name}! 🎁\n\n{promotion_message}\n\nVisítanos en: {store_link}\n\n{store_name}',
    true
  ) ON CONFLICT (store_id, template_type) DO NOTHING;

  -- ========================================================================
  -- ORDER STATUS TEMPLATES (added in 20260112 migration, but missing from function)
  -- ========================================================================

  -- 5. Order Preparing Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
  VALUES (
    p_store_id,
    'order_preparing',
    'Pedido en Preparación',
    E'Hola {customer_name},\n\n✅ Tu pedido #{order_number} está siendo preparado.\n\nTe avisaremos cuando esté listo.\n\n¡Gracias por tu preferencia!',
    true
  ) ON CONFLICT (store_id, template_type) DO NOTHING;

  -- 6. Order Out for Delivery Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
  VALUES (
    p_store_id,
    'order_out_for_delivery',
    'Pedido en Camino',
    E'Hola {customer_name},\n\n🚗 Tu pedido #{order_number} está en camino a:\n{delivery_address}\n\nPronto lo recibirás.\n\n¡Gracias por tu preferencia!',
    true
  ) ON CONFLICT (store_id, template_type) DO NOTHING;

  -- 7. Order Delivered Template
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
  VALUES (
    p_store_id,
    'order_delivered',
    'Pedido Entregado',
    E'Hola {customer_name},\n\n🎉 Tu pedido #{order_number} ha sido entregado exitosamente.\n\nEsperamos que disfrutes tu pedido.\n\n¡Gracias por tu preferencia!',
    true
  ) ON CONFLICT (store_id, template_type) DO NOTHING;

  -- 8. Order Cancelled Template (disabled by default)
  INSERT INTO public.whatsapp_message_templates (store_id, template_type, template_name, message_body, is_active)
  VALUES (
    p_store_id,
    'order_cancelled',
    'Pedido Cancelado',
    E'Hola {customer_name},\n\nTu pedido #{order_number} ha sido cancelado.\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\nTotal del pedido: {order_total}',
    false  -- Disabled by default as per original migration
  ) ON CONFLICT (store_id, template_type) DO NOTHING;

END;
$$;

-- ============================================================================
-- Update function comment
-- ============================================================================

COMMENT ON FUNCTION public.initialize_whatsapp_templates(UUID) IS
'Initialize all 8 WhatsApp message templates for a store (4 basic + 4 order status templates)';

-- ============================================================================
-- Backfill missing templates for existing stores
-- ============================================================================

-- Run the updated function for all existing stores to ensure they have all templates
DO $$
DECLARE
  v_store RECORD;
  v_template_count INTEGER;
BEGIN
  FOR v_store IN SELECT id FROM stores
  LOOP
    -- Check how many templates the store currently has
    SELECT COUNT(*) INTO v_template_count
    FROM whatsapp_message_templates
    WHERE store_id = v_store.id;

    -- If the store has fewer than 8 templates, run the initialization
    IF v_template_count < 8 THEN
      PERFORM initialize_whatsapp_templates(v_store.id);
      RAISE NOTICE 'Backfilled templates for store %. Had % templates, now has all 8.',
        v_store.id, v_template_count;
    END IF;
  END LOOP;

  RAISE NOTICE 'Template backfill complete. All stores now have 8 WhatsApp templates.';
END $$;

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Run this to verify all stores now have 8 templates:
--
-- SELECT
--   s.id as store_id,
--   s.name as store_name,
--   COUNT(wmt.id) as template_count,
--   ARRAY_AGG(wmt.template_type ORDER BY wmt.template_type) as templates
-- FROM stores s
-- LEFT JOIN whatsapp_message_templates wmt ON wmt.store_id = s.id
-- GROUP BY s.id, s.name
-- ORDER BY template_count ASC, s.name;
--
-- Expected template_count: 8 for all stores
-- Expected templates: {abandoned_cart, order_cancelled, order_confirmation,
--                      order_delivered, order_out_for_delivery, order_preparing,
--                      order_ready, promotion}
