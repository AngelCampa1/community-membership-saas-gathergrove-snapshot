import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GatherGrove',
  slug: 'gathergrove',
  version: process.env.APP_VERSION || '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'gathergrove',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: [
    '**/*',
  ],
  ios: {
    bundleIdentifier: 'com.gathergrove.app',
    buildNumber: process.env.BUILD_NUMBER || '1',
    supportsTablet: true,
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      NSCameraUsageDescription: 'This app uses the camera to take photos for club activities.',
      NSMicrophoneUsageDescription: 'This app uses the microphone for voice messages in club communications.',
      NSLocationWhenInUseUsageDescription: 'This app uses location to help you find nearby clubs and events.',
    },
    config: {
      usesNonExemptEncryption: false,
    },
    usesAppleSignIn: true,
    associatedDomains: [
      'applinks:gathergrove.club',
      'applinks:app.gathergrove.club',
    ],
  },
  android: {
    package: 'com.gathergrove.app',
    versionCode: parseInt(process.env.BUILD_NUMBER || '1'),
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'CAMERA',
      'RECORD_AUDIO',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'NOTIFICATIONS',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'gathergrove.club',
          },
          {
            scheme: 'https',
            host: 'app.gathergrove.club',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    '@react-native-google-signin/google-signin',
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#ffffff',
        defaultChannel: 'default',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow GatherGrove to access your photos to share with your club.',
        cameraPermission: 'Allow GatherGrove to take photos for club activities.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Allow GatherGrove to use your location to find nearby clubs.',
      },
    ],
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Allow GatherGrove to use Face ID for secure authentication.',
      },
    ],
    [
      'expo-updates',
      {
        enabled: process.env.NODE_ENV === 'production',
        checkAutomatically: 'ON_LOAD',
        fallbackToCacheTimeout: 0,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true,
  },
  extra: {
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.gathergrove.club',
    environment: process.env.NODE_ENV || 'production',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
    enableBiometricAuth: process.env.ENABLE_BIOMETRIC_AUTH === 'true',
    enableOfflineMode: process.env.ENABLE_OFFLINE_MODE === 'true',
    enableCrashReporting: process.env.ENABLE_CRASH_REPORTING === 'true',
    azureNotificationHubConnectionString: process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING,
    azureNotificationHubName: process.env.AZURE_NOTIFICATION_HUB_NAME,
    // SSO Configuration
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    eas: {
      projectId: process.env.EXPO_PROJECT_ID,
    },
  },
  updates: {
    enabled: process.env.NODE_ENV === 'production',
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
    url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID}`,
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  owner: 'gathergrove',
});
