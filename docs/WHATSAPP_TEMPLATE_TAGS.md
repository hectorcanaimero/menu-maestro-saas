# Etiquetas de Templates de WhatsApp

Este documento describe todas las etiquetas disponibles para personalizar los mensajes de WhatsApp en PideAI.

## Etiquetas de Orden

| Etiqueta | Descripción | Ejemplo |
|----------|-------------|---------|
| `{order-number}` | Número de la orden | F700CD7C |
| `{order-date-time}` | Fecha y hora de la orden | 20/12/2024, 15:30 |
| `{order-products}` | Lista de productos (usa template de producto) | Ver sección de productos |
| `{order-total}` | Total de la orden en USD | USD 44,98 |
| `{order-track-page}` | URL de rastreo de la orden | https://pideai.com/track/... |
| `{order-table}` | Número de mesa (para pedidos en mesa) | Mesa 5 |
| `{order-coupon-code}` | Código de cupón aplicado | DESCUENTO10 |
| `{order-coupon-discount}` | Descuento del cupón | -USD 5,00 |

## Etiquetas de Cliente

| Etiqueta | Descripción | Ejemplo |
|----------|-------------|---------|
| `{customer-name}` | Nombre del cliente | Miguel |
| `{customer-phone}` | Teléfono del cliente | +58 (424) 314-8415 |
| `{customer-address}` | Dirección completa | Av paseo caroni, 167, Casa q, Las delicias |

## Etiquetas de Pago

| Etiqueta | Descripción | Ejemplo |
|----------|-------------|---------|
| `{payment-method}` | Método de pago | Pago Móvil |
| `{payment-status}` | Estado del pago | Pendiente |
| `{payment-receipt-link}` | **NUEVO** - Link del comprobante de pago | https://storage.supabase.co/... |
| `{payment_proof_link}` | **NUEVO** - Alias de payment-receipt-link | https://storage.supabase.co/... |

## Etiquetas de Delivery

| Etiqueta | Descripción | Ejemplo |
|----------|-------------|---------|
| `{shipping-price}` | Costo del delivery en USD | USD 5,00 |
| `{shipping-price-bolivares}` | **NUEVO** - Costo del delivery en BSF | Bs. 175,00 |
| `{total_delivery_bsf}` | **NUEVO** - Alias de shipping-price-bolivares | Bs. 175,00 |

## Etiquetas de Conversión a Bolívares

| Etiqueta | Descripción | Ejemplo |
|----------|-------------|---------|
| `{order-total-bolivares}` | **NUEVO** - Total de la orden en BSF | Bs. 1.574,30 |
| `{order-subtotal-bolivares}` | **NUEVO** - Subtotal de productos en BSF | Bs. 1.399,30 |
| `{total_order_bsf}` | **NUEVO** - Alias de order-total-bolivares | Bs. 1.574,30 |
| `{total_products_bsf}` | **NUEVO** - Alias de order-subtotal-bolivares | Bs. 1.399,30 |

## Etiquetas de Rastreo

| Etiqueta | Descripción | Ejemplo |
|----------|-------------|---------|
| `{tracking_link}` | **NUEVO** - Link de rastreo de orden | https://pideai.com/track/... |

## Template de Producto

El template de producto (`orderProductTemplate`) soporta las siguientes etiquetas:

| Etiqueta | Descripción | Ejemplo |
|----------|-------------|---------|
| `{product-qty}` | Cantidad del producto | 2 |
| `{product-name}` | Nombre del producto | Perrito Caliente |
| `{product-price}` | Precio unitario del producto | USD 34,99 |
| `{product-extras}` | Lista de extras del producto | + Queso (USD 2,00) |
| `{product-note}` | Nota del producto | Sin cebolla |

## Ejemplo de Template Completo

```
===== Orden {order-number} =====

{order-products}

Costo Delivery: {shipping-price}
Total a pagar: {order-total}
Total a pagar en Bolívares: {order-total-bolivares}

Método de Pago: {payment-method}
Comprobante de pago: {payment-receipt-link}

===== Cliente =====
{customer-name}
{customer-phone}
{customer-address}

===== Rastreo de Ordenes =====
{tracking_link}
```

## Resultado del Ejemplo

```
===== Orden F700CD7C =====

1 Perrito Caliente
Precio: USD 34,99

1 Cheesecake de Frutos Rojos
Precio: USD 9,99

Costo Delivery: USD 5,00
Total a pagar: USD 49,98
Total a pagar en Bolívares: Bs. 1.749,30

Método de Pago: Pago Móvil
Comprobante de pago: https://storage.supabase.co/payment-proof/abc123.jpg

===== Cliente =====
Miguel
+58 (424) 314-8415
Av paseo caroni, 167, Casa q, Las delicias

===== Rastreo de Ordenes =====
https://tienda.pideai.com/track/F700CD7C
```

## Notas Importantes

1. **Tasa de Cambio**: Para que las conversiones a bolívares funcionen, se debe proporcionar el parámetro `exchangeRate` al generar el mensaje.

2. **Formato de Bolívares**: El formato de BSF utiliza punto (.) como separador de miles y coma (,) como separador decimal: `Bs. 1.749,30`

3. **Formato de USD**: El formato de USD utiliza coma (,) como separador de miles y punto (.) como separador decimal: `USD 1,749.30`

4. **Compatibilidad**: Las etiquetas con guión bajo (`_`) son alias para mantener compatibilidad con templates antiguos.

5. **URLs Opcionales**: Si no se proporcionan URLs (comprobante de pago o tracking), las etiquetas mostrarán una cadena vacía.
