/**
 * Logger Configuration
 * 
 * Defines log levels and default configuration for the logging system.
 * Log levels are hierarchical: DEBUG < INFO < WARN < ERROR
 */

import Constants from 'expo-constants';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerConfig {
  /** Minimum log level to output (logs at this level and above will be shown) */
  minLevel: LogLevel;
  /** Whether to include timestamps in log output */
  includeTimestamp: boolean;
  /** Whether to include log level prefix in output */
  includeLevelPrefix: boolean;
}

/**
 * Get debug logging flag from environment
 * Defaults to false (no debug logs) if not set
 */
function getLogDebug(): boolean {
  const logDebug = 
    process.env.EXPO_PUBLIC_LOG_DEBUG?.toLowerCase().trim() ||
    Constants.expoConfig?.extra?.LOG_DEBUG?.toLowerCase().trim();
  
  return logDebug === 'true' || logDebug === '1';
}

/**
 * Default logger configuration
 * - DEBUG level if EXPO_PUBLIC_LOG_DEBUG=true or __DEV__ is true
 * - INFO level otherwise (hides DEBUG logs)
 */
export const defaultLoggerConfig: LoggerConfig = {
  minLevel: (getLogDebug() || __DEV__) ? LogLevel.DEBUG : LogLevel.INFO,
  includeTimestamp: true,
  includeLevelPrefix: true,
};

/**
 * Get log level name as string
 */
export function getLogLevelName(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return 'DEBUG';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.ERROR:
      return 'ERROR';
    default:
      return 'UNKNOWN';
  }
}

