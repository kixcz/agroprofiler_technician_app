/**
 * Centralized Logging Utility
 * Handles production logging with environment-aware levels
 */

import { apiConfig } from '@/lib/api/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.level = apiConfig.logLevel;
    this.isDevelopment = apiConfig.environment === 'development';
  }

  /**
   * Check if log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Log debug messages (only in development)
   */
  public debug(message: string, data?: Record<string, any>): void {
    if (!this.isLevelEnabled('debug') || !this.isDevelopment) return;

    const formatted = this.formatMessage('debug', message);
    if (data) {
      console.debug(formatted, data);
    } else {
      console.debug(formatted);
    }
  }

  /**
   * Log info messages
   */
  public info(message: string, data?: Record<string, any>): void {
    if (!this.isLevelEnabled('info')) return;

    const formatted = this.formatMessage('info', message);
    if (data) {
      console.log(formatted, data);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log warning messages
   */
  public warn(message: string, data?: Record<string, any>): void {
    if (!this.isLevelEnabled('warn')) return;

    const formatted = this.formatMessage('warn', message);
    if (data) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  }

  /**
   * Log error messages
   */
  public error(message: string, data?: Record<string, any>): void {
    if (!this.isLevelEnabled('error')) return;

    const formatted = this.formatMessage('error', message);
    if (data) {
      console.error(formatted, data);
    } else {
      console.error(formatted);
    }

    // In production, send errors to Sentry if configured
    if (!this.isDevelopment && apiConfig.sentryDsn) {
      this.reportToSentry(message, data);
    }
  }

  /**
   * Send error to Sentry (stub for future implementation)
   */
  private reportToSentry(message: string, data?: Record<string, any>): void {
    // TODO: Implement Sentry integration when ready
    // For now, this is a placeholder
  }

  /**
   * Set log level
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new Logger();
