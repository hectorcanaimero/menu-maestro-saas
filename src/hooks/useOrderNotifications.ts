import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/notificationSound";

export const useOrderNotifications = () => {
  const { store, isStoreOwner } = useStore();
  const channelRef = useRef<any>(null);
  
  useEffect(() => {
    // Only enable notifications for store owners
    if (!store || !isStoreOwner) {
      return;
    }
    
    // Check if audio notifications are enabled
    const isEnabled = store.enable_audio_notifications ?? true;
    if (!isEnabled) {
      return;
    }
    
    const volume = store.notification_volume ?? 80;
    const repeatCount = store.notification_repeat_count ?? 3;
    
    // Set up real-time subscription for new orders
    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${store.id}`
        },
        (payload) => {
          console.log('New order received:', payload);

          const order = payload.new as any;
          const orderType = order.order_type || 'pickup';

          // Determine notification title and icon based on order type
          const notificationConfig = {
            delivery: {
              title: '🚚 ¡Nueva orden de DELIVERY!',
              icon: '🚚',
            },
            pickup: {
              title: '🏪 ¡Nueva orden para RECOGER!',
              icon: '🏪',
            },
            digital_menu: {
              title: '🍽️ ¡Nueva orden en TIENDA!',
              icon: '🍽️',
            }
          };

          const config = notificationConfig[orderType as keyof typeof notificationConfig] || notificationConfig.pickup;

          // Build description with delivery address if applicable
          let description = `Cliente: ${order.customer_name} - Total: $${Number(order.total_amount).toFixed(2)}`;

          if (orderType === 'delivery' && order.delivery_address) {
            description += `\n📍 ${order.delivery_address}`;
          }

          // Show toast notification with specific styling for delivery
          toast.success(config.title, {
            description,
            duration: orderType === 'delivery' ? 8000 : 5000, // Longer duration for delivery orders
            className: orderType === 'delivery' ? 'border-l-4 border-l-orange-500' : undefined,
          });

          // Play notification sound
          playNotificationSound(volume, repeatCount);
        }
      )
      .subscribe();
    
    channelRef.current = channel;
    
    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [store, isStoreOwner]);
  
  return null;
};
