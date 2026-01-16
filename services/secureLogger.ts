/**
 * Secure Logging Utility
 * Provides safe logging that automatically redacts sensitive information in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: any;
  stack?: string;
}

class SecureLogger {
  private isDevelopment = __DEV__;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly MAX_STRING_LENGTH = 200;

  // Patterns to detect and redact sensitive information
  private readonly SENSITIVE_PATTERNS = [
    { pattern: /password/i, replacement: '[REDACTED]' },
    { pattern: /token/i, replacement: '[REDACTED]' },
    { pattern: /secret/i, replacement: '[REDACTED]' },
    { pattern: /key/i, replacement: '[REDACTED]' },
    { pattern: /authorization/i, replacement: '[REDACTED]' },
    { pattern: /cookie/i, replacement: '[REDACTED]' },
    { pattern: /session/i, replacement: '[REDACTED]' },
    { pattern: /credit/i, replacement: '[REDACTED]' },
    { pattern: /ssn/i, replacement: '[REDACTED]' },
    { pattern: /phone/i, replacement: '[REDACTED]' },
    { pattern: /email/i, replacement: '[REDACTED]' },
    { pattern: /address/i, replacement: '[REDACTED]' },
    { pattern: /Bearer\s+\S+/i, replacement: 'Bearer [REDACTED]' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
    { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE]' },
    { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CREDIT_CARD]' },
  ];

  /**
   * Sanitize data by removing sensitive information
   */
  private sanitizeData(data: any, depth = 0): any {
    if (depth > 5) return '[MAX_DEPTH_REACHED]'; // Prevent circular reference issues

    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      let sanitized = data;
      for (const { pattern, replacement } of this.SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, replacement);
      }
      // Truncate long strings
      return sanitized.length > this.MAX_STRING_LENGTH
        ? sanitized.substring(0, this.MAX_STRING_LENGTH) + '...'
        : sanitized;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, depth + 1));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Check if key contains sensitive keywords
          const isSensitiveKey = this.SENSITIVE_PATTERNS.some(({ pattern }) =>
            pattern.test(key)
          );

          if (isSensitiveKey) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = this.sanitizeData(data[key], depth + 1);
          }
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift(); // Remove oldest entry
    }
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const { level, timestamp, message, data } = entry;
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data && Object.keys(data).length > 0) {
      const sanitized = this.sanitizeData(data);
      formatted += ` ${JSON.stringify(sanitized)}`;
    }

    return formatted;
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      level,
      timestamp,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      stack: error?.stack,
    };

    // Add to buffer for debugging
    this.addToBuffer(entry);

    // Only output logs in development
    if (this.isDevelopment) {
      const formatted = this.formatLogEntry(entry);
      switch (level) {
        case 'debug':
        case 'info':
          console.log(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted);
          if (error?.stack) {
            console.error('Stack trace:', error.stack);
          }
          break;
      }
    }

    // In production, you could send critical logs to a remote logging service
    if (!this.isDevelopment && level === 'error') {
      this.sendToRemoteLogging(entry);
    }
  }

  /**
   * Send critical logs to remote logging service
   * This is a placeholder - implement with your logging service
   */
  private sendToRemoteLogging(entry: LogEntry): void {
    // Implement with your preferred logging service
    // Example: Sentry, LogRocket, Crashlytics, etc.
    // For security reasons, this should use proper authentication and encryption
    try {
      // Placeholder for remote logging implementation
      // fetch('https://your-logging-api.com/logs', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': 'Bearer YOUR_LOGGING_API_KEY'
      //   },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      // Silently fail to prevent logging errors from breaking the app
    }
  }

  /**
   * Public logging methods
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | any, data?: any): void {
    const errorObj = error instanceof Error ? error : undefined;
    const errorData = error instanceof Error ? data : error;
    this.log('error', message, errorData, errorObj);
  }

  /**
   * Get buffered logs for debugging
   */
  getLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs for debugging or reporting
   */
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Create singleton instance
const logger = new SecureLogger();

// Convenience functions
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logError = (message: string, error?: Error | any, data?: any) =>
  logger.error(message, error, data);

export default logger;
