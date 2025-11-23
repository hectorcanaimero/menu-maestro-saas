/**
 * useErrorHandler Hook
 *
 * Custom hook for consistent error handling across the application
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  AppError,
  ErrorContext,
  logError,
  formatErrorMessage,
  isNetworkError,
  isAuthError,
} from '@/lib/errorHandler';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for centralized error handling
 *
 * @example
 * ```tsx
 * const { handleError } = useErrorHandler();
 *
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleError(error, { component: 'MyComponent', action: 'fetchData' });
 * }
 * ```
 */
export function useErrorHandler() {
  const navigate = useNavigate();

  /**
   * Main error handler
   */
  const handleError = useCallback(
    (error: Error | AppError, context?: ErrorContext) => {
      // Log the error
      logError(error, context);

      // Get user-friendly message
      const message = formatErrorMessage(error);

      // Handle auth errors - redirect to login
      if (isAuthError(error)) {
        toast.error('Sesión expirada', {
          description: message,
        });
        navigate('/auth');
        return;
      }

      // Handle network errors
      if (isNetworkError(error)) {
        toast.error('Error de conexión', {
          description: message,
          action: {
            label: 'Reintentar',
            onClick: () => window.location.reload(),
          },
        });
        return;
      }

      // Generic error toast
      toast.error('Error', {
        description: message,
      });
    },
    [navigate]
  );

  /**
   * Handle error with success alternative
   * Shows success toast on success, error toast on failure
   */
  const handleOperation = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options: {
        successMessage?: string;
        errorContext?: ErrorContext;
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
      } = {}
    ): Promise<T | undefined> => {
      try {
        const result = await operation();

        if (options.successMessage) {
          toast.success(options.successMessage);
        }

        options.onSuccess?.(result);
        return result;
      } catch (error) {
        handleError(error as Error, options.errorContext);
        options.onError?.(error as Error);
        return undefined;
      }
    },
    [handleError]
  );

  /**
   * Handle error silently (no toast)
   * Only logs the error
   */
  const handleSilentError = useCallback(
    (error: Error | AppError, context?: ErrorContext) => {
      logError(error, context);
    },
    []
  );

  /**
   * Handle warning (not an error, but something to notify)
   */
  const handleWarning = useCallback((message: string, description?: string) => {
    toast.warning(message, { description });
  }, []);

  /**
   * Handle info message
   */
  const handleInfo = useCallback((message: string, description?: string) => {
    toast.info(message, { description });
  }, []);

  return {
    handleError,
    handleOperation,
    handleSilentError,
    handleWarning,
    handleInfo,
  };
}

/**
 * Hook for async operations with loading state
 *
 * @example
 * ```tsx
 * const { execute, loading, error } = useAsyncOperation();
 *
 * const fetchData = async () => {
 *   const result = await execute(
 *     async () => {
 *       const { data } = await supabase.from('table').select();
 *       return data;
 *     },
 *     { errorContext: { component: 'MyComponent', action: 'fetchData' } }
 *   );
 *
 *   if (result) {
 *     // Handle success
 *   }
 * };
 * ```
 */
export function useAsyncOperation<T = any>() {
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = useCallback(
    async (
      operation: () => Promise<T>,
      options: {
        errorContext?: ErrorContext;
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
      } = {}
    ): Promise<T | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const result = await operation();
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        handleError(error, options.errorContext);
        options.onError?.(error);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
}

// Import React for useState
import React from 'react';
