/**
 * Tab Configuration
 * 
 * Loads and validates tab configuration from tabConfig.json.
 * Provides helper functions to check which tabs are enabled and their order.
 */

import tabConfigJson from './tabConfig.json';
import { logger } from '../utils/logger';

export interface TabConfigItem {
  key: string;
  enabled: boolean;
}

export interface TabConfig {
  tabs: TabConfigItem[];
}

// Valid tab keys for MobileTemplate
const VALID_TAB_KEYS = ['home', 'chat', 'settings', 'profile'] as const;

// Default configuration (all tabs enabled in original order)
const DEFAULT_CONFIG: TabConfig = {
  tabs: [
    { key: 'home', enabled: true },
    { key: 'chat', enabled: true },
    { key: 'settings', enabled: true },
    { key: 'profile', enabled: true },
  ],
};

/**
 * Validate and normalize tab configuration
 */
function validateConfig(config: TabConfig): TabConfig {
  if (!config || !Array.isArray(config.tabs)) {
    logger.warn('Invalid tab config structure, using defaults');
    return DEFAULT_CONFIG;
  }

  // Filter out invalid keys and ensure we have valid tabs
  const validTabs = config.tabs.filter((tab) => {
    if (!tab || typeof tab.key !== 'string' || typeof tab.enabled !== 'boolean') {
      logger.warn(`Invalid tab config item: ${JSON.stringify(tab)}`);
      return false;
    }
    if (!VALID_TAB_KEYS.includes(tab.key as any)) {
      logger.warn(`Unknown tab key: ${tab.key}, ignoring`);
      return false;
    }
    return true;
  });

  // Ensure at least one tab is enabled
  const enabledTabs = validTabs.filter((tab) => tab.enabled);
  if (enabledTabs.length === 0) {
    logger.warn('No tabs enabled in config, using default config');
    return DEFAULT_CONFIG;
  }

  // If we have valid tabs, use them; otherwise use default
  if (validTabs.length === 0) {
    logger.warn('No valid tabs found in config, using defaults');
    return DEFAULT_CONFIG;
  }

  return { tabs: validTabs };
}

// Load and validate config
let tabConfig: TabConfig;
try {
  tabConfig = validateConfig(tabConfigJson as TabConfig);
} catch (error) {
  logger.error('Failed to load tab config', error);
  tabConfig = DEFAULT_CONFIG;
}

/**
 * Get the full tab configuration
 */
export function getTabConfig(): TabConfig {
  return tabConfig;
}

/**
 * Check if a specific tab is enabled
 */
export function isTabEnabled(key: string): boolean {
  const tab = tabConfig.tabs.find((t) => t.key === key);
  return tab?.enabled === true;
}

/**
 * Get array of enabled tab keys in order
 */
export function getEnabledTabs(): string[] {
  return tabConfig.tabs.filter((tab) => tab.enabled).map((tab) => tab.key);
}

/**
 * Get all tab keys in configured order (enabled and disabled)
 */
export function getAllTabs(): string[] {
  return tabConfig.tabs.map((tab) => tab.key);
}

