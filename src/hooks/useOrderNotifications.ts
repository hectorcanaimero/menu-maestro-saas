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
          
          // Show toast notification
          toast.success('¡Nueva orden recibida!', {
            description: `Cliente: ${order.customer_name} - Total: ${order.total_amount}`,
            duration: 5000,
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
