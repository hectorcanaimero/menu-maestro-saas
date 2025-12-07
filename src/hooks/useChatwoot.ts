import { useEffect } from 'react';

declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: {
        websiteToken: string;
        baseUrl: string;
      }) => void;
    };
    chatwootSettings?: {
      hideMessageBubble?: boolean;
      position?: 'left' | 'right';
      locale?: string;
      type?: 'standard' | 'expanded_bubble';
    };
    $chatwoot?: {
      toggle: (state?: 'open' | 'close') => void;
      setUser: (identifier: string, user: {
        email?: string;
        name?: string;
        avatar_url?: string;
        phone_number?: string;
      }) => void;
      setCustomAttributes: (attributes: Record<string, any>) => void;
      deleteUser: () => void;
      setLabel: (label: string) => void;
      removeLabel: (label: string) => void;
      reset: () => void;
    };
  }
}

interface ChatwootConfig {
  websiteToken: string;
  baseUrl: string;
  enabled?: boolean;
  hideMessageBubble?: boolean;
  position?: 'left' | 'right';
  locale?: string;
}

/**
 * Custom hook to integrate Chatwoot widget
 * @param config - Chatwoot configuration object
 *
 * @example
 * ```tsx
 * // Basic usage
 * useChatwoot({
 *   websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
 *   baseUrl: 'https://woot.guria.lat',
 * });
 *
 * // With custom settings
 * useChatwoot({
 *   websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
 *   baseUrl: 'https://woot.guria.lat',
 *   enabled: !isAdminRoute,
 *   position: 'right',
 *   locale: 'es',
 * });
 * ```
 */
export const useChatwoot = (config: ChatwootConfig) => {
  const {
    websiteToken,
    baseUrl,
    enabled = true,
    hideMessageBubble = false,
    position = 'right',
    locale = 'es',
  } = config;

  useEffect(() => {
    // Don't load if disabled
    if (!enabled) {
      return;
    }

    // Check if already loaded
    if (window.chatwootSDK) {
      console.log('[Chatwoot] SDK already loaded');
      return;
    }

    // Set Chatwoot settings before loading the SDK
    window.chatwootSettings = {
      hideMessageBubble,
      position,
      locale,
      type: 'standard',
    };

    // Create and inject the script
    const script = document.createElement('script');
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.chatwootSDK) {
        try {
          window.chatwootSDK.run({
            websiteToken,
            baseUrl,
          });
          console.log('[Chatwoot] Widget initialized successfully');
        } catch (error) {
          console.error('[Chatwoot] Failed to initialize widget:', error);
        }
      }
    };

    script.onerror = () => {
      console.error('[Chatwoot] Failed to load SDK script');
    };

    // Append script to document
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      // Remove script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      // Reset Chatwoot
      if (window.$chatwoot) {
        try {
          window.$chatwoot.reset();
        } catch (error) {
          console.error('[Chatwoot] Error during cleanup:', error);
        }
      }
    };
  }, [websiteToken, baseUrl, enabled, hideMessageBubble, position, locale]);

  // Return helper functions to control the widget
  return {
    toggle: (state?: 'open' | 'close') => {
      if (window.$chatwoot) {
        window.$chatwoot.toggle(state);
      }
    },
    setUser: (identifier: string, user: {
      email?: string;
      name?: string;
      avatar_url?: string;
      phone_number?: string;
    }) => {
      if (window.$chatwoot) {
        window.$chatwoot.setUser(identifier, user);
      }
    },
    setCustomAttributes: (attributes: Record<string, any>) => {
      if (window.$chatwoot) {
        window.$chatwoot.setCustomAttributes(attributes);
      }
    },
    reset: () => {
      if (window.$chatwoot) {
        window.$chatwoot.reset();
      }
    },
  };
};
