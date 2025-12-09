import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSubdomainFromHostname } from '@/lib/subdomain-validation';
import { useAutoUpdateRates } from '@/hooks/useAutoUpdateRates';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';

export interface Store {
  id: string;
  subdomain: string;
  name: string;
  owner_id: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean | null;
  operating_modes: Array<'delivery' | 'pickup' | 'digital_menu'> | null;
  force_status: 'normal' | 'force_open' | 'force_closed' | null;
  currency: string | null;
  decimal_places: number | null;
  decimal_separator: string | null;
  thousands_separator: string | null;
  accept_cash: boolean | null;
  payment_on_delivery: string | null;
  require_payment_proof: boolean | null;
  minimum_order_price: number | null;
  redirect_to_whatsapp: boolean | null;
  order_product_template: string | null;
  order_message_template_delivery: string | null;
  order_message_template_pickup: string | null;
  order_message_template_digital_menu: string | null;
  estimated_delivery_time: string | null;
  skip_payment_digital_menu: boolean | null;
  delivery_price_mode: string | null;
  fixed_delivery_price: number | null;
  remove_zipcode: boolean | null;
  remove_address_number: boolean | null;
  enable_audio_notifications: boolean | null;
  notification_volume: number | null;
  notification_repeat_count: number | null;
  primary_color: string | null;
  price_color: string | null;
  enable_currency_conversion: boolean | null;
  use_manual_exchange_rate: boolean | null;
  manual_usd_ves_rate: number | null;
  manual_eur_ves_rate: number | null;
  active_currency: string | null; // 'original' or 'VES' - which currency to use for checkout
}

interface StoreContextType {
  store: Store | null;
  loading: boolean;
  isStoreOwner: boolean;
  reloadStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStoreOwner, setIsStoreOwner] = useState(false);

  // Auto-update exchange rates every hour if conversion is enabled
  useAutoUpdateRates(store?.id, store?.enable_currency_conversion ?? false);

  // Initial load effect - runs only once on mount
  useEffect(() => {
    loadStore();
  }, []);

  // Revalidation interval effect - depends on store
  useEffect(() => {
    if (!store) return;

    // Revalidate store ownership every 5 minutes
    const intervalId = setInterval(() => {
      revalidateOwnership();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [store]);

  // Auth state change listener effect - depends on store
  useEffect(() => {
    // Listen for auth state changes
    // IMPORTANT: Don't use async directly in callback to avoid Supabase deadlock
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Reload store when user signs in to get correct ownership status
      if (event === 'SIGNED_IN') {
        console.log('[StoreContext] User signed in, scheduling store reload...');
        // Defer loadStore to avoid deadlock - this is a Supabase best practice
        setTimeout(() => {
          loadStore();
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        console.log('[StoreContext] User signed out');
        setIsStoreOwner(false);

        // Clear Sentry user context
        Sentry.setUser(null);

        // Clear PostHog
        posthog.reset();
      } else if (store) {
        // Update ownership for other events
        const isOwner = session?.user?.id === store.owner_id;
        setIsStoreOwner(isOwner);

        // Identify user in PostHog when auth state changes
        identifyUserInPostHog(session, store, isOwner);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [store]);

  const loadStore = async () => {
    try {
      setLoading(true);

      // Extract subdomain using utility function
      const subdomain = getSubdomainFromHostname();
      // Use secure RPC function with rate limiting
      const { data, error } = await supabase.rpc('get_store_by_subdomain_secure', {
        p_subdomain: subdomain,
        p_ip_address: undefined, // Browser doesn't have access to IP, server will handle
      });

      if (error) {
        console.error('Error loading store (RPC):', error);

        // Fallback to direct query if RPC fails
        console.warn('Falling back to direct query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('stores')
          .select('*')
          .eq('subdomain', subdomain)
          .eq('is_active', true)
          .single();

        if (fallbackError) {
          console.error('Error loading store (fallback):', fallbackError);
          setStore(null);
        } else {
          setStore(fallbackData);
          await checkOwnership(fallbackData);
        }
        return;
      }

      // Handle RPC response
      const result = data?.[0];

      if (!result || !result.rate_limit_ok) {
        console.error('Rate limit exceeded or store not found:', result?.error_message);
        setStore(null);
        return;
      }

      if (result.error_message) {
        console.error('Store lookup error:', result.error_message);
        setStore(null);
        return;
      }

      // Parse store data from JSONB
      const storeData = result.store_data as unknown as Store;
      setStore(storeData);
      setIsStoreOwner(result.is_owner || false);

      // Set Sentry context for multi-tenant tracking
      Sentry.setContext("store", {
        store_id: storeData.id,
        store_name: storeData.name,
        subdomain: storeData.subdomain,
        is_active: storeData.is_active,
        operating_modes: storeData.operating_modes,
      });
    } catch (error) {
      console.error('Error in loadStore:', error);
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const checkOwnership = async (storeData: Store) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const isOwner = session?.user?.id === storeData.owner_id;
    setIsStoreOwner(isOwner);

    // Set Sentry user context
    if (session?.user) {
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email,
        username: session.user.email?.split('@')[0],
      });

      // Set additional tags
      Sentry.setTag("is_store_owner", isOwner);
      Sentry.setTag("user_role", isOwner ? "owner" : "customer");
    }

    // Identify user in PostHog after checking ownership
    identifyUserInPostHog(session, storeData, isOwner);
  };

  // Helper function to identify users in PostHog
  const identifyUserInPostHog = (
    session: { user: { id: string; email?: string } } | null,
    storeData: Store,
    isOwner: boolean,
  ) => {
    try {
      if (session?.user) {
        // Identify user with their user ID and store context
        // DO NOT send email in identify() as it gets stored in localStorage
        posthog.identify(session.user.id, {
          // Only send non-sensitive metadata
          store_id: storeData.id,
          store_name: storeData.name,
          is_store_owner: isOwner,
          role: isOwner ? 'owner' : 'customer',
          store_subdomain: storeData.subdomain,
          user_type: 'authenticated',
        });

        // Send email ONLY to PostHog servers (not stored in localStorage)
        // This is done via the $set operation which goes directly to the server
        if (session.user.email) {
          posthog.people.set({
            email: session.user.email, // This goes to PostHog servers only, not localStorage
          });
        }

        if (import.meta.env.DEV) {
          console.log('[PostHog] User identified:', {
            user_id: session.user.id,
            email: '***@***.com', // Don't log email in console for security
            store_id: storeData.id,
            is_store_owner: isOwner,
          });
        }
      } else {
        // Reset identification when user logs out
        posthog.reset();

        // Set anonymous user properties with store context
        posthog.register({
          store_id: storeData.id,
          store_name: storeData.name,
          store_subdomain: storeData.subdomain,
          user_type: 'anonymous',
        });
      }
    } catch (error) {
      console.error('[PostHog] Error identifying user:', error);
    }
  };

  const revalidateOwnership = async () => {
    if (!store) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Check server-side ownership
      const { data, error } = await supabase.rpc('verify_store_ownership', {
        p_store_id: store.id,
      });

      if (!error && data !== isStoreOwner) {
        console.warn('Ownership status changed, updating...');
        setIsStoreOwner(data);

        // If ownership was revoked, reload the page to clear admin access
        if (!data && isStoreOwner) {
          console.warn('Store ownership revoked, reloading...');
          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('Error revalidating ownership:', error);
    }
  };

  const reloadStore = async () => {
    await loadStore();
  };

  return (
    <StoreContext.Provider value={{ store, loading, isStoreOwner, reloadStore }}>{children}</StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
