/**
 * Structured Logging Utility
 *
 * This logger provides structured logging that can be easily integrated with
 * centralized logging services like Datadog, LogRocket, Sentry, CloudWatch, etc.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User action', { userId: 123, action: 'checkout' });
 *   logger.error('Payment failed', { error, orderId: 456 });
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  stack?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isServer: boolean;

  constructor() {
    // Get log level from environment, default to INFO
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    this.logLevel = envLogLevel || LogLevel.INFO;
    this.isServer = typeof window === 'undefined';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = this.sanitizeContext(context);
    }

    if (error) {
      entry.stack = error.stack;
      if (!entry.context) {
        entry.context = {};
      }
      entry.context.errorName = error.name;
      entry.context.errorMessage = error.message;
    }

    return entry;
  }

  /**
   * Sanitize sensitive data from log context
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'cvv', 'cardNumber', 'ssn', 'apiKey'];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.formatLogEntry(level, message, context, error);

    // Console output with appropriate styling
    const consoleMethod = level === LogLevel.ERROR ? 'error' :
                         level === LogLevel.WARN ? 'warn' :
                         level === LogLevel.DEBUG ? 'debug' : 'log';

    if (process.env.NODE_ENV === 'development') {
      // Pretty print in development
      console[consoleMethod](
        `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`,
        logEntry.context || '',
        error || ''
      );
    } else {
      // JSON format for production (easier to parse by log aggregators)
      console[consoleMethod](JSON.stringify(logEntry));
    }

    // Send to centralized logging service
    this.sendToLoggingService(logEntry);
  }

  /**
   * Send logs to external logging service
   * TODO: Implement integration with your logging service (Datadog, LogRocket, etc.)
   */
  private sendToLoggingService(logEntry: LogEntry): void {
    // Example integrations:

    // Sentry (for errors)
    // if (logEntry.level === LogLevel.ERROR && typeof window !== 'undefined') {
    //   Sentry.captureException(new Error(logEntry.message), {
    //     extra: logEntry.context,
    //   });
    // }

    // Datadog
    // if (typeof window !== 'undefined' && window.DD_LOGS) {
    //   window.DD_LOGS.logger.log(
    //     logEntry.message,
    //     logEntry.context,
    //     logEntry.level
    //   );
    // }

    // LogRocket
    // if (typeof window !== 'undefined' && window.LogRocket) {
    //   window.LogRocket.log(logEntry.level, logEntry.message, logEntry.context);
    // }

    // Custom backend endpoint
    // if (this.isServer && logEntry.level === LogLevel.ERROR) {
    //   fetch('/api/logs', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(logEntry),
    //   }).catch(() => {
    //     // Silently fail to avoid logging loops
    //   });
    // }
  }

  /**
   * Log debug information (lowest priority)
   */
  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log informational messages
   */
  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning messages
   */
  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error messages
   */
  public error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log payment-specific events with sanitized data
   */
  public payment(
    event: 'initiated' | 'success' | 'failed',
    context: {
      amount?: number;
      currency?: string;
      last4?: string;
      errorCode?: string;
      errorMessage?: string;
      [key: string]: any;
    }
  ): void {
    const level = event === 'failed' ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `Payment ${event}`, {
      paymentEvent: event,
      ...context,
    });
  }

  /**
   * Log user actions
   */
  public userAction(
    action: string,
    context?: LogContext
  ): void {
    this.info(`User action: ${action}`, {
      action,
      ...context,
    });
  }

  /**
   * Log performance metrics
   */
  public performance(
    metric: string,
    durationMs: number,
    context?: LogContext
  ): void {
    this.debug(`Performance: ${metric}`, {
      metric,
      durationMs,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogContext, LogEntry };
