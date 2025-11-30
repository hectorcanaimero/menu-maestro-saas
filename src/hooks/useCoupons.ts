import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  store_id: string;
  code: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  minimum_order_amount: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_customer_limit: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  store_id: string;
  customer_email: string;
  order_id: string | null;
  discount_applied: number;
  used_at: string;
}

/**
 * Hook to fetch all coupons for a store (admin use)
 */
export function useCoupons(storeId?: string) {
  return useQuery({
    queryKey: ['coupons', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
    enabled: !!storeId,
  });
}

/**
 * Validate a coupon code
 */
export async function validateCouponCode(
  code: string,
  storeId: string,
  customerEmail: string,
  orderTotal: number
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  try {
    // Fetch the coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('store_id', storeId)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return { valid: false, error: 'Cupón inválido o no encontrado' };
    }

    const now = new Date();

    // Check start date
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return { valid: false, error: 'Este cupón aún no está disponible' };
    }

    // Check end date
    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return { valid: false, error: 'Este cupón ha expirado' };
    }

    // Check usage limit
    if (coupon.usage_limit !== null && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
      return { valid: false, error: 'Este cupón ha alcanzado su límite de usos' };
    }

    // Check minimum order amount
    if (orderTotal < (coupon.minimum_order_amount ?? 0)) {
      return {
        valid: false,
        error: `El pedido debe ser de al menos $${(coupon.minimum_order_amount ?? 0).toFixed(2)} para usar este cupón`,
      };
    }

    // Check per-customer usage limit
    const { count, error: countError } = await supabase
      .from('coupon_usages')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('customer_email', customerEmail);

    if (countError) {
      console.error('Error checking coupon usage:', countError);
    }

    if (count !== null && count >= (coupon.per_customer_limit ?? 1)) {
      return { valid: false, error: 'Ya has usado este cupón el número máximo de veces' };
    }

    return { valid: true, coupon: coupon as Coupon };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, error: 'Error al validar el cupón' };
  }
}

/**
 * Calculate the discount amount for a coupon
 */
export function applyCouponDiscount(coupon: Coupon, orderTotal: number): number {
  let discount = 0;

  if (coupon.type === 'percentage') {
    discount = (orderTotal * coupon.value) / 100;
    // Apply maximum discount if set
    if (coupon.maximum_discount !== null && discount > coupon.maximum_discount) {
      discount = coupon.maximum_discount;
    }
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
    // Don't exceed order total
    if (discount > orderTotal) {
      discount = orderTotal;
    }
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimals
}

/**
 * Record coupon usage
 */
export async function recordCouponUsage(
  couponId: string,
  storeId: string,
  customerEmail: string,
  orderId: string,
  discountApplied: number
) {
  try {
    // Insert usage record
    const { error: usageError } = await supabase
      .from('coupon_usages')
      .insert({
        coupon_id: couponId,
        store_id: storeId,
        customer_email: customerEmail,
        order_id: orderId,
        discount_applied: discountApplied,
      });

    if (usageError) throw usageError;

    // Increment usage count - fetch current count, then update
    const { data: currentCoupon, error: fetchError } = await supabase
      .from('coupons')
      .select('usage_count')
      .eq('id', couponId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('coupons')
      .update({ usage_count: (currentCoupon.usage_count || 0) + 1 })
      .eq('id', couponId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    throw error;
  }
}

/**
 * Mutation to create a coupon
 */
export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert(coupon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coupons', data.store_id] });
      toast.success('Cupón creado exitosamente');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Error al crear el cupón';
      toast.error(message);
    },
  });
}

/**
 * Mutation to update a coupon
 */
export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coupons', data.store_id] });
      toast.success('Cupón actualizado exitosamente');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Error al actualizar el cupón';
      toast.error(message);
    },
  });
}

/**
 * Mutation to delete a coupon
 */
export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storeId }: { id: string; storeId: string }) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);

      if (error) throw error;
      return { id, storeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coupons', data.storeId] });
      toast.success('Cupón eliminado exitosamente');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Error al eliminar el cupón';
      toast.error(message);
    },
  });
}

/**
 * Hook to fetch coupon usages
 */
export function useCouponUsages(couponId?: string) {
  return useQuery({
    queryKey: ['coupon-usages', couponId],
    queryFn: async () => {
      if (!couponId) return [];

      const { data, error } = await supabase
        .from('coupon_usages')
        .select('*')
        .eq('coupon_id', couponId)
        .order('used_at', { ascending: false });

      if (error) throw error;
      return data as CouponUsage[];
    },
    enabled: !!couponId,
  });
}
