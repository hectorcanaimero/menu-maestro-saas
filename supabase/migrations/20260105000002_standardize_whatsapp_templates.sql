-- Migration: Standardize WhatsApp Message Templates
-- Description: Updates default WhatsApp message templates for all new stores
-- Created: 2026-01-05
-- Issue: PIDEA-103 - Standardize WhatsApp messages for all stores created from scratch
-- Purpose: Ensure consistent messaging across all new stores

-- ============================================================================
-- PART 1: Update default templates for existing stores
-- ============================================================================

-- Template for product display
UPDATE public.stores
SET order_product_template = '{product-qty} {product-name}
{product-extras}
Nota: {product-note}'
WHERE order_product_template IS NULL OR order_product_template = '';

-- Template for DELIVERY orders
UPDATE public.stores
SET order_message_template_delivery = '-- Nuevo Pedido N°{order-number} --

Tipo de Pedido: {order-type}

{order-products}

Costo Delivery: {shipping-price}
Total a pagar: {order-total}
Total a pagar en Bolívares: {order-total-bolivares}

Método de Pago: {payment-method}

{payment-receipt-link}

===== Cliente =====

Nombre del cliente: {customer-name}
Teléfono: {customer-phone}
Dirección de entrega:
{customer-address}, {customer-address-number}
{customer-address-complement}
{customer-address-neighborhood}
{customer-address-zipcode}

===== Rastreo de Ordenes =====

{order-track-page}'
WHERE order_message_template_delivery IS NULL OR order_message_template_delivery = '';

-- Template for PICKUP orders
UPDATE public.stores
SET order_message_template_pickup = '-- Nuevo Pedido N°{order-number} --

Tipo de Pedido: {order-type}

{order-products}

Total a pagar: {order-total}
Total a pagar en Bolívares: {order-total-bolivares}

Método de Pago: {payment-method}

{payment-receipt-link}

===== Cliente =====

Nombre del cliente: {customer-name}
Teléfono: {customer-phone}

===== Rastreo de Ordenes =====

{order-track-page}'
WHERE order_message_template_pickup IS NULL OR order_message_template_pickup = '';

-- Template for DINE-IN orders (digital menu / eat in place)
UPDATE public.stores
SET order_message_template_digital_menu = '-- Nueva Orden N°{order-number} --

{order-products}

Mesa: {order-table}
Total a pagar: {order-total}
Total a pagar en Bolívares: {order-total-bolivares}'
WHERE order_message_template_digital_menu IS NULL OR order_message_template_digital_menu = '';

-- ============================================================================
-- PART 2: Create function to set default templates for new stores
-- ============================================================================

-- Function to initialize default WhatsApp templates when a store is created
CREATE OR REPLACE FUNCTION public.set_default_whatsapp_templates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set templates if they are NULL (new stores)
  IF NEW.order_product_template IS NULL THEN
    NEW.order_product_template := '{product-qty} {product-name}
{product-extras}
Nota: {product-note}';
  END IF;

  IF NEW.order_message_template_delivery IS NULL THEN
    NEW.order_message_template_delivery := '-- Nuevo Pedido N°{order-number} --

Tipo de Pedido: {order-type}

{order-products}

Costo Delivery: {shipping-price}
Total a pagar: {order-total}
Total a pagar en Bolívares: {order-total-bolivares}

Método de Pago: {payment-method}

{payment-receipt-link}

===== Cliente =====

Nombre del cliente: {customer-name}
Teléfono: {customer-phone}
Dirección de entrega:
{customer-address}, {customer-address-number}
{customer-address-complement}
{customer-address-neighborhood}
{customer-address-zipcode}

===== Rastreo de Ordenes =====

{order-track-page}';
  END IF;

  IF NEW.order_message_template_pickup IS NULL THEN
    NEW.order_message_template_pickup := '-- Nuevo Pedido N°{order-number} --

Tipo de Pedido: {order-type}

{order-products}

Total a pagar: {order-total}
Total a pagar en Bolívares: {order-total-bolivares}

Método de Pago: {payment-method}

{payment-receipt-link}

===== Cliente =====

Nombre del cliente: {customer-name}
Teléfono: {customer-phone}

===== Rastreo de Ordenes =====

{order-track-page}';
  END IF;

  IF NEW.order_message_template_digital_menu IS NULL THEN
    NEW.order_message_template_digital_menu := '-- Nueva Orden N°{order-number} --

{order-products}

Mesa: {order-table}
Total a pagar: {order-total}
Total a pagar en Bolívares: {order-total-bolivares}';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_default_whatsapp_templates() IS
'Automatically sets standardized WhatsApp message templates when a new store is created. Ensures consistent messaging across all stores.';

-- ============================================================================
-- PART 3: Create trigger to set templates on new stores
-- ============================================================================

DROP TRIGGER IF EXISTS set_whatsapp_templates_on_store_creation ON public.stores;

CREATE TRIGGER set_whatsapp_templates_on_store_creation
BEFORE INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.set_default_whatsapp_templates();

COMMENT ON TRIGGER set_whatsapp_templates_on_store_creation ON public.stores IS
'Trigger that automatically sets standardized WhatsApp templates for new stores. Implements PIDEA-103 requirements.';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification:
-- 1. Check if trigger exists:
--    SELECT tgname, tgtype, tgenabled FROM pg_trigger WHERE tgname = 'set_whatsapp_templates_on_store_creation';
--
-- 2. Verify templates are set for existing stores:
--    SELECT subdomain,
--           SUBSTRING(order_message_template_delivery, 1, 50) as delivery_preview,
--           SUBSTRING(order_message_template_pickup, 1, 50) as pickup_preview,
--           SUBSTRING(order_message_template_digital_menu, 1, 50) as dine_in_preview
--    FROM stores
--    ORDER BY created_at DESC;
--
-- 3. Test by creating a new store and checking if templates are set automatically
