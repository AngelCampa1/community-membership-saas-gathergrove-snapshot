import Constants from 'expo-constants';

/**
 * Azure Notification Hubs Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create .env file in mobile/ directory
 * 2. Add these variables to your .env file:
 * 
 * AZURE_NOTIFICATION_HUB_CONNECTION_STRING="Endpoint=sb://your-hub.servicebus.windows.net/;SharedAccessKeyName=DefaultListenSharedAccessSignature;SharedAccessKey=your-key"
 * AZURE_NOTIFICATION_HUB_NAME="your-notification-hub-name"
 * EXPO_PROJECT_ID="your-expo-project-id"
 * API_BASE_URL="https://your-backend.azurewebsites.net"
 * 
 * 3. Update app.json with environment variables:
 * "extra": {
 *   "azureConnectionString": process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING,
 *   "azureHubName": process.env.AZURE_NOTIFICATION_HUB_NAME,
 *   "expoProjectId": process.env.EXPO_PROJECT_ID,
 *   "apiBaseUrl": process.env.API_BASE_URL
 * }
 */

interface AzureConfig {
  connectionString: string;
  hubName: string;
  expoProjectId: string;
  apiBaseUrl: string;
  apiTimeout: number;
  isConfigured: boolean;
}

function getEnvVar(key: string, fallback?: string): string {
  // Try to get from Expo Constants first (from app.json extra)
  const expoValue = Constants.expoConfig?.extra?.[key];
  if (expoValue) return expoValue;
  
  // Fallback to process.env for development
  const envValue = process.env[key];
  if (envValue) return envValue;
  
  // Use fallback if provided
  if (fallback !== undefined) return fallback;
  
  // Return empty string if not found
  return '';
}

function validateConfig(): AzureConfig {
  const connectionString = getEnvVar('azureConnectionString') || getEnvVar('AZURE_NOTIFICATION_HUB_CONNECTION_STRING');
  const hubName = getEnvVar('azureHubName') || getEnvVar('AZURE_NOTIFICATION_HUB_NAME');
  const expoProjectId = getEnvVar('expoProjectId') || getEnvVar('EXPO_PROJECT_ID');
  const apiBaseUrl = getEnvVar('apiBaseUrl') || getEnvVar('API_BASE_URL', 'http://localhost:5284');
  const apiTimeout = parseInt(getEnvVar('apiTimeout') || getEnvVar('API_TIMEOUT', '10000'), 10);

  const isConfigured = !!(connectionString && hubName && expoProjectId);
  const isDevelopment = getEnvVar('isDevelopment') === 'true' || __DEV__;

  // Only show warnings in production or when specifically configuring Azure
  if (!isConfigured && !isDevelopment) {
    const { logger } = require('../utils/logger');
    logger.warn('app', 'Azure Notification Hubs not configured for production', {
      hasConnectionString: !!connectionString,
      hasHubName: !!hubName,
      hasProjectId: !!expoProjectId
    });
  } else if (!isConfigured && isDevelopment) {
    // Config log: ('[Azure] Azure Notification Hubs not configured - running in development mode');
  }

  return {
    connectionString,
    hubName,
    expoProjectId,
    apiBaseUrl,
    apiTimeout,
    isConfigured,
  };
}

export const AZURE_CONFIG = validateConfig();

// Log configuration status (without sensitive data) - only in development
if (__DEV__) {
  // Config log: Azure Config Status - connection string, hub name, expo ID configured
  // hasConnectionString: !!AZURE_CONFIG.connectionString
  // hasHubName: !!AZURE_CONFIG.hubName
  // hasExpoProjectId: !!AZURE_CONFIG.expoProjectId
  // apiBaseUrl: AZURE_CONFIG.apiBaseUrl
  // isConfigured: AZURE_CONFIG.isConfigured
}

export default AZURE_CONFIG; 