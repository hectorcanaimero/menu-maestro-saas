/**
 * Order Service
 *
 * Handles all order-related business logic including:
 * - Order creation
 * - Order items management
 * - Order extras management
 * - WhatsApp integration
 */

import { supabase } from '@/integrations/supabase/client';
import { recordCouponUsage } from '@/hooks/useCoupons';
import { generateWhatsAppMessage, redirectToWhatsApp } from '@/lib/whatsappMessageGenerator';
import { getLatestExchangeRate } from '@/lib/bcv-fetcher';
import type { CartItem } from '@/contexts/CartContext';
import type { Store } from '@/contexts/StoreContext';

export type { CartItem, Store };

export interface OrderData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_zipcode?: string;
  table_number?: string;
  notes?: string;
  payment_method?: string;
  order_type: 'delivery' | 'pickup' | 'digital_menu';
  payment_proof_url?: string;
  country?: string;
  delivery_price?: number;
  coupon_code?: string;
  coupon_discount?: number;
  coupon_id?: string;
}

export interface CreateOrderParams {
  orderData: OrderData;
  customerId: string;
  storeId: string;
  grandTotal: number;
  deliveryPrice: number;
  couponDiscount: number;
  store: Store;
}

export interface CreateOrderItemsParams {
  orderId: string;
  items: CartItem[];
}

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  shouldRedirectToWhatsApp?: boolean;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

/**
 * Build full delivery address from order data
 */
export function buildFullAddress(orderData: OrderData, store: Store): string | null {
  if (orderData.order_type !== 'delivery') {
    return null;
  }

  const addressParts = [orderData.delivery_address || ''];

  if (!store?.remove_address_number && orderData.address_number) {
    addressParts.push(orderData.address_number);
  }

  if (orderData.address_complement) {
    addressParts.push(orderData.address_complement);
  }

  if (orderData.address_neighborhood) {
    addressParts.push(orderData.address_neighborhood);
  }

  if (!store?.remove_zipcode && orderData.address_zipcode) {
    addressParts.push(orderData.address_zipcode);
  }

  return addressParts.filter(Boolean).join(', ');
}

/**
 * Build order notes including table number for digital menu orders
 */
export function buildOrderNotes(orderData: OrderData): string | null {
  if (orderData.order_type === 'digital_menu' && orderData.table_number) {
    return `Mesa: ${orderData.table_number}${orderData.notes ? `\n${orderData.notes}` : ''}`;
  }

  return orderData.notes || null;
}

/**
 * Create an order in the database
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { orderData, customerId, storeId, grandTotal, deliveryPrice, couponDiscount, store } = params;

  // Get current session
  const { data: { session } } = await supabase.auth.getSession();

  // Build address
  const fullAddress = buildFullAddress(orderData, store);

  // Build notes
  const notes = buildOrderNotes(orderData);

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        store_id: storeId,
        user_id: session?.user?.id || null,
        customer_id: customerId,
        total_amount: grandTotal,
        delivery_price: deliveryPrice,
        coupon_code: orderData.coupon_code || null,
        coupon_discount: couponDiscount,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        delivery_address: fullAddress,
        notes: notes,
        payment_proof_url: orderData.payment_proof_url || null,
        payment_method: orderData.payment_method || null,
        order_type: orderData.order_type,
      },
    ])
    .select()
    .single();

  if (orderError) throw orderError;

  // Record coupon usage if applied
  if (orderData.coupon_id && couponDiscount > 0) {
    try {
      await recordCouponUsage(
        orderData.coupon_id,
        storeId,
        orderData.customer_email,
        order.id,
        couponDiscount
      );
    } catch (couponError) {
      console.error('Error recording coupon usage:', couponError);
      // Don't fail the order if coupon recording fails
    }
  }

  return {
    orderId: order.id,
    orderNumber: order.id.slice(0, 8).toUpperCase(),
  };
}

/**
 * Create order items for an order
 */
export async function createOrderItems(params: CreateOrderItemsParams): Promise<void> {
  const { orderId, items } = params;

  // Create order items
  const orderItems = items.map((item) => ({
    order_id: orderId,
    menu_item_id: item.id,
    quantity: item.quantity,
    price_at_time: item.price,
    item_name: item.name,
  }));

  const { data: createdItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (itemsError) throw itemsError;

  // Create order item extras
  if (createdItems) {
    const itemExtras = createdItems.flatMap((orderItem, index) => {
      const cartItem = items[index];
      if (!cartItem.extras || cartItem.extras.length === 0) return [];

      return cartItem.extras.map((extra: { name: string; price: number }) => ({
        order_item_id: orderItem.id,
        extra_name: extra.name,
        extra_price: extra.price,
      }));
    });

    if (itemExtras.length > 0) {
      const { error: extrasError } = await supabase
        .from('order_item_extras')
        .insert(itemExtras);

      if (extrasError) throw extrasError;
    }
  }
}

/**
 * Prepare WhatsApp redirect data for order
 */
export async function prepareWhatsAppRedirect(
  orderId: string,
  orderType: string,
  store: Store
): Promise<{ shouldRedirect: boolean; phoneNumber?: string; message?: string }> {
  // Check if store has phone
  if (!store.phone) {
    return { shouldRedirect: false };
  }

  // Fetch the full order with items for message generation
  const { data: fullOrder } = await supabase
    .from('orders')
    .select(
      `
        *,
        order_items (
          id,
          item_name,
          quantity,
          price_at_time,
          order_item_extras (
            extra_name,
            extra_price
          )
        )
      `
    )
    .eq('id', orderId)
    .single();

  if (!fullOrder || !fullOrder.order_items) {
    return { shouldRedirect: false };
  }

  // Format order items for WhatsApp message generator
  const formattedItems = fullOrder.order_items.map((item: any) => ({
    name: item.item_name,
    quantity: item.quantity,
    price: item.price_at_time,
    extras: item.order_item_extras?.map((extra: any) => ({
      name: extra.extra_name,
      price: extra.extra_price,
    })) || [],
  }));

  // Build WhatsApp message templates from store settings
  const templates = {
    orderProductTemplate: store.order_product_template || '{product-qty}x {product-name} - {product-price}\n{product-extras}',
    orderMessageTemplateDelivery: store.order_message_template_delivery || '🛵 *Nuevo Pedido #{order-number}*\n\n{order-products}\n\n*Total:* {order-total}\n\n*Cliente:* {customer-name}\n*Teléfono:* {customer-phone}\n*Dirección:* {customer-address}',
    orderMessageTemplatePickup: store.order_message_template_pickup || '🏪 *Nuevo Pedido para Recoger #{order-number}*\n\n{order-products}\n\n*Total:* {order-total}\n\n*Cliente:* {customer-name}\n*Teléfono:* {customer-phone}',
    orderMessageTemplateDigitalMenu: store.order_message_template_digital_menu || '📱 *Nuevo Pedido #{order-number}*\n\n{order-products}\n\n*Total:* {order-total}\n\n*Cliente:* {customer-name}\n*Mesa:* {order-table}',
  };

  // Build tracking URL using store subdomain
  let trackingUrl = '';
  if (fullOrder.tracking_code) {
    // Build URL based on environment
    const isDev = import.meta.env.DEV;
    if (isDev) {
      // In development, use localhost with subdomain in path or query param
      trackingUrl = `http://localhost:8080/track/${fullOrder.tracking_code}`;
    } else {
      // In production, use subdomain-based URL
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'pideai.com';
      trackingUrl = `https://${store.subdomain}.${baseUrl}/track/${fullOrder.tracking_code}`;
    }
  }

  // Get exchange rate for bolivar conversion
  let exchangeRate = 0;

  if (store.enable_currency_conversion) {
    if (store.use_manual_exchange_rate && store.manual_usd_ves_rate) {
      // Use manual exchange rate
      exchangeRate = store.manual_usd_ves_rate;
    } else {
      // Fetch automatic exchange rate from database
      const rateData = await getLatestExchangeRate('USD', 'VES', store.id);
      if (rateData) {
        exchangeRate = rateData.rate;
      } else {
        // Fallback to global rate if store-specific rate not found
        const globalRateData = await getLatestExchangeRate('USD', 'VES', null);
        if (globalRateData) {
          exchangeRate = globalRateData.rate;
        }
      }
    }
  }

  // Build order data for message generation
  const orderData = {
    orderNumber: fullOrder.id.slice(0, 8).toUpperCase(),
    items: formattedItems,
    totalAmount: fullOrder.total_amount,
    customerName: fullOrder.customer_name,
    customerEmail: fullOrder.customer_email,
    customerPhone: fullOrder.customer_phone,
    deliveryAddress: fullOrder.delivery_address || '',
    notes: fullOrder.notes || undefined,
    paymentMethod: fullOrder.payment_method || undefined,
    currency: store.currency || 'USD',
    decimalPlaces: store.decimal_places || 2,
    decimalSeparator: store.decimal_separator || '.',
    thousandsSeparator: store.thousands_separator || ',',
    trackingUrl,
    couponCode: fullOrder.coupon_code || undefined,
    couponDiscount: fullOrder.coupon_discount || 0,
    deliveryPrice: fullOrder.delivery_price || 0,
    tableNumber: fullOrder.table_number || undefined,
    exchangeRate,
    paymentProofUrl: fullOrder.payment_proof_url || '',
  };

  // Generate WhatsApp message
  const message = generateWhatsAppMessage(orderData, templates, orderType as 'delivery' | 'pickup' | 'digital_menu');

  return {
    shouldRedirect: true,
    phoneNumber: store.phone,
    message,
  };
}

/**
 * Complete order creation workflow
 *
 * This is the main function that orchestrates the entire order creation process
 */
export async function completeOrder(
  orderData: OrderData,
  customerId: string,
  items: CartItem[],
  grandTotal: number,
  deliveryPrice: number,
  couponDiscount: number,
  store: Store
): Promise<CreateOrderResult> {
  // Create the order
  const result = await createOrder({
    orderData,
    customerId,
    storeId: store.id,
    grandTotal,
    deliveryPrice,
    couponDiscount,
    store,
  });

  // Create order items and extras
  await createOrderItems({
    orderId: result.orderId,
    items,
  });

  // Prepare WhatsApp redirect if configured
  const whatsappData = await prepareWhatsAppRedirect(
    result.orderId,
    orderData.order_type,
    store
  );

  return {
    ...result,
    shouldRedirectToWhatsApp: whatsappData.shouldRedirect,
    whatsappNumber: whatsappData.phoneNumber,
    whatsappMessage: whatsappData.message,
  };
}