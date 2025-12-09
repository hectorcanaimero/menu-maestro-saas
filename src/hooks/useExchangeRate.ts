/**
 * useExchangeRate Hook
 * Hook to get exchange rates with manual/automatic fallback logic
 */

import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { getLatestExchangeRate } from '@/lib/bcv-fetcher';
import type { ExchangeRateResult } from '@/types/exchange-rates';

/**
 * Custom hook to get exchange rate for currency conversion
 *
 * Logic:
 * 1. If store has enable_currency_conversion = false → return null
 * 2. If use_manual_exchange_rate = true → use manual rate from store
 * 3. If use_manual_exchange_rate = false → query exchange_rates table
 * 4. Fallback: if no rate available, return null
 *
 * @param fromCurrency - Source currency (USD or EUR)
 * @param toCurrency - Target currency (VES)
 * @returns Exchange rate result with metadata
 */
export function useExchangeRate(
  fromCurrency: 'USD' | 'EUR',
  toCurrency: 'VES'
): ExchangeRateResult {
  const { store } = useStore();
  const [result, setResult] = useState<ExchangeRateResult>({
    rate: null,
    isLoading: true,
    lastUpdate: null,
    source: null,
    error: null,
  });

  useEffect(() => {
    async function fetchRate() {
      // If store not loaded yet
      if (!store) {
        setResult({
          rate: null,
          isLoading: true,
          lastUpdate: null,
          source: null,
          error: null,
        });
        return;
      }

      // If currency conversion is not enabled for this store
      if (!store.enable_currency_conversion) {
        setResult({
          rate: null,
          isLoading: false,
          lastUpdate: null,
          source: null,
          error: null,
        });
        return;
      }

      // If using manual exchange rate
      if (store.use_manual_exchange_rate) {
        const manualRate =
          fromCurrency === 'USD'
            ? store.manual_usd_ves_rate
            : store.manual_eur_ves_rate;

        if (manualRate && manualRate > 0) {
          setResult({
            rate: manualRate,
            isLoading: false,
            lastUpdate: new Date().toISOString(),
            source: 'manual',
            error: null,
          });
        } else {
          setResult({
            rate: null,
            isLoading: false,
            lastUpdate: null,
            source: null,
            error: 'Manual rate not configured',
          });
        }
        return;
      }

      // Use automatic BCV rate from database
      try {
        const data = await getLatestExchangeRate(
          fromCurrency,
          toCurrency,
          store.id
        );

        if (data) {
          setResult({
            rate: data.rate,
            isLoading: false,
            lastUpdate: data.lastUpdate,
            source: data.source as 'bcv_auto' | 'manual',
            error: null,
          });
        } else {
          // No rate found in database - try global rate
          const globalData = await getLatestExchangeRate(
            fromCurrency,
            toCurrency,
            null
          );

          if (globalData) {
            setResult({
              rate: globalData.rate,
              isLoading: false,
              lastUpdate: globalData.lastUpdate,
              source: globalData.source as 'bcv_auto' | 'manual',
              error: null,
            });
          } else {
            setResult({
              rate: null,
              isLoading: false,
              lastUpdate: null,
              source: null,
              error: 'No exchange rate available',
            });
          }
        }
      } catch (error) {
        console.error('[useExchangeRate] Error fetching rate:', error);
        setResult({
          rate: null,
          isLoading: false,
          lastUpdate: null,
          source: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    fetchRate();
  }, [
    store,
    fromCurrency,
    toCurrency,
    store?.enable_currency_conversion,
    store?.use_manual_exchange_rate,
    store?.manual_usd_ves_rate,
    store?.manual_eur_ves_rate,
  ]);

  return result;
}
