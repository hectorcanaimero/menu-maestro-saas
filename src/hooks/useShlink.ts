import { useState, useCallback } from 'react';
import {
  createPaymentProofShortUrl,
  getShortUrlStats,
  isShlinkConfigured,
  type ShortUrlResponse,
  type ShortUrlStatsResponse,
} from '@/services/shlinkService';

/**
 * React hook for Shlink URL shortener service
 *
 * Provides a React-friendly interface to the Shlink service with automatic
 * loading and error state management.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { shortenPaymentProof, loading, error, isConfigured } = useShlink();
 *
 *   const handleShorten = async () => {
 *     const result = await shortenPaymentProof(longUrl, orderNum, storeName);
 *     if (result) {
 *       console.log('Short URL:', result.shortUrl);
 *     }
 *   };
 *
 *   if (!isConfigured) {
 *     return <div>Shlink not configured</div>;
 *   }
 *
 *   return <button onClick={handleShorten} disabled={loading}>Shorten</button>;
 * }
 * ```
 */
export function useShlink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Shorten a payment proof URL
   *
   * @param longUrl - The long URL to shorten
   * @param orderNumber - Order number for the title
   * @param storeName - Store name for the title
   * @returns ShortUrlResponse object on success, null on error
   */
  const shortenPaymentProof = useCallback(async (
    longUrl: string,
    orderNumber: string,
    storeName: string
  ): Promise<ShortUrlResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await createPaymentProofShortUrl(longUrl, orderNumber, storeName);
      if (!result) {
        setError('Failed to create short URL');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useShlink] Error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch visit statistics for a short URL
   *
   * @param shortCode - The short code to get stats for
   * @returns ShortUrlStatsResponse object on success, null on error
   */
  const fetchStats = useCallback(async (
    shortCode: string
  ): Promise<ShortUrlStatsResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getShortUrlStats(shortCode);
      if (!result) {
        setError('Failed to fetch stats');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useShlink] Error fetching stats:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    isConfigured: isShlinkConfigured(),
    shortenPaymentProof,
    fetchStats,
  };
}
