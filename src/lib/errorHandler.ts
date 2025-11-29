/**
 * Centralized Error Handling
 *
 * Provides utilities for consistent error handling across the application
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

/**
 * Error context for additional information
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  storeId?: string;
  [key: string]: any;
}

/**
 * Custom application error with context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Log error to console and tracking services
 */
export function logError(error: Error | AppError, context?: ErrorContext): void {
  const errorData = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context: context || (error instanceof AppError ? error.context : undefined),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log using logger utility (automatically handles dev/prod)
  logger.group('🔴 Error Logged');
  logger.error('Error:', error);
  logger.error('Context:', errorData.context);
  logger.error('Stack:', error.stack);
  logger.groupEnd();

  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // TODO: Integrate with Sentry, LogRocket, or similar
    // Example with Sentry:
    // Sentry.captureException(error, {
    //   extra: errorData.context,
    //   tags: {
    //     component: errorData.context?.component,
    //     action: errorData.context?.action,
    //   }
    // });
  }

  // Optionally log errors locally (commented out since error_logs table doesn't exist)
  // try {
  //   supabase.from('error_logs').insert({
  //     message: errorData.message,
  //     name: errorData.name,
  //     stack: errorData.stack,
  //     context: errorData.context,
  //     user_agent: errorData.userAgent,
  //     url: errorData.url,
  //     created_at: errorData.timestamp,
  //   });
  // } catch (e) {
  //   // Silently fail
  // }
}

/**
 * Handle Supabase/PostgreSQL specific errors
 */
export function handleDatabaseError(error: any): string {
  // PostgreSQL error codes
  if (error.code === '23505') {
    return 'Este registro ya existe. Por favor, usa un valor diferente.';
  }

  if (error.code === '23503') {
    return 'No se puede eliminar porque está siendo usado por otros registros.';
  }

  if (error.code === '23502') {
    return 'Falta un campo requerido. Por favor, completa todos los campos obligatorios.';
  }

  if (error.code === '42P01') {
    return 'Error de configuración de base de datos. Por favor, contacta al soporte.';
  }

  // Supabase/PostgREST specific errors
  if (error.code === 'PGRST116') {
    return 'No se encontró el registro solicitado.';
  }

  if (error.code === 'PGRST301') {
    return 'Error de autenticación. Por favor, inicia sesión nuevamente.';
  }

  // Row Level Security errors
  if (error.message?.includes('row-level security')) {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (error.message?.includes('permission denied')) {
    return 'Permisos insuficientes. Contacta al administrador.';
  }

  return null;
}

/**
 * Handle network and connection errors
 */
export function handleNetworkError(error: any): string {
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Error de conexión. Por favor, verifica tu conexión a internet.';
  }

  if (error.message?.includes('timeout')) {
    return 'La solicitud tardó demasiado. Por favor, intenta de nuevo.';
  }

  if (error.name === 'NetworkError' || error.name === 'TypeError') {
    return 'Problema de red. Por favor, revisa tu conexión.';
  }

  return null;
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: any): string {
  if (error.message?.includes('JWT') || error.message?.includes('token')) {
    return 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
  }

  if (error.message?.includes('Invalid login credentials')) {
    return 'Credenciales inválidas. Verifica tu email y contraseña.';
  }

  if (error.message?.includes('Email not confirmed')) {
    return 'Por favor, confirma tu email antes de iniciar sesión.';
  }

  if (error.message?.includes('User not found')) {
    return 'Usuario no encontrado. Verifica tu email.';
  }

  return null;
}

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error: any): string {
  // Try specific error handlers first
  const dbError = handleDatabaseError(error);
  if (dbError) return dbError;

  const networkError = handleNetworkError(error);
  if (networkError) return networkError;

  const authError = handleAuthError(error);
  if (authError) return authError;

  // Generic fallback
  if (error.message) {
    return error.message;
  }

  return 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.';
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (
        error.code === '23505' || // Unique violation
        error.code === '23503' || // Foreign key violation
        error.code === 'PGRST301' || // Auth error
        error.message?.includes('JWT')
      ) {
        throw error;
      }

      // Last attempt, throw error
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Call retry callback
      onRetry?.(attempt + 1, lastError);

      // Calculate delay with optional exponential backoff
      const retryDelay = backoff ? delay * Math.pow(2, attempt) : delay;

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError!;
}

/**
 * Safe async wrapper that catches and logs errors
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: ErrorContext
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    logError(error as Error, context);
    return fallback;
  }
}

/**
 * Check if error is a known type
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: any): boolean {
  return (
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError'
  );
}

/**
 * Check if error is auth-related
 */
export function isAuthError(error: any): boolean {
  return (
    error.message?.includes('JWT') ||
    error.message?.includes('token') ||
    error.message?.includes('auth') ||
    error.code === 'PGRST301'
  );
}

/**
 * Format error for display to user
 */
export function formatErrorMessage(error: Error | AppError): string {
  if (error instanceof AppError && error.message) {
    return error.message;
  }

  return handleApiError(error);
}
