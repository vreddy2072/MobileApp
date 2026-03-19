/**
 * Centralized Logging Utility
 * 
 * Provides hierarchical logging with configurable log levels.
 * Supports DEBUG, INFO, WARN, and ERROR levels with automatic filtering.
 * ERROR logs are persisted to AsyncStorage in production.
 */

import { LogLevel, LoggerConfig, defaultLoggerConfig, getLogLevelName } from '../config/loggerConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGS_STORAGE_KEY = '@app_logs';
const MAX_LOG_ENTRIES = 20; // Store last 20 log entries

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  args?: unknown[];
  error?: {
    message: string;
    stack?: string;
  };
}

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = defaultLoggerConfig) {
    this.config = config;
  }

  /**
   * Update logger configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Persist log entry to AsyncStorage
   * Stores the last 20 log entries (circular buffer)
   * Persists logs based on configured log level:
   * - In production: persists all logs at INFO level and above
   * - In development: persists all logs when DEBUG logging is enabled (for testing)
   */
  private async persistLog(entry: LogEntry): Promise<void> {
    // Only persist logs that are at or above the configured minimum level
    if (entry.level < this.config.minLevel) {
      return;
    }

    try {
      // Get existing logs
      const existingData = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
      let logs: LogEntry[] = [];

      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          // Handle both old format (single entry) and new format (array)
          logs = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          logs = [];
        }
      }

      // Add new entry
      logs.push(entry);

      // Keep only last MAX_LOG_ENTRIES entries
      if (logs.length > MAX_LOG_ENTRIES) {
        logs = logs.slice(-MAX_LOG_ENTRIES);
      }

      // Store updated logs
      await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      // Fail silently to avoid logging loops
      // Use console.error directly since logger might be in a loop
      console.error('Failed to persist log:', error);
    }
  }

  /**
   * Get all persisted logs (last 20 entries)
   */
  async getLogs(): Promise<LogEntry[]> {
    try {
      const data = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      // Handle both old format (single entry) and new format (array)
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  /**
   * Clear all persisted logs
   */
  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LOGS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Export logs as formatted text
   */
  async exportLogsAsText(): Promise<string> {
    const logs = await this.getLogs();

    if (!logs || logs.length === 0) {
      return 'No logs found.';
    }

    const lines: string[] = [];

    for (const log of logs) {
      const levelName = getLogLevelName(log.level);
      let line = `[${levelName}] [${log.timestamp}] ${log.message}`;

      if (log.error) {
        line += `\n  Error: ${log.error.message}`;
        if (log.error.stack) {
          line += `\n  Stack: ${log.error.stack}`;
        }
      }

      if (log.args && log.args.length > 0) {
        line += `\n  Args: ${JSON.stringify(log.args, null, 2)}`;
      }

      lines.push(line);
    }

    return lines.join('\n\n');
  }

  /**
   * Internal method to log messages
   */
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    // Skip if log level is below minimum threshold
    if (level < this.config.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();

    // Build log prefix
    const parts: string[] = [];
    
    if (this.config.includeLevelPrefix) {
      parts.push(`[${getLogLevelName(level)}]`);
    }
    
    if (this.config.includeTimestamp) {
      parts.push(`[${timestamp}]`);
    }

    // Build final message
    const prefix = parts.length > 0 ? `${parts.join(' ')} ` : '';
    const logMessage = `${prefix}${message}`;

    // Output to console based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, ...args);
        break;
      case LogLevel.INFO:
        console.info(logMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, ...args);
        break;
    }

    // Persist log entry (based on configured log level)
    this.persistLog({
      level,
      message,
      timestamp,
      args: args.length > 0 ? args : undefined,
    }).catch(() => {
      // Ignore persistence errors
    });
  }

  /**
   * Log a DEBUG message
   * Only shown in development builds by default
   */
  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log an INFO message
   * General informational messages
   */
  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log a WARN message
   * Warning messages for potentially problematic situations
   */
  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log an ERROR message
   * Error messages for error conditions
   * ERROR logs are persisted to AsyncStorage in production
   */
  error(message: string, error?: unknown, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    let errorData: { message: string; stack?: string } | undefined;

    if (error instanceof Error) {
      errorData = {
        message: error.message,
        stack: error.stack,
      };
      this.log(LogLevel.ERROR, message, error, error.stack, ...args);
    } else if (error !== undefined) {
      // Convert non-Error objects to error data format
      errorData = {
        message: String(error),
      };
      this.log(LogLevel.ERROR, message, error, ...args);
    } else {
      this.log(LogLevel.ERROR, message, ...args);
    }

    // Persist ERROR log with error details (if log level allows)
    // The log() method already persists, but we want to add error details
    if (LogLevel.ERROR >= this.config.minLevel) {
      this.persistLog({
        level: LogLevel.ERROR,
        message,
        timestamp,
        error: errorData,
        args: args.length > 0 ? args : undefined,
      }).catch(() => {
        // Ignore persistence errors (log() already persisted basic entry)
      });
    }
  }
}

// Export singleton logger instance
export const logger = new Logger();
