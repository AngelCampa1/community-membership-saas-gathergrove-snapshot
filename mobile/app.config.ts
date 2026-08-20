import { ConfigContext, ExpoConfig } from'expo/config';

const IS_PRODUCTION = process.env.APP_ENV ==='production';

// API URL - always points to production for development testing
const getApiBaseUrl = () => {
  return'https://api.gathergrove.club';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PRODUCTION ?'GatherGrove' :'GatherGrove (Dev)',
  slug:'gathergrove-mobile',
  version: process.env.APP_VERSION ||'1.0.0',
  orientation:'portrait',
  icon:'./assets/images/AppIcon-ios-1024x1024.png',
  scheme:'gathergrove',
  userInterfaceStyle:'light',

  splash: {
    image:'./assets/images/splash-default.png',
    resizeMode:'contain',
    backgroundColor:'#ffffff',
},

  assetBundlePatterns: ['**/*'],

  ios: {
    bundleIdentifier: IS_PRODUCTION
      ?'com.gathergrove.mobile'
      :'com.gathergrove.mobile.dev',
    buildNumber: process.env.BUILD_NUMBER ||'1',
    supportsTablet: true,
    icon:'./assets/images/AppIcon-ios-1024x1024.png',
    usesAppleSignIn: true,
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      NSCameraUsageDescription:'GatherGrove uses the camera to scan QR codes for event check-in and to take photos for your profile.',
      NSMicrophoneUsageDescription:'GatherGrove uses the microphone for voice messages in club communications.',
      NSLocationWhenInUseUsageDescription:'GatherGrove uses your location to help you find nearby events and club locations.',
      NSPhotoLibraryUsageDescription:'GatherGrove needs access to your photos to upload profile pictures and event images.',
      NSFaceIDUsageDescription:'GatherGrove uses Face ID for secure authentication.',
      UIBackgroundModes: ['remote-notification'],
    },
    config: {
      usesNonExemptEncryption: false,
    },
    associatedDomains: ['applinks:gathergrove.club','applinks:api.gathergrove.club',
    ],
    entitlements: {'aps-environment': IS_PRODUCTION ?'production' :'development',
    },
  },

  android: {
    package: IS_PRODUCTION
      ?'com.gathergrove.mobile'
      :'com.gathergrove.mobile.dev',
    versionCode: parseInt(process.env.BUILD_NUMBER ||'1', 10),
    adaptiveIcon: {
      foregroundImage:'./assets/images/AppIcon-android-512x512.png',
      backgroundColor:'#10b981',
    },
    icon:'./assets/images/AppIcon-android-512x512.png',
    permissions: ['android.permission.CAMERA','android.permission.RECORD_AUDIO','android.permission.ACCESS_FINE_LOCATION','android.permission.ACCESS_COARSE_LOCATION','android.permission.VIBRATE','android.permission.RECEIVE_BOOT_COMPLETED',
    ],
    intentFilters: [
      {
        action:'VIEW',
        autoVerify: true,
        data: [
          { scheme:'https', host:'gathergrove.club', pathPrefix:'/app' },
          { scheme:'https', host:'api.gathergrove.club' },
        ],
        category: ['BROWSABLE','DEFAULT'],
      },
    ],
    // Google Sign-In: Add google-services.json from Firebase Console to project root
    // Then uncomment the line below:
    // googleServicesFile:'./google-services.json',
  },

  web: {
    bundler:'metro',
    favicon:'./public/favicon.ico',
    build: {
      minify: true,
      mode:'production',
    },
  },

  plugins: ['expo-font','expo-asset','expo-apple-authentication',
    // Google Sign-In plugin - requires google-services.json (Android) and GoogleService-Info.plist (iOS)
    // from Firebase Console. After adding the files, run: npx expo prebuild
    '@react-native-google-signin/google-signin',
    ['expo-notifications',
      {
        icon:'./assets/images/AppIcon-android-notification-96x96.png',
        color:'#10b981',
        defaultChannel:'default',
      },
    ],
    ['expo-camera',
      {
        cameraPermission:'GatherGrove needs camera access to scan QR codes for event check-in.',
      },
    ],
  ],

  extra: {
    // API Configuration
    apiBaseUrl: getApiBaseUrl(),
    environment: process.env.APP_ENV ||'development',

    // Feature Flags
    enableAnalytics: IS_PRODUCTION,
    enablePushNotifications: true,
    enableBiometricAuth: true,
    enableOfflineMode: true,
    enableCrashReporting: IS_PRODUCTION,

    // Azure Configuration (from kv-ventora-shared)
    azureNotificationHubConnectionString: process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING,
    azureNotificationHubName: process.env.AZURE_NOTIFICATION_HUB_NAME ||'gathergrove-notifications',
    // Sentry error monitoring
    sentryDsn: process.env.SENTRY_DSN,

    // SSO Configuration - MUST be set via environment variables (never hardcode client IDs)
    sso: {
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID ||'',
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID ||'',
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID ||'',
    },
    // Legacy SSO config locations (for backward compatibility)
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,

    // EAS Configuration
    eas: {
      projectId:'00000000-0000-0000-0000-000000000000',
    },
  },

  updates: {
    enabled: IS_PRODUCTION,
    checkAutomatically:'ON_LOAD',
    fallbackToCacheTimeout: 30000,
    url:'https://u.expo.dev/00000000-0000-0000-0000-000000000000',
  },

  runtimeVersion: {
    policy:'sdkVersion',
  },
});
