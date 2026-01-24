import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionOverride {
  id: string;
  store_id: string;
  max_products: number | null;
  max_categories: number | null;
  max_orders_per_month: number | null;
  notes: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface UpsertOverrideInput {
  store_id: string;
  max_products?: number | null;
  max_categories?: number | null;
  max_orders_per_month?: number | null;
  notes?: string | null;
  reason?: string | null;
}

/**
 * Hook para gestionar overrides (excepciones) de límites de suscripción
 * Solo accesible para super admins
 */
export function useSubscriptionOverrides(storeId?: string) {
  const queryClient = useQueryClient();

  // Obtener override de una tienda específica
  const {
    data: override,
    isLoading,
    refetch,
  } = useQuery<SubscriptionOverride | null>({
    queryKey: ['subscription-override', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      const { data, error } = await supabase.rpc('get_subscription_override', {
        p_store_id: storeId,
      });

      if (error) {
        // Si no existe override, no es un error
        if (error.message.includes('not found')) {
          return null;
        }
        throw error;
      }

      return data as SubscriptionOverride | null;
    },
    enabled: !!storeId,
  });

  // Crear o actualizar override
  const upsertMutation = useMutation({
    mutationFn: async (input: UpsertOverrideInput) => {
      const { data, error } = await supabase.rpc('upsert_subscription_override', {
        p_store_id: input.store_id,
        p_max_products: input.max_products ?? null,
        p_max_categories: input.max_categories ?? null,
        p_max_orders_per_month: input.max_orders_per_month ?? null,
        p_notes: input.notes ?? null,
        p_reason: input.reason ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Límites personalizados actualizados');
      queryClient.invalidateQueries({ queryKey: ['subscription-override', variables.store_id] });
      queryClient.invalidateQueries({ queryKey: ['usage-stats', variables.store_id] });
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.store_id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar límites');
    },
  });

  // Eliminar override
  const deleteMutation = useMutation({
    mutationFn: async (store_id: string) => {
      const { data, error } = await supabase.rpc('delete_subscription_override', {
        p_store_id: store_id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, store_id) => {
      toast.success('Límites personalizados eliminados - usando límites del plan');
      queryClient.invalidateQueries({ queryKey: ['subscription-override', store_id] });
      queryClient.invalidateQueries({ queryKey: ['usage-stats', store_id] });
      queryClient.invalidateQueries({ queryKey: ['subscription', store_id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar override');
    },
  });

  return {
    override,
    isLoading,
    refetch,
    upsert: upsertMutation.mutate,
    upsertAsync: upsertMutation.mutateAsync,
    isUpserting: upsertMutation.isPending,
    deleteOverride: deleteMutation.mutate,
    deleteOverrideAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook para listar todas las tiendas con overrides
 * Solo para super admins
 */
export function useAllSubscriptionOverrides() {
  const queryClient = useQueryClient();

  const { data: overrides, isLoading } = useQuery<
    Array<
      SubscriptionOverride & {
        store_name?: string;
        store_subdomain?: string;
      }
    >
  >({
    queryKey: ['subscription-overrides-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_overrides')
        .select(
          `
          *,
          stores!inner(
            name,
            subdomain
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include store info
      return (data || []).map((item: any) => ({
        ...item,
        store_name: item.stores?.name,
        store_subdomain: item.stores?.subdomain,
        stores: undefined, // Remove nested object
      }));
    },
  });

  return {
    overrides: overrides || [],
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['subscription-overrides-all'] }),
  };
}
