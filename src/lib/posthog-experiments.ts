/**
 * PostHog A/B Testing Experiments Configuration
 *
 * This file contains all A/B testing experiments for the landing page.
 * Each experiment is documented with its purpose, variants, and success metrics.
 */

export interface Experiment {
  key: string;
  name: string;
  description: string;
  variants: string[];
  successMetric: string;
  sampleSize?: number;
}

export const LANDING_PAGE_EXPERIMENTS: Experiment[] = [
  {
    key: 'whatsapp_widget_position',
    name: 'WhatsApp Widget Position',
    description: 'Test optimal position for WhatsApp floating widget',
    variants: ['bottom-right', 'bottom-left'],
    successMetric: 'whatsapp_click_rate',
    sampleSize: 1000,
  },
  {
    key: 'whatsapp_default_message',
    name: 'WhatsApp Default Message',
    description: 'Test which default message generates more engagement',
    variants: [
      '¡Hola! Me gustaría crear mi tienda con PideAI',
      'Hola, quiero información sobre PideAI',
      '¿Cómo funciona PideAI?',
    ],
    successMetric: 'whatsapp_conversion_rate',
    sampleSize: 1500,
  },
  {
    key: 'exit_intent_timing',
    name: 'Exit Intent Popup Timing',
    description: 'Test optimal delay before showing exit intent',
    variants: ['3000ms', '5000ms', '1000ms'],
    successMetric: 'popup_conversion_rate',
    sampleSize: 1000,
  },
  {
    key: 'sticky_cta_copy',
    name: 'Sticky CTA Copy',
    description: 'Test which CTA copy performs better',
    variants: [
      '¿Listo para digitalizar tu negocio?',
      'Crea tu tienda en 5 minutos',
      'Únete a 500+ restaurantes',
    ],
    successMetric: 'sticky_cta_click_rate',
    sampleSize: 1200,
  },
  {
    key: 'hero_headline',
    name: 'Hero Headline Test',
    description: 'Test different value propositions in hero section',
    variants: [
      'Pedidos Fáciles y Rápidos con WhatsApp',
      'Tu Restaurante Digital en 5 Minutos',
      'Aumenta tus Ventas con Pedidos Online',
    ],
    successMetric: 'hero_cta_click_rate',
    sampleSize: 2000,
  },
  {
    key: 'pricing_order',
    name: 'Pricing Plans Order',
    description: 'Test order of pricing plans',
    variants: [
      'starter_business_premium',
      'business_starter_premium',
      'premium_business_starter',
    ],
    successMetric: 'plan_selection_rate',
    sampleSize: 1500,
  },
  {
    key: 'use_cases_default_tab',
    name: 'Use Cases Default Tab',
    description: 'Test which vertical to show first',
    variants: ['pizzerias', 'cafeterias', 'restaurantes', 'food_trucks'],
    successMetric: 'use_case_engagement_time',
    sampleSize: 1000,
  },
  {
    key: 'testimonial_display',
    name: 'Testimonial Display Format',
    description: 'Test testimonial card design',
    variants: ['with_metrics', 'without_metrics', 'video_testimonials'],
    successMetric: 'testimonial_section_time',
    sampleSize: 1200,
  },
];

/**
 * Event tracking configuration
 * These events should be tracked in PostHog for analytics
 */
export const TRACKING_EVENTS = {
  // Hero Section
  HERO_CTA_CLICKED: 'hero_cta_clicked',
  HERO_SECONDARY_CTA_CLICKED: 'hero_secondary_cta_clicked',

  // Use Cases
  USE_CASE_TAB_CLICKED: 'use_case_tab_clicked',
  USE_CASE_SECTION_VIEWED: 'use_case_section_viewed',

  // Pricing
  PRICING_SECTION_VIEWED: 'pricing_section_viewed',
  PRICING_PLAN_CLICKED: 'pricing_plan_clicked',
  PRICING_PLAN_HOVERED: 'pricing_plan_hovered',

  // Social Proof
  TESTIMONIAL_SECTION_VIEWED: 'testimonial_section_viewed',
  TRUST_BADGE_SECTION_VIEWED: 'trust_badge_section_viewed',

  // WhatsApp Widget
  WHATSAPP_WIDGET_OPENED: 'whatsapp_widget_opened',
  WHATSAPP_WIDGET_CLICKED: 'whatsapp_widget_clicked',
  WHATSAPP_MESSAGE_SENT: 'whatsapp_message_sent',

  // Exit Intent
  EXIT_INTENT_SHOWN: 'exit_intent_shown',
  EXIT_INTENT_CONVERTED: 'exit_intent_converted',
  EXIT_INTENT_DISMISSED: 'exit_intent_dismissed',

  // Sticky CTA
  STICKY_CTA_SHOWN: 'sticky_cta_shown',
  STICKY_CTA_CLICKED: 'sticky_cta_clicked',
  STICKY_CTA_DISMISSED: 'sticky_cta_dismissed',

  // Scroll Depth
  SCROLL_DEPTH_25: 'scroll_depth_25',
  SCROLL_DEPTH_50: 'scroll_depth_50',
  SCROLL_DEPTH_75: 'scroll_depth_75',
  SCROLL_DEPTH_100: 'scroll_depth_100',
} as const;

/**
 * Funnel stages for conversion tracking
 */
export const CONVERSION_FUNNELS = {
  LANDING_TO_SIGNUP: [
    'landing_page_viewed',
    'pricing_section_viewed',
    'cta_clicked',
    'signup_started',
    'signup_completed',
  ],
  WHATSAPP_ENGAGEMENT: [
    'whatsapp_widget_shown',
    'whatsapp_widget_opened',
    'whatsapp_widget_clicked',
    'whatsapp_message_sent',
  ],
  EXIT_INTENT_RECOVERY: [
    'exit_intent_triggered',
    'exit_intent_shown',
    'exit_intent_cta_clicked',
    'signup_from_exit_intent',
  ],
} as const;

/**
 * User properties to track for segmentation
 */
export const USER_PROPERTIES = {
  DEVICE_TYPE: 'device_type', // mobile, tablet, desktop
  TRAFFIC_SOURCE: 'traffic_source', // organic, paid, referral, direct
  FIRST_PAGE_VIEWED: 'first_page_viewed',
  TOTAL_SESSIONS: 'total_sessions',
  HAS_SCROLLED_TO_PRICING: 'has_scrolled_to_pricing',
  USE_CASE_INTEREST: 'use_case_interest', // pizzerias, cafeterias, etc.
  PREFERRED_LANGUAGE: 'preferred_language',
} as const;

/**
 * Helper function to track experiments (to be implemented with PostHog SDK)
 */
export const trackExperiment = (experimentKey: string, variant: string) => {
  // This will be implemented when PostHog is configured
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture('experiment_viewed', {
      experiment_key: experimentKey,
      variant: variant,
    });
  }
};

/**
 * Helper function to track events (to be implemented with PostHog SDK)
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // This will be implemented when PostHog is configured
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(eventName, properties);
  }
};
