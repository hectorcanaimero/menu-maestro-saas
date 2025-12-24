import { useEffect, useRef } from 'react';
import { updateExchangeRates } from '@/lib/bcv-fetcher';
import { toast } from 'sonner';

/**
 * Hook to automatically update BCV exchange rates every hour
 * Only runs when the tab/window is visible
 */
export function useAutoUpdateRates(storeId: string | undefined, enabled: boolean = false) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    // Only run if enabled and storeId is available
    if (!enabled || !storeId) {
      return;
    }

    const updateRates = async () => {
      try {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

        // Check if at least 1 hour has passed since last update
        if (now - lastUpdateRef.current < oneHour) {
          return;
        }

        const result = await updateExchangeRates(storeId);

        if (result.success) {
          lastUpdateRef.current = now;
          // Optional: Show silent notification
          // toast.success('Tasas de cambio actualizadas', { duration: 2000 });
        } else {
          console.warn('[BCV Auto-Update] Failed to update rates:', result.error);
        }
      } catch (error) {
        console.error('[BCV Auto-Update] Error updating rates:', error);
      }
    };

    // Initial update on mount
    updateRates();

    // Set up interval to check every hour
    intervalRef.current = setInterval(updateRates, 60 * 60 * 1000); // 1 hour

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [storeId, enabled]);

  // Handle visibility change - pause updates when tab is hidden
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, clear interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab is visible again, restart interval
        if (!intervalRef.current && storeId) {
          intervalRef.current = setInterval(async () => {
            try {
              const now = Date.now();
              const oneHour = 60 * 60 * 1000;

              if (now - lastUpdateRef.current >= oneHour) {
                const result = await updateExchangeRates(storeId);
                if (result.success) {
                  lastUpdateRef.current = now;
                }
              }
            } catch (error) {
              console.error('[BCV Auto-Update] Error:', error);
            }
          }, 60 * 60 * 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, storeId]);
}
