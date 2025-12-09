import { useEffect } from 'react';
import posthog from 'posthog-js';
import { TRACKING_EVENTS, trackEvent } from '@/lib/posthog-experiments';

/**
 * Custom hook for PostHog analytics and tracking
 * Provides easy-to-use functions for tracking user interactions
 */
export const usePostHog = () => {
  const isEnabled = () => {
    return typeof window !== 'undefined' && window.posthog !== undefined;
  };

  /**
   * Track a custom event
   */
  const track = (eventName: string, properties?: Record<string, any>) => {
    if (isEnabled()) {
      trackEvent(eventName, properties);
    }
  };

  /**
   * Track page view
   */
  const trackPageView = (pageName: string, properties?: Record<string, any>) => {
    if (isEnabled()) {
      posthog.capture('$pageview', {
        page_name: pageName,
        ...properties,
      });
    }
  };

  /**
   * Identify user with properties
   */
  const identify = (userId: string, properties?: Record<string, any>) => {
    if (isEnabled()) {
      posthog.identify(userId, properties);
    }
  };

  /**
   * Set user properties
   */
  const setUserProperties = (properties: Record<string, any>) => {
    if (isEnabled()) {
      posthog.people.set(properties);
    }
  };

  /**
   * Track scroll depth
   */
  const trackScrollDepth = (percentage: 25 | 50 | 75 | 100) => {
    const eventMap = {
      25: TRACKING_EVENTS.SCROLL_DEPTH_25,
      50: TRACKING_EVENTS.SCROLL_DEPTH_50,
      75: TRACKING_EVENTS.SCROLL_DEPTH_75,
      100: TRACKING_EVENTS.SCROLL_DEPTH_100,
    };

    track(eventMap[percentage], { scroll_percentage: percentage });
  };

  return {
    track,
    trackPageView,
    identify,
    setUserProperties,
    trackScrollDepth,
    isEnabled: isEnabled(),
    events: TRACKING_EVENTS,
  };
};

/**
 * Hook to track when a component is viewed (enters viewport)
 */
export const useTrackView = (eventName: string, threshold = 0.5) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackEvent(eventName);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    const element = document.getElementById(eventName);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [eventName, threshold]);
};

/**
 * Hook to track scroll depth
 */
export const useTrackScrollDepth = () => {
  useEffect(() => {
    const tracked = {
      25: false,
      50: false,
      75: false,
      100: false,
    };

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const percentage = Math.round((scrolled / scrollHeight) * 100);

      if (percentage >= 25 && !tracked[25]) {
        trackEvent(TRACKING_EVENTS.SCROLL_DEPTH_25, { percentage: 25 });
        tracked[25] = true;
      }
      if (percentage >= 50 && !tracked[50]) {
        trackEvent(TRACKING_EVENTS.SCROLL_DEPTH_50, { percentage: 50 });
        tracked[50] = true;
      }
      if (percentage >= 75 && !tracked[75]) {
        trackEvent(TRACKING_EVENTS.SCROLL_DEPTH_75, { percentage: 75 });
        tracked[75] = true;
      }
      if (percentage >= 100 && !tracked[100]) {
        trackEvent(TRACKING_EVENTS.SCROLL_DEPTH_100, { percentage: 100 });
        tracked[100] = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
};
