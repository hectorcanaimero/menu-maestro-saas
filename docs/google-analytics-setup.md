# Google Analytics 4 Integration Guide

## Overview

This project has Google Analytics 4 (GA4) integrated alongside PostHog for comprehensive analytics tracking.

## Setup Instructions

### 1. Get Your GA4 Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property or use an existing one
3. Navigate to **Admin** → **Data Streams** → Select your web stream
4. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variables

Add your Measurement ID to your `.env` file:

```bash
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important:** Replace `G-XXXXXXXXXX` with your actual Measurement ID.

### 3. Verify Installation

1. Start the development server: `npm run dev`
2. Open your browser console
3. Look for the message: `✅ Google Analytics initialized`
4. Visit a few pages in your app
5. Check Google Analytics Real-Time reports to see your activity

## Features

### Automatic Page View Tracking

Page views are automatically tracked on every route change using the `useGoogleAnalytics` hook.

### Available Event Tracking Methods

The `useGoogleAnalytics` hook provides these methods:

#### General Events
```typescript
const { trackEvent } = useGoogleAnalytics();

trackEvent('category', 'action', 'label', value);
// Example:
trackEvent('navigation', 'menu_click', 'home_button');
```

#### E-commerce Events

**Add to Cart**
```typescript
const { trackAddToCart } = useGoogleAnalytics();

trackAddToCart(itemId, itemName, price);
```

**Remove from Cart**
```typescript
const { trackRemoveFromCart } = useGoogleAnalytics();

trackRemoveFromCart(itemId, itemName, price);
```

**View Item**
```typescript
const { trackViewItem } = useGoogleAnalytics();

trackViewItem(itemId, itemName, price, category);
```

**Begin Checkout**
```typescript
const { trackBeginCheckout } = useGoogleAnalytics();

const items = [
  { id: '1', name: 'Pizza', price: 15.99 },
  { id: '2', name: 'Burger', price: 10.99 }
];
trackBeginCheckout(26.98, items);
```

**Purchase**
```typescript
const { trackPurchase } = useGoogleAnalytics();

trackPurchase(transactionId, totalValue, currency);
```

#### User Identification

**Set User ID**
```typescript
const { setUserId } = useGoogleAnalytics();

setUserId(userId);
```

**Set User Properties**
```typescript
const { setUserProperties } = useGoogleAnalytics();

setUserProperties({
  user_type: 'store_owner',
  subscription_tier: 'premium'
});
```

## Usage Examples

### Track Product View (Product Detail Page)

```typescript
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

const ProductDetail = () => {
  const { trackViewItem } = useGoogleAnalytics();

  useEffect(() => {
    if (product) {
      trackViewItem(
        product.id,
        product.name,
        product.price,
        product.category_name
      );
    }
  }, [product]);

  return <div>Product Details</div>;
};
```

### Track Add to Cart (Cart Context)

```typescript
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

const CartContext = () => {
  const { trackAddToCart } = useGoogleAnalytics();

  const addToCart = (item) => {
    // Add item to cart
    setCart([...cart, item]);

    // Track event
    trackAddToCart(item.id, item.name, item.price);
  };
};
```

### Track Checkout (Checkout Page)

```typescript
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

const Checkout = () => {
  const { trackBeginCheckout } = useGoogleAnalytics();

  useEffect(() => {
    if (cartItems.length > 0) {
      const items = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price
      }));

      const total = cartItems.reduce((sum, item) => sum + item.price, 0);

      trackBeginCheckout(total, items);
    }
  }, [cartItems]);
};
```

### Track Purchase (Order Confirmation)

```typescript
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

const ConfirmOrder = () => {
  const { trackPurchase } = useGoogleAnalytics();

  useEffect(() => {
    if (order) {
      trackPurchase(
        order.id,
        order.total_amount,
        order.currency || 'USD'
      );
    }
  }, [order]);
};
```

## Privacy & GDPR Compliance

This integration includes privacy-focused settings:

- ✅ **IP Anonymization**: Enabled by default
- ✅ **No Google Signals**: Advertising features disabled
- ✅ **No Ad Personalization**: Ad personalization disabled
- ✅ **Secure Cookies**: SameSite and Secure flags enabled
- ✅ **Manual Page Views**: Controlled page view tracking

## Multi-Tenant Tracking

The integration works seamlessly with the multi-tenant architecture:

- Each store's subdomain is tracked
- Page paths include the full route
- Events can include store-specific properties

**Example: Track store-specific events**
```typescript
const { trackEvent } = useGoogleAnalytics();

// Track which store a user is viewing
trackEvent('store', 'view', storeSubdomain);
```

## Testing

### Development Mode
- GA4 is initialized even in development
- Console logs show initialization status
- Test events appear in GA4 Real-Time reports

### Production Mode
- All events are tracked normally
- No console logs
- Check GA4 Real-Time and standard reports

## Troubleshooting

### GA4 Not Tracking

1. **Check Measurement ID**: Ensure `VITE_GA4_MEASUREMENT_ID` is set correctly
2. **Rebuild**: Run `npm run build` after adding environment variables
3. **Browser Extensions**: Disable ad blockers that might block GA4
4. **Console Errors**: Check browser console for errors

### Events Not Showing

1. **Real-Time Reports**: Wait 1-2 minutes for events to appear
2. **Debug View**: Enable Debug Mode in GA4 for detailed event logs
3. **Verify Hook Usage**: Ensure `useGoogleAnalytics()` is called in component

## Coexistence with PostHog

Both PostHog and GA4 run simultaneously:

- **PostHog**: Automatic event capture, session recording, feature flags
- **GA4**: Standard web analytics, e-commerce tracking, Google integration

Each serves different purposes and can be used together without conflicts.

## Resources

- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [react-ga4 Documentation](https://github.com/codler/react-ga4)
- [GA4 E-commerce Events](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
