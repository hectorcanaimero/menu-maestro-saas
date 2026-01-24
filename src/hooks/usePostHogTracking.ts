import { useCallback } from 'react';
import posthog from 'posthog-js';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/integrations/supabase/auth';

/**
 * Hook personalizado para tracking de eventos en PostHog
 * Enriquece automáticamente los eventos con propiedades comunes
 */
export function usePostHogTracking() {
  const { store } = useStore();
  const { session } = useAuth();
  const user = session?.user;

  /**
   * Trackea un evento en PostHog
   * @param eventName - Nombre del evento (ej: 'order_created')
   * @param properties - Propiedades específicas del evento
   */
  const track = useCallback((
    eventName: string,
    properties: Record<string, any> = {}
  ) => {
    try {
      // Enriquecer con propiedades comunes automáticamente
      const enrichedProperties = {
        ...properties,
        // Store properties
        store_id: store?.id,
        store_name: store?.name,
        store_subdomain: store?.subdomain,
        // User properties
        user_id: user?.id,
        user_email: user?.email,
        // Timestamp
        timestamp: new Date().toISOString(),
      };

      // Remover valores undefined para evitar enviar propiedades vacías
      Object.keys(enrichedProperties).forEach(key => {
        if (enrichedProperties[key] === undefined || enrichedProperties[key] === null) {
          delete enrichedProperties[key];
        }
      });

      // Capturar el evento
      posthog.capture(eventName, enrichedProperties);

      // Log en development para debugging
      if (import.meta.env.DEV) {
        console.log('[PostHog Event]', eventName, enrichedProperties);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, [store, user]);

  /**
   * Identifica al usuario en PostHog
   * @param userId - ID único del usuario
   * @param properties - Propiedades del usuario
   */
  const identify = useCallback((
    userId: string,
    properties?: Record<string, any>
  ) => {
    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error('Error identifying user:', error);
    }
  }, []);

  /**
   * Resetea la identidad del usuario (útil en logout)
   */
  const reset = useCallback(() => {
    try {
      posthog.reset();
    } catch (error) {
      console.error('Error resetting user:', error);
    }
  }, []);

  /**
   * Trackea una página vista
   * @param pageName - Nombre de la página
   * @param properties - Propiedades adicionales
   */
  const trackPageView = useCallback((
    pageName?: string,
    properties?: Record<string, any>
  ) => {
    try {
      posthog.capture('$pageview', {
        ...properties,
        page_name: pageName,
        store_id: store?.id,
        store_subdomain: store?.subdomain,
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }, [store]);

  return {
    track,
    identify,
    reset,
    trackPageView,
  };
}

// Event names constants para evitar typos
export const EVENTS = {
  // Orders
  ORDER_CREATED: 'order_created',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_PREPARING: 'order_preparing',
  ORDER_OUT_FOR_DELIVERY: 'order_out_for_delivery',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',

  // Products
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCT_ADDED_TO_CART: 'product_added_to_cart',
  PRODUCT_REMOVED_FROM_CART: 'product_removed_from_cart',
  CATEGORY_VIEWED: 'category_viewed',
  PRODUCT_SEARCH: 'product_search',

  // Users
  USER_SIGNUP: 'user_signup',
  FIRST_ORDER: 'first_order',
  REPEAT_ORDER: 'repeat_order',
  CUSTOMER_RETURN: 'customer_return',

  // Subscriptions
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  TRIAL_STARTED: 'trial_started',
  TRIAL_CONVERTED: 'trial_converted',
  TRIAL_EXPIRED: 'trial_expired',

  // Modules
  WHATSAPP_MESSAGE_SENT: 'whatsapp_message_sent',
  WHATSAPP_MESSAGE_DELIVERED: 'whatsapp_message_delivered',
  DELIVERY_ASSIGNED: 'delivery_assigned',
  DRIVER_LOCATION_UPDATED: 'driver_location_updated',
  DELIVERY_PHOTO_UPLOADED: 'delivery_photo_uploaded',
  DELIVERY_SIGNATURE_CAPTURED: 'delivery_signature_captured',

  // Stores
  STORE_CREATED: 'store_created',
  STORE_SETTINGS_UPDATED: 'store_settings_updated',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Performance
  PAGE_LOAD_SLOW: 'page_load_slow',
  API_ERROR: 'api_error',
  CHECKOUT_ABANDONED: 'checkout_abandoned',

  // Marketing
  LANDING_PAGE_VIEWED: 'landing_page_viewed',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];
