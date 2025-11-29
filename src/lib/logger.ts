/**
 * Production-safe logger utility
 * Only logs in development mode to avoid performance overhead and information leakage
 */

const isDevelopment = import.meta.env.DEV;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // Always log errors in all environments
    if (level === 'error') {
      return true;
    }

    // Only log other levels in development
    return isDevelopment;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    // In development, use console with colors
    if (isDevelopment) {
      const styles: Record<LogLevel, string> = {
        log: 'color: #888',
        info: 'color: #0066cc',
        warn: 'color: #ff9900',
        error: 'color: #cc0000',
        debug: 'color: #9900cc',
      };

      console[level](
        `%c${prefix}`,
        styles[level],
        message,
        ...args
      );
    } else {
      // In production, only log errors (could integrate with error tracking service)
      if (level === 'error') {
        console.error(prefix, message, ...args);

        // TODO: Integrate with error tracking service (e.g., Sentry)
        // sendToErrorTracking({ level, message, args });
      }
    }
  }

  log(message: string, ...args: unknown[]): void {
    this.formatMessage('log', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.formatMessage('error', message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.formatMessage('debug', message, ...args);
  }

  /**
   * Group logs together (only in development)
   */
  group(label: string): void {
    if (this.shouldLog('log')) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog('log')) {
      console.groupEnd();
    }
  }

  /**
   * Log a table (only in development)
   */
  table(data: unknown): void {
    if (this.shouldLog('log')) {
      console.table(data);
    }
  }

  /**
   * Time measurement (only in development)
   */
  time(label: string): void {
    if (this.shouldLog('log')) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog('log')) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export as default for easier imports
export default logger;
