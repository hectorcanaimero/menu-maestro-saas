import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getStatusLabel } from '@/lib/orderTracking';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  order_type: string | null;
  delivery_address: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string;
  created_at: string | null;
  updated_at: string | null;
  order_items?: Array<{
    id: string;
    item_name: string;
    quantity: number;
    price_at_time: number;
    order_item_extras?: Array<{
      extra_name: string;
      extra_price: number;
    }>;
  }>;
}

export function useOrderTracking(orderId: string) {
  const [realtimeOrder, setRealtimeOrder] = useState<Order | null>(null);

  // Fetch initial order data
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async (): Promise<Order> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            item_name,
            quantity,
            price_at_time,
            order_item_extras (
              extra_name,
              extra_price
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
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
          const oldOrder = payload.old as { status?: string };
          if (payload.old && oldOrder.status !== newOrder.status) {
            toast.success('Estado actualizado', {
              description: `Tu pedido está ${getStatusLabel(newOrder.status).toLowerCase()}`,
            });

            // Browser notification (if permission granted)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Actualización de Pedido', {
                body: `Tu pedido está ${getStatusLabel(newOrder.status).toLowerCase()}`,
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
