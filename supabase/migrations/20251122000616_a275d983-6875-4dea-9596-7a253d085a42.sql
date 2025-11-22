-- Add order configuration columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS minimum_order_price numeric,
ADD COLUMN IF NOT EXISTS redirect_to_whatsapp boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS order_product_template text DEFAULT '{product-qty} {product-name}
{product-extras}
Nota: {product-note}',
ADD COLUMN IF NOT EXISTS order_message_template_delivery text DEFAULT '===== Orden {order-number} =====

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

{order-track-page}',
ADD COLUMN IF NOT EXISTS order_message_template_pickup text DEFAULT '===== Orden {order-number} =====

{order-products}
Order Total: {order-total}
Método de Pago: {payment-method}

===== Cliente =====

{customer-name}
{customer-phone}',
ADD COLUMN IF NOT EXISTS order_message_template_digital_menu text DEFAULT '===== Orden {order-number} =====

{order-products}
Mesa: {order-table}
Order Total: {order-total}';