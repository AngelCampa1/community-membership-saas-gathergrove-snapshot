/**
 * PLAT-03 fix: Centralized platform detection and compatibility utilities
 *
 * Use these utilities instead of direct Platform.OS checks throughout the codebase.
 * This provides:
 * - Consistent platform detection
 * - Safe fallbacks for testing environments
 * - Type-safe platform-specific rendering
 *
 * Usage:
 * import { isAndroid, isIOS, isWeb, select } from '@/utils/platformUtils';
 */
import { Platform, Dimensions, PixelRatio } from 'react-native';

// Safe platform detection with fallbacks for testing
const getPlatformOS = () => {
  try {
    return Platform?.OS || 'ios';
  } catch (error) {
    return 'ios';
  }
};

const platformOS = getPlatformOS();

export const isWeb = platformOS === 'web';
export const isNative = platformOS === 'ios' || platformOS === 'android';
export const isIOS = platformOS === 'ios';
export const isAndroid = platformOS === 'android';

/**
 * Check if Stripe native features are available
 */
export const isStripeNativeAvailable = (): boolean => {
  return isNative;
};

/**
 * Check if we should use web-compatible payment processing
 */
export const shouldUseWebPayments = (): boolean => {
  return isWeb;
};

/**
 * Get platform-specific configuration
 */
export const getPlatformConfig = () => ({
  platform: platformOS,
  isWeb,
  isNative,
  isIOS,
  isAndroid,
  supportsNativeStripe: isStripeNativeAvailable(),
  shouldUseWebPayments: shouldUseWebPayments(),
});

/**
 * Platform-specific component wrapper
 */
export const withPlatform = <T>(components: {
  web?: T;
  native?: T;
  ios?: T;
  android?: T;
  default?: T;
}): T | null => {
  if (isWeb && components.web) return components.web;
  if (isIOS && components.ios) return components.ios;
  if (isAndroid && components.android) return components.android;
  if (isNative && components.native) return components.native;
  if (components.default) return components.default;
  return null;
};

/**
 * Platform-specific value selector (similar to Platform.select but with safe fallbacks)
 */
export const select = <T>(specifics: {
  ios?: T;
  android?: T;
  web?: T;
  native?: T;
  default: T;
}): T => {
  if (isIOS && specifics.ios !== undefined) return specifics.ios;
  if (isAndroid && specifics.android !== undefined) return specifics.android;
  if (isWeb && specifics.web !== undefined) return specifics.web;
  if (isNative && specifics.native !== undefined) return specifics.native;
  return specifics.default;
};

/**
 * Get safe screen dimensions with fallbacks
 */
export const getScreenDimensions = () => {
  try {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  } catch {
    return { width: 375, height: 812 }; // Default iPhone X dimensions
  }
};

/**
 * Get pixel ratio for responsive sizing
 */
export const getPixelRatio = (): number => {
  try {
    return PixelRatio.get();
  } catch {
    return 2; // Default to 2x
  }
};

/**
 * Normalize font size for different screen densities
 */
export const normalizeFont = (size: number): number => {
  const scale = getScreenDimensions().width / 375; // Base on iPhone X width
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
  const { width, height } = getScreenDimensions();
  const aspectRatio = height / width;
  // Tablets typically have aspect ratio < 1.6
  return Math.min(width, height) >= 600 && aspectRatio < 1.6;
};

/**
 * Check if device supports haptic feedback
 */
export const supportsHaptics = (): boolean => {
  return isIOS || isAndroid;
};

/**
 * Check if device supports biometric authentication
 */
export const supportsBiometrics = (): boolean => {
  return isNative;
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  try {
    return __DEV__ === true;
  } catch {
    return false;
  }
};

/**
 * Get platform-specific keyboard behavior
 */
export const getKeyboardBehavior = (): 'padding' | 'height' | 'position' => {
  return isIOS ? 'padding' : 'height';
};

/**
 * Platform version (major version number)
 */
export const getPlatformVersion = (): number => {
  try {
    if (isWeb) return 0;
    const version = Platform.Version;
    if (typeof version === 'string') {
      return parseInt(version.split('.')[0], 10) || 0;
    }
    return typeof version === 'number' ? version : 0;
  } catch {
    return 0;
  }
};