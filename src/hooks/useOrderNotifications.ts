import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";

// Generate notification sound using Web Audio API
const playNotificationSound = (volume: number, repeatCount: number) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playBeep = async () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set volume (0-1)
    gainNode.gain.value = volume / 100;
    
    // Set frequency for a pleasant notification sound
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    
    const now = audioContext.currentTime;
    oscillator.start(now);
    
    // Create envelope for smooth sound
    gainNode.gain.setValueAtTime(volume / 100, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.stop(now + 0.3);
    
    // Wait for the beep to finish before next iteration
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  
  // Play the beep multiple times
  const playSequence = async () => {
    for (let i = 0; i < repeatCount; i++) {
      await playBeep();
    }
  };
  
  playSequence();
};

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
