import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import posthog from 'posthog-js';

export interface WhatsAppMessage {
  id: string;
  store_id: string;
  customer_phone: string;
  customer_name: string | null;
  message_type: string;
  message_content: string;
  image_url: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message: string | null;
  order_id: string | null;
  campaign_id: string | null;
  evolution_message_id: string | null;
  credit_type: 'monthly' | 'extra';
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface MessageStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export function useWhatsAppMessages() {
  const { store } = useStore();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [stats, setStats] = useState<MessageStats>({ total: 0, sent: 0, delivered: 0, read: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async (limit = 50) => {
    if (!store?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching WhatsApp messages:', error);
        return;
      }

      setMessages(data as WhatsAppMessage[]);

      // Calculate stats
      const newStats: MessageStats = { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
      data.forEach((msg) => {
        const message = msg as { status?: string };
        newStats.total++;
        if (message.status === 'sent') newStats.sent++;
        if (message.status === 'delivered') newStats.delivered++;
        if (message.status === 'read') newStats.read++;
        if (message.status === 'failed') newStats.failed++;
      });
      setStats(newStats);
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (params: {
    customerPhone: string;
    customerName?: string;
    messageType: string;
    orderId?: string;
    campaignId?: string;
    imageUrl?: string;
    variables?: Record<string, string>;
  }) => {
    if (!store?.id) {
      toast.error('Store not found');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          storeId: store.id,
          ...params,
        },
      });

      if (error || !data?.success) {
        console.error('Error sending message:', error || data?.error);
        toast.error(data?.error || 'Error al enviar mensaje');

        // Track failed message
        try {
          posthog.capture('whatsapp_message_failed', {
            store_id: store.id,
            store_name: store.name,
            message_type: params.messageType,
            error: data?.error || 'Unknown error',
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.error('[PostHog] Error tracking whatsapp_message_failed:', e);
        }

        return false;
      }

      // Track successful message send
      try {
        posthog.capture('whatsapp_message_sent', {
          store_id: store.id,
          store_name: store.name,
          message_type: params.messageType,
          has_order: !!params.orderId,
          has_campaign: !!params.campaignId,
          has_image: !!params.imageUrl,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error('[PostHog] Error tracking whatsapp_message_sent:', e);
      }

      toast.success('Mensaje enviado');
      fetchMessages();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar mensaje');
      return false;
    }
  };

  const getMonthlyStats = useCallback(async () => {
    if (!store?.id) return null;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('status')
      .eq('store_id', store.id)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.error('Error fetching monthly stats:', error);
      return null;
    }

    const monthlyStats: MessageStats = { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
    data.forEach((msg) => {
      const message = msg as { status?: string };
      monthlyStats.total++;
      if (message.status === 'sent') monthlyStats.sent++;
      if (message.status === 'delivered') monthlyStats.delivered++;
      if (message.status === 'read') monthlyStats.read++;
      if (message.status === 'failed') monthlyStats.failed++;
    });

    return monthlyStats;
  }, [store?.id]);

  return {
    messages,
    stats,
    loading,
    sendMessage,
    getMonthlyStats,
    refetch: fetchMessages,
  };
}
