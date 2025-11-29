import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";

interface AICredits {
  id: string;
  store_id: string;
  monthly_credits: number;
  extra_credits: number;
  credits_used_this_month: number;
  last_reset_date: string;
}

export const useAICredits = () => {
  const { store } = useStore();
  const [credits, setCredits] = useState<AICredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!store?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to get existing credits
      const { data, error: fetchError } = await supabase
        .from("store_ai_credits")
        .select("*")
        .eq("store_id", store.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        // Check if we need to reset monthly credits (new month)
        const lastReset = new Date(data.last_reset_date);
        const now = new Date();
        const isNewMonth = 
          lastReset.getMonth() !== now.getMonth() || 
          lastReset.getFullYear() !== now.getFullYear();

        if (isNewMonth) {
          // Reset monthly credits
          const { data: updatedData, error: updateError } = await supabase
            .from("store_ai_credits")
            .update({
              credits_used_this_month: 0,
              last_reset_date: now.toISOString().split('T')[0],
            })
            .eq("id", data.id)
            .select()
            .single();

          if (updateError) throw updateError;
          setCredits(updatedData);
        } else {
          setCredits(data);
        }
      } else {
        // Create new credits record for the store
        const { data: newCredits, error: insertError } = await supabase
          .from("store_ai_credits")
          .insert({
            store_id: store.id,
            monthly_credits: 40,
            extra_credits: 0,
            credits_used_this_month: 0,
            last_reset_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setCredits(newCredits);
      }
    } catch (err) {
      console.error("Error fetching AI credits:", err);
      setError("Error al cargar créditos de IA");
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const getAvailableCredits = useCallback(() => {
    if (!credits) return 0;
    const monthlyAvailable = credits.monthly_credits - credits.credits_used_this_month;
    return monthlyAvailable + credits.extra_credits;
  }, [credits]);

  const getMonthlyRemaining = useCallback(() => {
    if (!credits) return 0;
    return Math.max(0, credits.monthly_credits - credits.credits_used_this_month);
  }, [credits]);

  const useCredit = useCallback(async (): Promise<{ success: boolean; creditType: 'monthly' | 'extra' }> => {
    if (!credits || !store?.id) {
      return { success: false, creditType: 'monthly' };
    }

    const monthlyRemaining = credits.monthly_credits - credits.credits_used_this_month;
    
    if (monthlyRemaining <= 0 && credits.extra_credits <= 0) {
      return { success: false, creditType: 'monthly' };
    }

    try {
      let creditType: 'monthly' | 'extra' = 'monthly';
      let updateData: Partial<AICredits> = {};

      if (monthlyRemaining > 0) {
        // Use monthly credit
        updateData.credits_used_this_month = credits.credits_used_this_month + 1;
        creditType = 'monthly';
      } else {
        // Use extra credit
        updateData.extra_credits = credits.extra_credits - 1;
        creditType = 'extra';
      }

      const { data, error } = await supabase
        .from("store_ai_credits")
        .update(updateData)
        .eq("id", credits.id)
        .select()
        .single();

      if (error) throw error;
      
      setCredits(data);
      return { success: true, creditType };
    } catch (err) {
      console.error("Error using credit:", err);
      return { success: false, creditType: 'monthly' };
    }
  }, [credits, store?.id]);

  const refetch = useCallback(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    credits,
    loading,
    error,
    availableCredits: getAvailableCredits(),
    monthlyRemaining: getMonthlyRemaining(),
    extraCredits: credits?.extra_credits || 0,
    monthlyTotal: credits?.monthly_credits || 40,
    useCredit,
    refetch,
  };
};
