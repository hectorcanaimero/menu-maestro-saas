import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  limits: {
    ai_monthly_credits?: number;
    max_products?: number | null;
    max_orders_per_month?: number | null;
    max_categories?: number | null;
    has_kitchen_display?: boolean;
    has_analytics?: boolean;
    has_promotions?: boolean;
    has_coupons?: boolean;
  };
  modules: {
    whatsapp?: boolean;
    delivery?: boolean;
    ai_enhancement?: boolean;
  };
  features: string[];
}

interface Subscription {
  id: string;
  store_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'pending_payment' | 'past_due' | 'cancelled' | 'suspended';
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  enabled_modules: {
    whatsapp?: boolean;
    delivery?: boolean;
  };
  subscription_plans: SubscriptionPlan;
}

interface UsageStats {
  products: {
    current: number;
    limit: number | null;
    unlimited: boolean;
    has_override?: boolean;
  };
  orders_this_month: {
    current: number;
    limit: number | null;
    unlimited: boolean;
    has_override?: boolean;
  };
  categories: {
    current: number;
    limit: number | null;
    unlimited: boolean;
    has_override?: boolean;
  };
  ai_credits: {
    used: number;
    available: number;
    limit: number;
  };
}

/**
 * Hook principal para gestionar suscripción de la tienda
 * @param storeIdProp - Optional store ID. If not provided, uses StoreContext
 */
export function useSubscription(storeIdProp?: string) {
  const { store } = useStore();
  const storeId = storeIdProp || store?.id;

  // Obtener suscripción actual
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    refetch: refetchSubscription,
  } = useQuery<Subscription>({
    queryKey: ['subscription', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID not available');

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;

      // If no subscription exists, return null (will be handled by components)
      if (!data) {
        console.warn('No subscription found for store:', storeId);
        return null;
      }

      return data as Subscription;
    },
    enabled: !!storeId,
  });

  // Obtener estadísticas de uso
  const {
    data: usage,
    isLoading: usageLoading,
    refetch: refetchUsage,
  } = useQuery<UsageStats>({
    queryKey: ['usage-stats', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID not available');

      const { data, error } = await supabase.rpc('get_store_usage_stats', {
        p_store_id: storeId,
      });

      if (error) throw error;
      return data as UsageStats;
    },
    enabled: !!storeId,
  });

  // Verificar si puede acceder a un módulo
  const canAccessModule = async (moduleName: 'whatsapp' | 'delivery' | 'ai_enhancement'): Promise<boolean> => {
    if (!storeId) return false;

    const { data, error } = await supabase.rpc('has_module_enabled', {
      p_store_id: storeId,
      p_module_name: moduleName,
    });

    if (error) {
      console.error('Error checking module access:', error);
      return false;
    }

    return data as boolean;
  };

  // Verificar si puede acceder a una feature
  const canAccessFeature = async (featureName: string): Promise<boolean> => {
    if (!storeId) return false;

    const { data, error } = await supabase.rpc('has_feature_enabled', {
      p_store_id: storeId,
      p_feature_name: featureName,
    });

    if (error) {
      console.error('Error checking feature access:', error);
      return false;
    }

    return data as boolean;
  };

  // Verificar si puede agregar más items (productos, categorías, etc)
  const canAddMore = async (limitKey: 'max_products' | 'max_categories' | 'max_orders_per_month'): Promise<boolean> => {
    if (!storeId) return false;

    const { data, error } = await supabase.rpc('validate_plan_limit', {
      p_store_id: storeId,
      p_limit_key: limitKey,
    });

    if (error) {
      console.error('Error validating limit:', error);
      return false;
    }

    return data as boolean;
  };

  // Verificar si la suscripción es válida
  const isValid = subscription?.status === 'trial' || subscription?.status === 'active';

  // Calcular días restantes de trial
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Verificar si está en trial
  const isTrial = subscription?.status === 'trial';

  // Verificar si está expirado
  const isExpired = subscription?.status === 'past_due' || subscription?.status === 'suspended';

  // Verificar si necesita upgrade
  const needsUpgrade = subscription?.subscription_plans?.name === 'trial' && trialDaysLeft !== null && trialDaysLeft <= 7;

  return {
    subscription,
    plan: subscription?.subscription_plans,
    usage,
    isLoading: subscriptionLoading || usageLoading,
    isValid,
    isTrial,
    isExpired,
    needsUpgrade,
    trialDaysLeft,
    canAccessModule,
    canAccessFeature,
    canAddMore,
    refetch: () => {
      refetchSubscription();
      refetchUsage();
    },
  };
}

/**
 * Hook simplificado para verificar acceso a módulo específico
 */
export function useModuleAccess(moduleName: 'whatsapp' | 'delivery' | 'ai_enhancement') {
  const { store } = useStore();

  return useQuery({
    queryKey: ['module-access', store?.id, moduleName],
    queryFn: async () => {
      if (!store?.id) return false;

      const { data, error } = await supabase.rpc('has_module_enabled', {
        p_store_id: store.id,
        p_module_name: moduleName,
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!store?.id,
  });
}

/**
 * Hook simplificado para verificar acceso a feature específica
 */
export function useFeatureAccess(featureName: string) {
  const { store } = useStore();

  return useQuery({
    queryKey: ['feature-access', store?.id, featureName],
    queryFn: async () => {
      if (!store?.id) return false;

      const { data, error } = await supabase.rpc('can_access_feature', {
        p_store_id: store.id,
        p_feature_name: featureName,
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!store?.id,
  });
}
