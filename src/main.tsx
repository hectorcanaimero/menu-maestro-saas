import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import posthog from "posthog-js";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
      // Disable in development to avoid polluting analytics
      loaded: (posthog) => {
        if (import.meta.env.DEV) console.log('[PostHog] Initialized successfully');
      },
    });
  } catch (error) {
    console.error('[PostHog] Failed to initialize:', error);
  }
} else {
  console.warn('[PostHog] Not initialized - missing environment variables');
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary showDetails={import.meta.env.DEV}>
    <App />
  </ErrorBoundary>
);
