/**
 * Shlink URL Shortener Service
 *
 * Handles all interactions with Shlink REST API v3 for URL shortening.
 * This service follows a non-blocking error handling pattern - all errors
 * return null instead of throwing exceptions to prevent disrupting user flows.
 *
 * @see https://shlink.io/documentation/api-docs/
 */

export interface ShlinkConfig {
  apiUrl: string;
  apiKey: string;
  defaultTag: string;
}

export interface ShortUrlResponse {
  shortUrl: string;      // Full short URL (e.g., "https://x.pideai.com/abc123")
  shortCode: string;     // Short code only (e.g., "abc123")
  longUrl: string;       // Original long URL
  title?: string;        // Custom title for the short URL
  tags?: string[];       // Tags for categorization
  visitsSummary?: {
    total: number;       // Total visits (including bots)
    nonBots: number;     // Human visits only
    bots: number;        // Bot visits
  };
}

export interface ShortUrlStatsResponse {
  shortCode: string;
  visitsSummary: {
    total: number;
    nonBots: number;
    bots: number;
  };
}

/**
 * Default configuration from environment variables
 */
const DEFAULT_CONFIG: ShlinkConfig = {
  apiUrl: import.meta.env.VITE_SHLINK_API_URL || 'https://x.pideai.com/rest/v3',
  apiKey: import.meta.env.VITE_SHLINK_API_KEY || '',
  defaultTag: 'payment-proofs',
};

/**
 * Check if Shlink service is properly configured
 *
 * @returns true if API URL and API key are both configured
 */
export function isShlinkConfigured(): boolean {
  const isConfigured = Boolean(DEFAULT_CONFIG.apiKey && DEFAULT_CONFIG.apiUrl);

  if (!isConfigured) {
    console.warn('[Shlink] Service not configured - missing VITE_SHLINK_API_URL or VITE_SHLINK_API_KEY');
  }

  return isConfigured;
}

/**
 * Generate descriptive title for payment proof short URL
 *
 * @param orderNumber - Order number (e.g., "ABC12345")
 * @param storeName - Store name
 * @returns Formatted title (e.g., "Pago Orden #ABC12345 - Mi Tienda")
 */
export function generatePaymentProofTitle(
  orderNumber: string,
  storeName: string
): string {
  return `Pago Orden #${orderNumber} - ${storeName}`;
}

/**
 * Create a short URL via Shlink API
 *
 * This function implements graceful error handling - it will never throw exceptions.
 * Any errors (network, API, validation) will log to console and return null.
 *
 * @param longUrl - The long URL to shorten (must be a valid HTTP/HTTPS URL)
 * @param options - Optional configuration
 * @param options.title - Custom title for the short URL
 * @param options.tags - Array of tags for categorization (default: ['payment-proofs'])
 * @param options.findIfExists - Whether to reuse existing short URL for same long URL (default: true)
 * @returns ShortUrlResponse object on success, null on any error
 *
 * @example
 * ```typescript
 * const result = await createShortUrl('https://example.com/long/url', {
 *   title: 'My Short Link',
 *   tags: ['payment-proofs', 'store-123']
 * });
 *
 * if (result) {
 *   console.log(result.shortUrl); // "https://x.pideai.com/abc123"
 * }
 * ```
 */
export async function createShortUrl(
  longUrl: string,
  options?: {
    title?: string;
    tags?: string[];
    findIfExists?: boolean;
  }
): Promise<ShortUrlResponse | null> {
  // Validate configuration
  if (!isShlinkConfigured()) {
    return null;
  }

  // Validate input URL
  if (!longUrl || !longUrl.startsWith('http')) {
    console.error('[Shlink] Invalid URL provided:', longUrl);
    return null;
  }

  try {
    const requestBody = {
      longUrl,
      title: options?.title,
      tags: options?.tags || [DEFAULT_CONFIG.defaultTag],
      findIfExists: options?.findIfExists ?? true, // Reuse existing by default
      validateUrl: true, // Validate URL is accessible
    };

    const response = await fetch(`${DEFAULT_CONFIG.apiUrl}/short-urls`, {
      method: 'POST',
      headers: {
        'X-Api-Key': DEFAULT_CONFIG.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown',
        message: `HTTP ${response.status}`,
      }));
      console.error('[Shlink] API error:', response.status, errorData);
      return null;
    }

    const data = await response.json();

    return {
      shortUrl: data.shortUrl?.replace(/^http:\/\//, 'https://'),
      shortCode: data.shortCode,
      longUrl: data.longUrl,
      title: data.title,
      tags: data.tags,
      visitsSummary: data.visitsSummary,
    };
  } catch (error) {
    console.error('[Shlink] Network error creating short URL:', error);
    return null;
  }
}

/**
 * Get statistics for a short URL
 *
 * Retrieves visit statistics including total visits, human visits, and bot visits.
 * Like createShortUrl, this function never throws - returns null on any error.
 *
 * @param shortCode - The short code (e.g., "abc123")
 * @returns ShortUrlStatsResponse object on success, null on any error
 *
 * @example
 * ```typescript
 * const stats = await getShortUrlStats('abc123');
 * if (stats) {
 *   console.log(`Total clicks: ${stats.visitsSummary.total}`);
 *   console.log(`Human clicks: ${stats.visitsSummary.nonBots}`);
 * }
 * ```
 */
export async function getShortUrlStats(
  shortCode: string
): Promise<ShortUrlStatsResponse | null> {
  // Validate configuration
  if (!isShlinkConfigured() || !shortCode) {
    return null;
  }

  try {
    const response = await fetch(
      `${DEFAULT_CONFIG.apiUrl}/short-urls/${shortCode}`,
      {
        method: 'GET',
        headers: {
          'X-Api-Key': DEFAULT_CONFIG.apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[Shlink] Stats fetch failed:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      shortCode: data.shortCode,
      visitsSummary: data.visitsSummary || {
        total: 0,
        nonBots: 0,
        bots: 0,
      },
    };
  } catch (error) {
    console.error('[Shlink] Network error fetching stats:', error);
    return null;
  }
}

/**
 * Convenience wrapper for creating payment proof short URLs
 *
 * This is a specialized version of createShortUrl specifically for payment proofs.
 * It automatically generates an appropriate title and uses the payment-proofs tag.
 *
 * @param longUrl - The payment proof URL from Supabase Storage
 * @param orderNumber - Order number for the title
 * @param storeName - Store name for the title
 * @returns ShortUrlResponse object on success, null on any error
 *
 * @example
 * ```typescript
 * const result = await createPaymentProofShortUrl(
 *   'https://supabase.co/storage/payment-proofs/abc.jpg',
 *   'ABC12345',
 *   'Mi Tienda'
 * );
 *
 * if (result) {
 *   // Use result.shortUrl in WhatsApp message
 *   console.log(result.shortUrl); // "https://x.pideai.com/xyz789"
 * }
 * ```
 */
export async function createPaymentProofShortUrl(
  longUrl: string,
  orderNumber: string,
  storeName: string
): Promise<ShortUrlResponse | null> {
  return createShortUrl(longUrl, {
    title: generatePaymentProofTitle(orderNumber, storeName),
    tags: [DEFAULT_CONFIG.defaultTag],
    findIfExists: true, // Reuse if same URL already shortened
  });
}
