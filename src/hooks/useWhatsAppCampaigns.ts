import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

export interface WhatsAppCampaign {
  id: string;
  store_id: string;
  name: string;
  message_body: string;
  image_url: string | null;
  target_audience: 'all' | 'recent_customers' | 'inactive_customers';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_recipients: number;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppCampaigns() {
  const { store } = useStore();
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!store?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching WhatsApp campaigns:', error);
        return;
      }

      setCampaigns(data as WhatsAppCampaign[]);
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (campaign: Omit<WhatsAppCampaign, 'id' | 'store_id' | 'created_at' | 'updated_at' | 'started_at' | 'completed_at' | 'messages_sent' | 'messages_delivered' | 'messages_failed'>) => {
    if (!store?.id) {
      toast.error('Store not found');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .insert({
          store_id: store.id,
          ...campaign,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        toast.error('Error al crear la campaña');
        return null;
      }

      setCampaigns(prev => [data as WhatsAppCampaign, ...prev]);
      toast.success('Campaña creada');
      return data as WhatsAppCampaign;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear la campaña');
      return null;
    }
  };

  const updateCampaign = async (campaignId: string, updates: Partial<WhatsAppCampaign>) => {
    try {
      const { error } = await supabase
        .from('whatsapp_campaigns')
        .update(updates)
        .eq('id', campaignId);

      if (error) {
        console.error('Error updating campaign:', error);
        toast.error('Error al actualizar la campaña');
        return false;
      }

      setCampaigns(prev => 
        prev.map(c => c.id === campaignId ? { ...c, ...updates } : c)
      );
      toast.success('Campaña actualizada');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la campaña');
      return false;
    }
  };

  const cancelCampaign = async (campaignId: string) => {
    return updateCampaign(campaignId, { status: 'cancelled' });
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        console.error('Error deleting campaign:', error);
        toast.error('Error al eliminar la campaña');
        return false;
      }

      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      toast.success('Campaña eliminada');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la campaña');
      return false;
    }
  };

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    cancelCampaign,
    deleteCampaign,
    refetch: fetchCampaigns,
  };
}
