import { useEffect } from 'react';

/**
 * Hook for setting dev_subdomain from URL parameter
 *
 * Usage: Add ?store=totus or ?subdomain=totus to URL
 * The hook will automatically set localStorage and reload
 *
 * Examples:
 * - http://localhost:8080?store=totus
 * - http://192.168.1.10:8080?subdomain=www
 */
export function useDevSubdomain() {
  useEffect(() => {
    // Only run in development (localhost or local IP)
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');

    if (!isDev) {
      return;
    }

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get('store') || urlParams.get('subdomain');

    if (storeParam) {
      const currentDevSubdomain = localStorage.getItem('dev_subdomain');

      // Only update if different from current value
      if (currentDevSubdomain !== storeParam) {
        console.log(`Setting dev_subdomain to: ${storeParam}`);
        localStorage.setItem('dev_subdomain', storeParam);

        // Remove the parameter from URL and reload
        urlParams.delete('store');
        urlParams.delete('subdomain');

        const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
        window.location.href = newUrl;
      }
    }
  }, []);
}
