import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';

export interface WhatsAppCredits {
  monthly_credits: number;
  extra_credits: number;
  credits_used: number;
  credits_available: number;
}

export function useWhatsAppCredits() {
  const { store } = useStore();
  const [credits, setCredits] = useState<WhatsAppCredits | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!store?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('check_and_reset_whatsapp_credits', { p_store_id: store.id });

      if (error) {
        console.error('Error fetching WhatsApp credits:', error);
        return;
      }

      if (data && data[0]) {
        setCredits({
          monthly_credits: data[0].monthly_credits,
          extra_credits: data[0].extra_credits,
          credits_used: data[0].credits_used,
          credits_available: data[0].credits_available,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const getUsagePercentage = () => {
    if (!credits) return 0;
    return Math.round((credits.credits_used / credits.monthly_credits) * 100);
  };

  return {
    credits,
    loading,
    refetch: fetchCredits,
    getUsagePercentage,
  };
}
