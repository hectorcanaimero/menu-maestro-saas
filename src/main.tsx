import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom';
import { useEffect } from 'react';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import posthog from 'posthog-js';
import ReactGA from 'react-ga4';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize Sentry with professional configuration
Sentry.init({
  dsn: 'https://63afd0c5a58daa15228eba85ac8356eb@o172702.ingest.us.sentry.io/4510482187878400',

  // Environment detection
  environment: import.meta.env.MODE,

  // Release tracking with git commit hash
  release: import.meta.env.VITE_APP_VERSION || 'development',

  // Enable debug mode in development to see what's happening
  debug: import.meta.env.DEV,

  // Performance Monitoring
  integrations: [
    // React Router integration for automatic navigation tracking
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),

    // Session Replay with privacy controls
    Sentry.replayIntegration({
      // Mask all text content by default
      maskAllText: true,
      // Mask all input fields
      maskAllInputs: true,
      // Block all media elements (images, videos)
      blockAllMedia: false,
      // Network details recording
      networkDetailAllowUrls: [window.location.origin],
      networkCaptureBodies: true,
      networkRequestHeaders: ['X-Custom-Header'],
      networkResponseHeaders: ['X-Custom-Header'],
    }),

    // Note: Sentry User Feedback widget removed - using Chatwoot for support instead
    // See src/pages/admin/AdminDashboard.tsx for Chatwoot integration

    // Browser Profiling for performance insights
    Sentry.browserProfilingIntegration(),

    // Additional integrations
    Sentry.browserTracingIntegration({
      // Trace all XHR and fetch requests
      traceFetch: true,
      traceXHR: true,
      // Enable long task monitoring
      enableLongTask: true,
      // Enable interaction tracking
      enableInp: true,
    }),
  ],

  // Performance Monitoring - Sample 100% in dev, 20% in production
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,

  // Session Replay - Sample 10% of sessions, 100% of error sessions
  replaysSessionSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Profiling - Sample 100% in dev, 10% in production
  profilesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,

  // Enhanced error tracking
  beforeSend(event, hint) {
    // Add custom context
    const error = hint.originalException;

    // In development, log all events to console for debugging
    if (import.meta.env.DEV) {
      console.log('🚀 Sentry Event:', event);
      console.log('💡 Hint:', hint);
    }

    // Filter out specific errors we don't want to track (ONLY in production)
    if (!import.meta.env.DEV && error && typeof error === 'object' && 'message' in error) {
      const errorMessage = String(error.message);
      // Ignore ResizeObserver errors (common browser quirk)
      if (errorMessage.includes('ResizeObserver')) {
        return null;
      }
      // Ignore certain network errors
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        // Still send but tag them
        event.tags = { ...event.tags, network_error: true };
      }
    }

    return event;
  },

  // Breadcrumbs configuration
  maxBreadcrumbs: 50,

  // Attach stack trace to all messages
  attachStacktrace: true,

  // Send default PII (Personally Identifiable Information)
  sendDefaultPii: false,

  // Custom tags for all events
  initialScope: {
    tags: {
      app_type: 'restaurant_ordering',
      platform: 'web',
    },
  },
});

// Initialize PostHog before rendering the app
// Only initialize if environment variables are set
if (import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_HOST) {
  try {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST,
      // Enable autocapture for automatic event tracking
      autocapture: true,
      // Enable session recording with GDPR compliance
      session_recording: {
        maskAllInputs: true, // Mask all input fields for privacy
        maskTextSelector: '[data-sensitive]', // Mask elements with data-sensitive attribute
      },
      // Automatically capture pageviews
      capture_pageview: true,
      // Privacy & Security Configuration
      persistence: 'localStorage', // Use localStorage but with minimal data
      sanitize_properties: (properties) => {
        // Remove any sensitive data from properties before storing
        const sanitized = { ...properties };
        // Remove email addresses, phone numbers, and other PII
        const sensitiveKeys = ['email', 'customer_email', 'phone', 'customer_phone', 'address', 'delivery_address'];
        sensitiveKeys.forEach((key) => {
          if (sanitized[key]) {
            delete sanitized[key];
          }
        });
        return sanitized;
      },
      // Disable storing sensitive user properties in localStorage
      property_blacklist: ['$email', 'email', 'customer_email', 'customer_phone', 'phone'],
      // Disable in development to avoid polluting analytics
      loaded: (posthog) => {
        // PostHog initialized successfully
      },
    });
  } catch (error) {
    //
  }
}

// Initialize Google Analytics 4 (GA4)
// Only initialize if Measurement ID is set
if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
  try {
    ReactGA.initialize(import.meta.env.VITE_GA4_MEASUREMENT_ID, {
      // Configuration options
      gaOptions: {
        // Anonymize IP addresses for GDPR compliance
        anonymize_ip: true,
        // Cookie configuration
        cookie_flags: 'SameSite=None;Secure',
      },
      // Google Tag Manager options (if needed)
      gtagOptions: {
        // Send page views manually via hook instead of automatic
        send_page_view: false,
        // Additional privacy settings
        allow_google_signals: false, // Disable advertising features
        allow_ad_personalization_signals: false, // Disable ad personalization
      },
    });

    // Only log in development
    if (import.meta.env.DEV) {
      console.log('✅ Google Analytics initialized');
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Failed to initialize Google Analytics:', error);
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary
    fallback={({ error, resetError }) => (
      <ErrorBoundary showDetails={import.meta.env.DEV}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Algo salió mal</h2>
          <p>Lo sentimos, ha ocurrido un error inesperado.</p>
          {import.meta.env.DEV && <pre style={{ textAlign: 'left', overflow: 'auto' }}>{String(error)}</pre>}
          <button onClick={resetError} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Intentar de nuevo
          </button>
        </div>
      </ErrorBoundary>
    )}
    showDialog
  >
    <App />
  </Sentry.ErrorBoundary>,
);
