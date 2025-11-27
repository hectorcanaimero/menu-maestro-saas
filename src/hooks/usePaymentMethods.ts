import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';

export function usePaymentMethods() {
  const { store } = useStore();

  return useQuery({
    queryKey: ['payment-methods', store?.id],
    queryFn: async () => {
      if (!store?.id) throw new Error('Store ID required');

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });
}
