import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

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
      data.forEach((msg: any) => {
        newStats.total++;
        if (msg.status === 'sent') newStats.sent++;
        if (msg.status === 'delivered') newStats.delivered++;
        if (msg.status === 'read') newStats.read++;
        if (msg.status === 'failed') newStats.failed++;
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
        return false;
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
    data.forEach((msg: any) => {
      monthlyStats.total++;
      if (msg.status === 'sent') monthlyStats.sent++;
      if (msg.status === 'delivered') monthlyStats.delivered++;
      if (msg.status === 'read') monthlyStats.read++;
      if (msg.status === 'failed') monthlyStats.failed++;
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
