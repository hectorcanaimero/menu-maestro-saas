/**
 * Sentry Utilities
 *
 * Professional utilities for enhanced Sentry tracking, monitoring, and debugging.
 * This file provides helpers for custom instrumentation, performance tracking,
 * and error handling throughout the application.
 */

import * as Sentry from '@sentry/react';

/**
 * Track a custom business event in Sentry
 * Useful for tracking important business actions like orders, payments, etc.
 */
export const trackBusinessEvent = (
  eventName: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.captureMessage(eventName, {
    level,
    tags: {
      event_type: 'business_event',
      event_name: eventName,
    },
    extra: data,
  });
};

/**
 * Track order-related events
 */
export const trackOrderEvent = (
  action: 'created' | 'updated' | 'cancelled' | 'completed',
  orderId: string,
  orderData?: Record<string, any>
) => {
  trackBusinessEvent(`Order ${action}`, {
    order_id: orderId,
    action,
    ...orderData,
  });

  // Add breadcrumb for order flow
  Sentry.addBreadcrumb({
    category: 'order',
    message: `Order ${action}: ${orderId}`,
    level: 'info',
    data: orderData,
  });
};

/**
 * Track payment-related events
 */
export const trackPaymentEvent = (
  action: 'initiated' | 'completed' | 'failed',
  paymentData?: Record<string, any>
) => {
  trackBusinessEvent(`Payment ${action}`, paymentData);

  Sentry.addBreadcrumb({
    category: 'payment',
    message: `Payment ${action}`,
    level: action === 'failed' ? 'error' : 'info',
    data: paymentData,
  });
};

/**
 * Track WhatsApp redirections
 */
export const trackWhatsAppRedirect = (orderId: string, phoneNumber: string) => {
  trackBusinessEvent('WhatsApp Redirect', {
    order_id: orderId,
    phone_number: phoneNumber.substring(0, 5) + '****', // Mask phone number
  });
};

/**
 * Start a performance transaction for a specific operation
 * Returns a transaction that should be finished when the operation completes
 */
export const startPerformanceTransaction = (
  name: string,
  operation: string,
  data?: Record<string, any>
) => {
  const transaction = Sentry.startTransaction({
    name,
    op: operation,
    data,
  });

  return transaction;
};

/**
 * Measure the performance of an async operation
 */
export const measureAsyncOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const transaction = Sentry.startTransaction({
    name: operationName,
    op: 'function',
    data: metadata,
  });

  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    Sentry.captureException(error, {
      tags: {
        operation: operationName,
      },
      extra: metadata,
    });
    throw error;
  } finally {
    transaction.finish();
  }
};

/**
 * Add custom breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Set custom tags for the current scope
 */
export const setCustomTags = (tags: Record<string, string | number | boolean>) => {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
};

/**
 * Set custom context for the current scope
 */
export const setCustomContext = (
  contextName: string,
  context: Record<string, any>
) => {
  Sentry.setContext(contextName, context);
};

/**
 * Capture an exception with additional context
 */
export const captureException = (
  error: Error,
  context?: {
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
    fingerprint?: string[];
  }
) => {
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'error',
    fingerprint: context?.fingerprint,
  });
};

/**
 * Capture a message with context
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, any>;
  }
) => {
  Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
};

/**
 * Track navigation events
 */
export const trackNavigation = (from: string, to: string) => {
  addBreadcrumb(`Navigation: ${from} -> ${to}`, 'navigation', {
    from,
    to,
  });
};

/**
 * Track API calls
 */
export const trackAPICall = (
  endpoint: string,
  method: string,
  status?: number,
  error?: Error
) => {
  addBreadcrumb(
    `API ${method} ${endpoint}`,
    'api',
    {
      endpoint,
      method,
      status,
      error: error?.message,
    },
    error ? 'error' : 'info'
  );
};

/**
 * Track Supabase errors
 */
export const trackSupabaseError = (
  operation: string,
  error: any,
  context?: Record<string, any>
) => {
  captureException(new Error(`Supabase Error: ${operation}`), {
    tags: {
      error_type: 'supabase',
      operation,
    },
    extra: {
      supabase_error: error,
      ...context,
    },
    level: 'error',
  });
};

/**
 * Wrap a function with error tracking
 */
export const withErrorTracking = <T extends (...args: any[]) => any>(
  fn: T,
  context?: {
    name?: string;
    tags?: Record<string, string | number | boolean>;
  }
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          captureException(error, {
            tags: {
              function: context?.name || fn.name,
              ...context?.tags,
            },
          });
          throw error;
        });
      }

      return result;
    } catch (error) {
      captureException(error as Error, {
        tags: {
          function: context?.name || fn.name,
          ...context?.tags,
        },
      });
      throw error;
    }
  }) as T;
};

/**
 * Create a span within the current transaction for detailed performance tracking
 */
export const createSpan = (
  operation: string,
  description: string,
  data?: Record<string, any>
) => {
  const activeTransaction = Sentry.getCurrentHub().getScope()?.getTransaction();

  if (!activeTransaction) {
    return null;
  }

  return activeTransaction.startChild({
    op: operation,
    description,
    data,
  });
};

/**
 * Track user actions (clicks, form submissions, etc.)
 */
export const trackUserAction = (
  action: string,
  element?: string,
  metadata?: Record<string, any>
) => {
  addBreadcrumb(
    `User action: ${action}`,
    'user',
    {
      action,
      element,
      ...metadata,
    }
  );
};

/**
 * Track cart operations
 */
export const trackCartOperation = (
  operation: 'add' | 'remove' | 'update' | 'clear',
  productId?: string,
  metadata?: Record<string, any>
) => {
  addBreadcrumb(
    `Cart ${operation}`,
    'cart',
    {
      operation,
      product_id: productId,
      ...metadata,
    }
  );
};

/**
 * Track authentication events
 */
export const trackAuthEvent = (
  event: 'login' | 'logout' | 'signup' | 'password_reset',
  success: boolean,
  error?: Error
) => {
  addBreadcrumb(
    `Auth ${event}: ${success ? 'success' : 'failed'}`,
    'auth',
    {
      event,
      success,
      error: error?.message,
    },
    success ? 'info' : 'warning'
  );

  if (!success && error) {
    captureException(error, {
      tags: {
        auth_event: event,
      },
      level: 'warning',
    });
  }
};

/**
 * Enable or disable Sentry in the current session (useful for testing)
 */
export const setSentryEnabled = (enabled: boolean) => {
  const client = Sentry.getCurrentHub().getClient();
  if (client) {
    client.getOptions().enabled = enabled;
  }
};

/**
 * Flush all pending events (useful before page unload)
 */
export const flushSentry = async (timeout = 2000) => {
  await Sentry.flush(timeout);
};
