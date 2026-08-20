const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// GatherGrove port configuration (multi-project environment)
// Backend: 8050 | Client: 3050 | Mobile: 5080
config.server = {
  port: 5080,
};

// Enhanced performance optimizations
config.resolver.platforms = ['ios', 'android', 'web'];

// Add path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, './src'),
  '@/components': path.resolve(__dirname, './src/components'),
  '@/screens': path.resolve(__dirname, './src/screens'),
  '@/navigation': path.resolve(__dirname, './src/navigation'),
  '@/services': path.resolve(__dirname, './src/services'),
  '@/hooks': path.resolve(__dirname, './src/hooks'),
  '@/types': path.resolve(__dirname, './src/types'),
  '@/utils': path.resolve(__dirname, './src/utils'),
  '@/constants': path.resolve(__dirname, './src/constants'),
  '@/config': path.resolve(__dirname, './src/config'),
  '@/contexts': path.resolve(__dirname, './src/contexts'),
};

// Enhanced resolver conditions for better module resolution
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
  'default'
];

// Enable package exports for better module resolution
config.resolver.unstable_enablePackageExports = true;

// Performance optimizations
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Platform-specific module resolution for native-only modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle React Native Platform module resolution for web
  if (platform === 'web') {
    // Resolve all variations of Platform module imports to our web-compatible version
    if (moduleName === './Platform' ||
        moduleName === '../Platform' ||
        moduleName === '../Utilities/Platform' || 
        moduleName === '../../Utilities/Platform' ||
        moduleName === '../../../Utilities/Platform' ||
        moduleName === 'react-native/Libraries/Utilities/Platform' ||
        moduleName.endsWith('/Utilities/Platform') ||
        moduleName.endsWith('/Platform') ||
        (moduleName === 'Platform' && context.originModulePath && context.originModulePath.includes('react-native'))) {
      return {
        filePath: path.resolve(__dirname, './src/utils/Platform.web.js'),
        type: 'sourceFile',
      };
    }
    
    // Resolve BackHandler module for web
    if (moduleName.includes('BackHandler') ||
        moduleName === '../Utilities/BackHandler') {
      return {
        filePath: path.resolve(__dirname, './src/utils/BackHandler.web.js'),
        type: 'sourceFile',
      };
    }
    
    // Resolve PlatformColorValueTypes module for web
    if (moduleName === './PlatformColorValueTypes' || 
        moduleName === '../PlatformColorValueTypes' ||
        moduleName === 'react-native/Libraries/StyleSheet/PlatformColorValueTypes' ||
        moduleName.endsWith('/PlatformColorValueTypes')) {
      return {
        filePath: path.resolve(__dirname, './src/utils/PlatformColorValueTypes.web.js'),
        type: 'sourceFile',
      };
    }
    
    // Resolve BaseViewConfig module for web
    if (moduleName === './BaseViewConfig' || 
        moduleName === '../BaseViewConfig' ||
        moduleName === 'react-native/Libraries/NativeComponent/BaseViewConfig' ||
        moduleName.endsWith('/BaseViewConfig')) {
      return {
        filePath: path.resolve(__dirname, './src/utils/BaseViewConfig.web.js'),
        type: 'sourceFile',
      };
    }
    
    // Resolve legacySendAccessibilityEvent module for web
    if (moduleName.includes('legacySendAccessibilityEvent') ||
        moduleName === '../Components/AccessibilityInfo/legacySendAccessibilityEvent') {
      return {
        filePath: path.resolve(__dirname, './src/utils/legacySendAccessibilityEvent.web.js'),
        type: 'sourceFile',
      };
    }
    
    // Resolve ReactDevToolsSettingsManager module for web
    if (moduleName.includes('ReactDevToolsSettingsManager') ||
        moduleName === '../../src/private/debugging/ReactDevToolsSettingsManager') {
      return {
        filePath: path.resolve(__dirname, './src/utils/ReactDevToolsSettingsManager.web.js'),
        type: 'sourceFile',
      };
    }
    
    // Resolve RCTAlertManager module for web
    if (moduleName.includes('RCTAlertManager') ||
        moduleName === './RCTAlertManager') {
      return {
        filePath: path.resolve(__dirname, './src/utils/RCTAlertManager.web.js'),
        type: 'sourceFile',
      };
    }
    
    // Resolve RCTNetworking module for web
    if (moduleName.includes('RCTNetworking') ||
        moduleName === '../../Network/RCTNetworking') {
      return {
        filePath: path.resolve(__dirname, './src/utils/RCTNetworking.web.js'),
        type: 'sourceFile',
      };
    }
    
    // Generic React Native module resolver for web compatibility
    // Handle common React Native internal modules that don't exist on web
    const rnModulePatterns = [
      'RCTDeviceEventEmitter',
      'RCTEventEmitter', 
      'NativeModules',
      'BatchedBridge',
      'MessageQueue',
      'UIManager',
      'ReactNativeFeatureFlags',
      'NativeReactNativeFeatureFlags'
    ];
    
    if (rnModulePatterns.some(pattern => moduleName.includes(pattern))) {
      // Return a generic stub for unsupported React Native modules
      return {
        filePath: path.resolve(__dirname, './src/utils/webStubs.js'),
        type: 'sourceFile',
      };
    }
    
    // Block native-only Stripe modules on web
    if (moduleName.includes('react-native/Libraries/Utilities/codegenNativeCommands') ||
        moduleName.includes('react-native/Libraries/Utilities/codegenNativeComponent') ||
        moduleName.includes('@stripe/stripe-react-native')) {
      // Return a mock/stub for web compatibility
      return {
        filePath: path.resolve(__dirname, './src/utils/webStubs.js'),
        type: 'sourceFile',
      };
    }
  }
  
  // Use default resolver for other cases
  return context.resolveRequest(context, moduleName, platform);
};
config.resolver.hasteImplModulePath = undefined;

// Enhanced transformer settings
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
  output: {
    ascii_only: true,
    quote_keys: true,
    wrap_iife: true,
  },
  sourceMap: {
    includeSources: false,
  },
  toplevel: false,
  warnings: false,
};

// Remove custom cache configuration causing store.get errors
// Using default Metro caching instead

// Enhanced source extension support
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
  'svg',
];

// Asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'bin',
  'txt',
  'jpg',
  'png',
  'json',
  'woff',
  'woff2',
  'ttf',
  'eot',
  'svg',
];

module.exports = config; 