import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getStatusLabel } from '@/lib/orderTracking';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  order_type: string;
  delivery_address: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: any[];
  created_at: string;
  updated_at: string;
}

export function useOrderTracking(orderId: string) {
  const [realtimeOrder, setRealtimeOrder] = useState<Order | null>(null);

  // Fetch initial order data
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async (): Promise<Order> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data as Order;
    },
    enabled: !!orderId,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-tracking:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setRealtimeOrder(newOrder);

          // Show notification for status change
          if (payload.old && (payload.old as any).status !== newOrder.status) {
            toast.success('Estado actualizado', {
              description: `Tu pedido está ${getStatusLabel(newOrder.status).toLowerCase()}`,
            });

            // Browser notification (if permission granted)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Actualización de Pedido', {
                body: `Tu pedido #${newOrder.order_number} está ${getStatusLabel(newOrder.status).toLowerCase()}`,
                icon: '/logo.png',
              });
            }
          }

          // Refetch query to update cache
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, refetch]);

  // Use realtime data if available, otherwise use query data
  const currentOrder = realtimeOrder || order;

  return {
    order: currentOrder,
    isLoading,
    error,
    refetch,
  };
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
