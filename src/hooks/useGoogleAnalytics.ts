import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

/**
 * Google Analytics 4 hook for tracking page views and events
 * Automatically tracks page views on route changes
 * Provides methods for custom event tracking
 */
export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.send({
        hitType: 'pageview',
        page: location.pathname + location.search,
        title: document.title,
      });
    }
  }, [location]);

  // Custom event tracking methods
  const trackEvent = (category: string, action: string, label?: string, value?: number) => {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.event({
        category,
        action,
        label,
        value,
      });
    }
  };

  const trackPurchase = (transactionId: string, value: number, currency: string = 'USD') => {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.event('purchase', {
        transaction_id: transactionId,
        value,
        currency,
      });
    }
  };

  const trackAddToCart = (itemId: string, itemName: string, price: number) => {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.event('add_to_cart', {
        currency: 'USD',
        value: price,
        items: [
          {
            item_id: itemId,
            item_name: itemName,
            price,
          },
        ],
      });
    }
  };

  const trackRemoveFromCart = (itemId: string, itemName: string, price: number) => {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.event('remove_from_cart', {
        currency: 'USD',
        value: price,
        items: [
          {
            item_id: itemId,
            item_name: itemName,
            price,
          },
        ],
      });
    }
  };

  const trackBeginCheckout = (value: number, items: Array<{ id: string; name: string; price: number }>) => {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.event('begin_checkout', {
        currency: 'USD',
        value,
        items: items.map((item) => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
        })),
      });
    }
  };

  const trackViewItem = (itemId: string, itemName: string, price: number, category?: string) => {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.event('view_item', {
        currency: 'USD',
        value: price,
        items: [
          {
            item_id: itemId,
            item_name: itemName,
            price,
            item_category: category,
          },
        ],
      });
    }
  };

  const setUserId = (userId: string) => {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.set({ userId });
    }
  };

  const setUserProperties = (properties: Record<string, string | number | boolean>) => {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.set(properties);
    }
  };

  return {
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackViewItem,
    setUserId,
    setUserProperties,
  };
};
