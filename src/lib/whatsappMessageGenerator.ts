interface OrderItemExtra {
  name: string;
  price: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  extras?: OrderItemExtra[];
}

interface OrderData {
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string;
  paymentMethod?: string;
  currency?: string;
  decimalPlaces?: number;
  decimalSeparator?: string;
  thousandsSeparator?: string;
  trackingUrl?: string;
}

interface StoreTemplates {
  orderProductTemplate: string;
  orderMessageTemplateDelivery: string;
  orderMessageTemplatePickup: string;
  orderMessageTemplateDigitalMenu: string;
}

type OrderType = 'delivery' | 'pickup' | 'digital_menu';

export const generateWhatsAppMessage = (
  orderData: OrderData,
  templates: StoreTemplates,
  orderType: OrderType = 'delivery'
): string => {
  const {
    orderNumber,
    items,
    totalAmount,
    customerName,
    customerPhone,
    deliveryAddress,
    notes,
    paymentMethod,
    currency = "USD",
    decimalPlaces = 2,
    decimalSeparator = ".",
    thousandsSeparator = ",",
    trackingUrl = "",
  } = orderData;

  // Format price function
  const formatPrice = (price: number): string => {
    const fixedPrice = price.toFixed(decimalPlaces);
    const [integer, decimal] = fixedPrice.split(".");
    
    // Add thousands separator
    const formattedInteger = integer.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thousandsSeparator
    );
    
    return `${currency} ${formattedInteger}${decimalSeparator}${decimal}`;
  };

  // Generate products list
  const productsList = items
    .map((item) => {
      let productText = templates.orderProductTemplate;
      
      // Generate extras text
      const extrasText = item.extras && item.extras.length > 0
        ? item.extras.map(extra => `  + ${extra.name} (${formatPrice(extra.price)})`).join("\n")
        : "";
      
      // Calculate item total price (base price + extras)
      const itemTotal = item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0);
      
      productText = productText.replace(/{product-qty}/g, item.quantity.toString());
      productText = productText.replace(/{product-name}/g, item.name);
      productText = productText.replace(/{product-price}/g, formatPrice(itemTotal));
      productText = productText.replace(/{product-extras}/g, extrasText);
      productText = productText.replace(/{product-note}/g, ""); // Not implemented yet
      
      return productText;
    })
    .join("\n");

  // Generate order date/time
  const orderDateTime = new Date().toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });

  // Select template based on order type
  let templateMessage = templates.orderMessageTemplateDelivery;
  if (orderType === 'pickup') {
    templateMessage = templates.orderMessageTemplatePickup;
  } else if (orderType === 'digital_menu') {
    templateMessage = templates.orderMessageTemplateDigitalMenu;
  }

  // Replace tokens in order message template
  let finalMessage = templateMessage;
  
  finalMessage = finalMessage.replace(/{order-number}/g, orderNumber);
  finalMessage = finalMessage.replace(/{order-date-time}/g, orderDateTime);
  finalMessage = finalMessage.replace(/{order-products}/g, productsList);
  finalMessage = finalMessage.replace(/{order-total}/g, formatPrice(totalAmount));
  finalMessage = finalMessage.replace(/{customer-name}/g, customerName);
  finalMessage = finalMessage.replace(/{customer-phone}/g, customerPhone);
  finalMessage = finalMessage.replace(/{customer-address}/g, deliveryAddress);
  finalMessage = finalMessage.replace(/{payment-method}/g, paymentMethod || "N/A");
  finalMessage = finalMessage.replace(/{order-coupon-code}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{order-table}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{order-track-page}/g, trackingUrl);
  finalMessage = finalMessage.replace(/{payment-type}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{payment-status}/g, "Pendiente");
  finalMessage = finalMessage.replace(/{payment-change}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{payment-receipt-link}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{customer-address-number}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{customer-address-complement}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{customer-address-neighborhood}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{customer-address-zipcode}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{shipping-price}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{shipping-price-bolivares}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{order-total-bolivares}/g, ""); // Not implemented
  finalMessage = finalMessage.replace(/{order-subtotal-bolivares}/g, ""); // Not implemented

  // Add notes if present
  if (notes) {
    finalMessage += `\n\nNotas: ${notes}`;
  }

  return finalMessage.trim();
};

export const redirectToWhatsApp = (phoneNumber: string, message: string) => {
  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanPhone = phoneNumber.replace(/[\s\-()]/g, "");
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  
  // Open in new window
  window.open(whatsappUrl, "_blank");
};
