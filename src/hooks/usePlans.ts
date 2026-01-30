/**
 * usePlans Hook
 *
 * Provides complete CRUD operations for subscription plans management
 * Only accessible by platform super admins
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface PlanLimits {
  max_products: number; // -1 = unlimited
  max_categories: number; // -1 = unlimited
  max_orders_per_month: number; // -1 = unlimited
  max_ai_credits_per_month: number;
  max_product_images?: number; // -1 = unlimited, only for non-food stores
}

export interface PlanModulePrices {
  whatsapp_monthly?: number; // Price for WhatsApp module (null = not available)
  delivery_monthly?: number; // Price for Delivery module (null = not available)
}

export interface Plan {
  id: string;
  name: string; // Unique identifier (e.g., "basic", "pro")
  display_name: string; // Human-readable name (e.g., "Plan Básico")
  description: string;
  price_monthly: number;
  limits: PlanLimits;
  modules: PlanModulePrices;
  features: string[]; // Array of feature keys
  is_active: boolean;
  is_archived?: boolean; // Soft delete flag
  trial_duration_days: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanInput {
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  limits: PlanLimits;
  modules?: PlanModulePrices;
  features?: string[];
  is_active?: boolean;
  trial_duration_days?: number;
  sort_order?: number;
}

export interface UpdatePlanInput {
  display_name?: string;
  description?: string;
  price_monthly?: number;
  limits?: PlanLimits;
  modules?: PlanModulePrices;
  features?: string[];
  is_active?: boolean;
  trial_duration_days?: number;
  sort_order?: number;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function usePlans(includeArchived = false) {
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // QUERIES
  // -------------------------------------------------------------------------

  /**
   * Fetch all plans (optionally including archived)
   */
  const {
    data: plans,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['subscription-plans', includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');

      // Filter out archived unless explicitly requested
      if (!includeArchived) {
        query = query.or('is_archived.is.null,is_archived.eq.false');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Plan[];
    },
  });

  /**
   * Fetch single plan by ID
   */
  const fetchPlanById = async (planId: string): Promise<Plan | null> => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      console.error('[usePlans] Error fetching plan:', error);
      return null;
    }

    return data as Plan;
  };

  // -------------------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------------------

  /**
   * Create new plan
   */
  const createPlanMutation = useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      // Check if name already exists
      const { data: existing } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', input.name)
        .single();

      if (existing) {
        throw new Error(`Ya existe un plan con el nombre "${input.name}"`);
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([
          {
            name: input.name,
            display_name: input.display_name,
            description: input.description,
            price_monthly: input.price_monthly,
            limits: input.limits,
            modules: input.modules || {},
            features: input.features || [],
            is_active: input.is_active !== undefined ? input.is_active : true,
            is_archived: false,
            trial_duration_days: input.trial_duration_days || 0,
            sort_order: input.sort_order || 999,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Plan;
    },
    onSuccess: (data) => {
      toast.success('Plan creado exitosamente', {
        description: `El plan "${data.display_name}" ha sido creado.`,
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: Error) => {
      toast.error('Error al crear plan', {
        description: error.message,
      });
    },
  });

  /**
   * Update existing plan
   */
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, updates }: { planId: string; updates: UpdatePlanInput }) => {
      console.log('[usePlans] Updating plan:', { planId, updates });

      const { data, error } = await supabase
        .from('subscription_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) {
        console.error('[usePlans] Update error:', error);
        throw error;
      }

      console.log('[usePlans] Update successful:', data);
      return data as Plan;
    },
    onSuccess: (data) => {
      console.log('[usePlans] onSuccess called:', data);
      toast.success('Plan actualizado', {
        description: `Los cambios en "${data.display_name}" han sido guardados.`,
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: Error) => {
      console.error('[usePlans] onError called:', error);
      toast.error('Error al actualizar plan', {
        description: error.message,
      });
    },
  });

  /**
   * Toggle plan active status
   */
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ planId, isActive }: { planId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data as Plan;
    },
    onSuccess: (data) => {
      const status = data.is_active ? 'activado' : 'desactivado';
      toast.success(`Plan ${status}`, {
        description: `El plan "${data.display_name}" ha sido ${status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: Error) => {
      toast.error('Error al cambiar estado del plan', {
        description: error.message,
      });
    },
  });

  /**
   * Archive plan (soft delete)
   */
  const archivePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      // Check if plan has active subscriptions
      const { data: subscriptions, error: checkError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('plan_id', planId)
        .in('status', ['trial', 'active', 'pending_payment'])
        .limit(1);

      if (checkError) throw checkError;

      if (subscriptions && subscriptions.length > 0) {
        throw new Error(
          'No se puede archivar un plan con suscripciones activas. Primero cambia las suscripciones a otro plan.'
        );
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .update({
          is_archived: true,
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data as Plan;
    },
    onSuccess: (data) => {
      toast.success('Plan archivado', {
        description: `El plan "${data.display_name}" ha sido archivado.`,
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: Error) => {
      toast.error('Error al archivar plan', {
        description: error.message,
      });
    },
  });

  /**
   * Restore archived plan
   */
  const restorePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({
          is_archived: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data as Plan;
    },
    onSuccess: (data) => {
      toast.success('Plan restaurado', {
        description: `El plan "${data.display_name}" ha sido restaurado.`,
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: Error) => {
      toast.error('Error al restaurar plan', {
        description: error.message,
      });
    },
  });

  /**
   * Duplicate plan (clone)
   */
  const duplicatePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const plan = await fetchPlanById(planId);
      if (!plan) throw new Error('Plan no encontrado');

      // Generate unique name
      const baseName = plan.name;
      const timestamp = Date.now();
      const newName = `${baseName}_copy_${timestamp}`;

      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([
          {
            name: newName,
            display_name: `${plan.display_name} (Copia)`,
            description: plan.description,
            price_monthly: plan.price_monthly,
            limits: plan.limits,
            modules: plan.modules,
            features: plan.features,
            is_active: false, // Create as inactive
            is_archived: false,
            trial_duration_days: plan.trial_duration_days,
            sort_order: plan.sort_order + 1,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Plan;
    },
    onSuccess: (data) => {
      toast.success('Plan duplicado', {
        description: `Se creó una copia del plan: "${data.display_name}". Recuerda activarlo cuando esté listo.`,
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
    onError: (error: Error) => {
      toast.error('Error al duplicar plan', {
        description: error.message,
      });
    },
  });

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------

  return {
    // Data
    plans,
    isLoading,
    error,
    refetch,

    // Mutations
    createPlan: createPlanMutation.mutate,
    createPlanAsync: createPlanMutation.mutateAsync,
    isCreating: createPlanMutation.isPending,

    updatePlan: updatePlanMutation.mutate,
    updatePlanAsync: updatePlanMutation.mutateAsync,
    isUpdating: updatePlanMutation.isPending,

    toggleActive: toggleActiveMutation.mutate,
    toggleActiveAsync: toggleActiveMutation.mutateAsync,
    isToggling: toggleActiveMutation.isPending,

    archivePlan: archivePlanMutation.mutate,
    archivePlanAsync: archivePlanMutation.mutateAsync,
    isArchiving: archivePlanMutation.isPending,

    restorePlan: restorePlanMutation.mutate,
    restorePlanAsync: restorePlanMutation.mutateAsync,
    isRestoring: restorePlanMutation.isPending,

    duplicatePlan: duplicatePlanMutation.mutate,
    duplicatePlanAsync: duplicatePlanMutation.mutateAsync,
    isDuplicating: duplicatePlanMutation.isPending,

    // Utilities
    fetchPlanById,
  };
}
