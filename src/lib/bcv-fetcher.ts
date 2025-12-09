/**
 * BCV Fetcher
 * Functions to fetch exchange rates from Guria webhooks (BCV data)
 * and update them in Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { BCVResponse, ExchangeRateInsert } from '@/types/exchange-rates';
import { BCV_WEBHOOKS } from '@/types/exchange-rates';

/**
 * Fetch USD to VES rate from BCV webhook
 * @returns Promise with the exchange rate
 */
export async function fetchUSDtoVES(): Promise<number> {
  try {
    const response = await fetch(BCV_WEBHOOKS['USD-VES']);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BCVResponse[] = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response format from BCV webhook');
    }

    const rate = data[0].promedio;

    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error('Invalid exchange rate received');
    }

    console.log(`[BCV] USD → VES: ${rate} (updated: ${data[0].fechaActualizacion})`);
    return rate;
  } catch (error) {
    console.error('[BCV] Error fetching USD → VES rate:', error);
    throw error;
  }
}

/**
 * Fetch EUR to VES rate from BCV webhook
 * @returns Promise with the exchange rate
 */
export async function fetchEURtoVES(): Promise<number> {
  try {
    const response = await fetch(BCV_WEBHOOKS['EUR-VES']);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BCVResponse[] = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response format from BCV webhook');
    }

    const rate = data[0].promedio;

    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error('Invalid exchange rate received');
    }

    console.log(`[BCV] EUR → VES: ${rate} (updated: ${data[0].fechaActualizacion})`);
    return rate;
  } catch (error) {
    console.error('[BCV] Error fetching EUR → VES rate:', error);
    throw error;
  }
}

/**
 * Update exchange rates in Supabase database
 * Fetches rates from BCV webhooks and stores them
 *
 * @param storeId - Optional store ID for store-specific rates (null = global)
 * @returns Promise with success status and rates
 */
export async function updateExchangeRates(
  storeId?: string | null
): Promise<{ success: boolean; usdRate?: number; eurRate?: number; error?: string }> {
  try {
    // Fetch both rates in parallel
    const [usdRate, eurRate] = await Promise.all([
      fetchUSDtoVES().catch(() => null),
      fetchEURtoVES().catch(() => null),
    ]);

    if (!usdRate && !eurRate) {
      throw new Error('Failed to fetch any exchange rates from BCV');
    }

    // Prepare inserts
    const inserts: ExchangeRateInsert[] = [];

    if (usdRate) {
      inserts.push({
        from_currency: 'USD',
        to_currency: 'VES',
        rate: usdRate,
        source: 'bcv_auto',
        store_id: storeId || null,
      });
    }

    if (eurRate) {
      inserts.push({
        from_currency: 'EUR',
        to_currency: 'VES',
        rate: eurRate,
        source: 'bcv_auto',
        store_id: storeId || null,
      });
    }

    // Upsert rates (insert or update if exists)
    for (const insert of inserts) {
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(insert, {
          onConflict: 'from_currency,to_currency,store_id',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`[BCV] Error upserting ${insert.from_currency} → ${insert.to_currency}:`, error);
        throw error;
      }
    }

    console.log('[BCV] Exchange rates updated successfully', {
      usdRate,
      eurRate,
      storeId: storeId || 'global',
    });

    return {
      success: true,
      usdRate: usdRate || undefined,
      eurRate: eurRate || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[BCV] Error updating exchange rates:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get the latest exchange rate from database
 * Used as fallback when webhook fails
 *
 * @param fromCurrency - Source currency (USD or EUR)
 * @param toCurrency - Target currency (VES)
 * @param storeId - Optional store ID
 * @returns Promise with the rate or null
 */
export async function getLatestExchangeRate(
  fromCurrency: 'USD' | 'EUR',
  toCurrency: 'VES',
  storeId?: string | null
): Promise<{ rate: number; lastUpdate: string; source: string } | null> {
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate, last_updated, source')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .eq('store_id', storeId || null)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[BCV] Error fetching latest exchange rate:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      rate: data.rate,
      lastUpdate: data.last_updated,
      source: data.source,
    };
  } catch (error) {
    console.error('[BCV] Error in getLatestExchangeRate:', error);
    return null;
  }
}
