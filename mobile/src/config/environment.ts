/**
 * Environment Configuration and Validation
 * Centralized environment variable management with type safety
 */

import { Platform } from 'react-native';

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  API_BASE_URL: string;
  WS_BASE_URL: string;
  SENTRY_DSN?: string;
  ANALYTICS_TRACKING_ID?: string;
  PUSH_NOTIFICATION_SENDER_ID?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  AZURE_AD_CLIENT_ID?: string;
  AZURE_AD_TENANT_ID?: string;
}

/**
 * Type definitions for environment variable access
 */
interface ProcessEnv {
  [key: string]: string | undefined;
}

interface WindowWithEnv extends Window {
  [key: string]: unknown;
}

interface GlobalWithDev {
  __DEV__?: boolean;
  [key: string]: unknown;
}

interface ReactNativeDotEnv {
  [key: string]: string | undefined;
}

/**
 * Get environment variable with optional default value
 */
function getEnvVar(key: string, defaultValue?: string): string {
  let value: string | undefined;

  // In React Native, environment variables are available at build time
  // Use different approaches based on platform
  if (Platform.OS === 'web') {
    // Web environment
    value = (process.env as ProcessEnv)[key] || (window as unknown as WindowWithEnv)?.[key] as string | undefined;
  } else {
    // Mobile environment - using expo-constants or build-time env
    try {
      value = (global as GlobalWithDev).__DEV__
        ? (require('react-native-dotenv') as ReactNativeDotEnv)?.[key]
        : (process.env as ProcessEnv)[key];
    } catch {
      // Fallback if react-native-dotenv is not available
      value = (process.env as ProcessEnv)[key];
    }
  }

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  return value;
}

/**
 * Get optional environment variable
 */
function getOptionalEnvVar(key: string): string | undefined {
  try {
    return getEnvVar(key);
  } catch {
    return undefined;
  }
}

/**
 * Validate environment configuration
 */
function validateEnvironment(): EnvironmentConfig {
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
  }

  const config: EnvironmentConfig = {
    NODE_ENV: nodeEnv as EnvironmentConfig['NODE_ENV'],
    API_BASE_URL: getEnvVar('API_BASE_URL', 'http://localhost:8050'),
    WS_BASE_URL: getEnvVar('WS_BASE_URL', 'ws://localhost:8050/hub'),
    SENTRY_DSN: getOptionalEnvVar('SENTRY_DSN'),
    ANALYTICS_TRACKING_ID: getOptionalEnvVar('ANALYTICS_TRACKING_ID'),
    PUSH_NOTIFICATION_SENDER_ID: getOptionalEnvVar('PUSH_NOTIFICATION_SENDER_ID'),
    STRIPE_PUBLISHABLE_KEY: getOptionalEnvVar('STRIPE_PUBLISHABLE_KEY'),
    AZURE_AD_CLIENT_ID: getOptionalEnvVar('AZURE_AD_CLIENT_ID'),
    AZURE_AD_TENANT_ID: getOptionalEnvVar('AZURE_AD_TENANT_ID'),
  };

  // Additional validation for production
  if (config.NODE_ENV === 'production') {
    const requiredProdVars = ['API_BASE_URL', 'WS_BASE_URL'];
    
    for (const varName of requiredProdVars) {
      if (!config[varName as keyof EnvironmentConfig]) {
        throw new Error(`${varName} is required in production environment`);
      }
    }

    // Validate URLs
    try {
      new URL(config.API_BASE_URL);
      new URL(config.WS_BASE_URL.replace('ws://', 'http://').replace('wss://', 'https://'));
    } catch (error) {
      throw new Error(`Invalid URL format in environment configuration: ${error}`);
    }
  }

  return config;
}

// Initialize and validate environment
export const env = validateEnvironment();

// Environment helpers
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flags based on environment
export const features = {
  enableAnalytics: isProduction && !!env.ANALYTICS_TRACKING_ID,
  enableSentry: isProduction && !!env.SENTRY_DSN,
  enableDebugLogs: isDevelopment || isTest,
  enableDevTools: isDevelopment,
  enableStrictMode: isDevelopment,
};

// Export for debugging (development only)
if (isDevelopment) {
  // Environment: Environment configuration logged
  // NODE_ENV: env.NODE_ENV
  // API_BASE_URL: env.API_BASE_URL
  // features: features object
  // platform: Platform.OS
}