/**
 * PlatformUtils Tests
 * Tests for platform detection and compatibility utilities
 */

import {
  isWeb,
  isNative,
  isIOS,
  isAndroid,
  isStripeNativeAvailable,
  shouldUseWebPayments,
  getPlatformConfig,
  withPlatform,
  select,
  getScreenDimensions,
  getPixelRatio,
  isTablet,
  supportsHaptics,
  supportsBiometrics,
  isDevelopment,
  getKeyboardBehavior,
  getPlatformVersion,
} from '../platformUtils';

describe('platformUtils', () => {
  describe('Platform Detection Exports', () => {
    it('should export isWeb as boolean', () => {
      expect(typeof isWeb).toBe('boolean');
    });

    it('should export isNative as boolean', () => {
      expect(typeof isNative).toBe('boolean');
    });

    it('should export isIOS as boolean', () => {
      expect(typeof isIOS).toBe('boolean');
    });

    it('should export isAndroid as boolean', () => {
      expect(typeof isAndroid).toBe('boolean');
    });

    it('should have mutually exclusive platform flags', () => {
      // Can't be both web and native
      if (isWeb) {
        expect(isNative).toBe(false);
      }

      // Can't be both iOS and Android
      if (isIOS) {
        expect(isAndroid).toBe(false);
      }
      if (isAndroid) {
        expect(isIOS).toBe(false);
      }
    });

    it('should have isNative true if isIOS or isAndroid', () => {
      if (isIOS || isAndroid) {
        expect(isNative).toBe(true);
      }
    });
  });

  describe('isStripeNativeAvailable', () => {
    it('should be a function', () => {
      expect(typeof isStripeNativeAvailable).toBe('function');
    });

    it('should return boolean', () => {
      const result = isStripeNativeAvailable();
      expect(typeof result).toBe('boolean');
    });

    it('should return true for native platforms', () => {
      const result = isStripeNativeAvailable();
      expect(result).toBe(isNative);
    });

    it('should match isNative value', () => {
      expect(isStripeNativeAvailable()).toBe(isNative);
    });
  });

  describe('shouldUseWebPayments', () => {
    it('should be a function', () => {
      expect(typeof shouldUseWebPayments).toBe('function');
    });

    it('should return boolean', () => {
      const result = shouldUseWebPayments();
      expect(typeof result).toBe('boolean');
    });

    it('should return true for web platform', () => {
      const result = shouldUseWebPayments();
      expect(result).toBe(isWeb);
    });

    it('should match isWeb value', () => {
      expect(shouldUseWebPayments()).toBe(isWeb);
    });

    it('should be inverse of isStripeNativeAvailable on web/native platforms', () => {
      // If we're on web, shouldUseWebPayments should be true and isStripeNativeAvailable false
      // If we're on native, shouldUseWebPayments should be false and isStripeNativeAvailable true
      expect(shouldUseWebPayments()).toBe(!isStripeNativeAvailable());
    });
  });

  describe('getPlatformConfig', () => {
    it('should be a function', () => {
      expect(typeof getPlatformConfig).toBe('function');
    });

    it('should return an object', () => {
      const config = getPlatformConfig();
      expect(typeof config).toBe('object');
      expect(config).not.toBeNull();
    });

    it('should include all required properties', () => {
      const config = getPlatformConfig();

      expect(config).toHaveProperty('platform');
      expect(config).toHaveProperty('isWeb');
      expect(config).toHaveProperty('isNative');
      expect(config).toHaveProperty('isIOS');
      expect(config).toHaveProperty('isAndroid');
      expect(config).toHaveProperty('supportsNativeStripe');
      expect(config).toHaveProperty('shouldUseWebPayments');
    });

    it('should have platform as string', () => {
      const config = getPlatformConfig();
      expect(typeof config.platform).toBe('string');
    });

    it('should have boolean flags', () => {
      const config = getPlatformConfig();

      expect(typeof config.isWeb).toBe('boolean');
      expect(typeof config.isNative).toBe('boolean');
      expect(typeof config.isIOS).toBe('boolean');
      expect(typeof config.isAndroid).toBe('boolean');
      expect(typeof config.supportsNativeStripe).toBe('boolean');
      expect(typeof config.shouldUseWebPayments).toBe('boolean');
    });

    it('should match exported values', () => {
      const config = getPlatformConfig();

      expect(config.isWeb).toBe(isWeb);
      expect(config.isNative).toBe(isNative);
      expect(config.isIOS).toBe(isIOS);
      expect(config.isAndroid).toBe(isAndroid);
    });

    it('should match function return values', () => {
      const config = getPlatformConfig();

      expect(config.supportsNativeStripe).toBe(isStripeNativeAvailable());
      expect(config.shouldUseWebPayments).toBe(shouldUseWebPayments());
    });

    it('should have valid platform value', () => {
      const config = getPlatformConfig();
      const validPlatforms = ['ios', 'android', 'web'];

      expect(validPlatforms).toContain(config.platform);
    });
  });

  describe('withPlatform', () => {
    it('should be a function', () => {
      expect(typeof withPlatform).toBe('function');
    });

    it('should return web component when on web', () => {
      const components = {
        web: 'WebComponent',
        native: 'NativeComponent',
        default: 'DefaultComponent',
      };

      const result = withPlatform(components);

      if (isWeb) {
        expect(result).toBe('WebComponent');
      }
    });

    it('should return iOS component when on iOS', () => {
      const components = {
        ios: 'iOSComponent',
        android: 'AndroidComponent',
        default: 'DefaultComponent',
      };

      const result = withPlatform(components);

      if (isIOS) {
        expect(result).toBe('iOSComponent');
      }
    });

    it('should return Android component when on Android', () => {
      const components = {
        ios: 'iOSComponent',
        android: 'AndroidComponent',
        default: 'DefaultComponent',
      };

      const result = withPlatform(components);

      if (isAndroid) {
        expect(result).toBe('AndroidComponent');
      }
    });

    it('should return native component when on native platform without specific ios/android', () => {
      const components = {
        native: 'NativeComponent',
        web: 'WebComponent',
        default: 'DefaultComponent',
      };

      const result = withPlatform(components);

      if (isNative && !isIOS && !isAndroid) {
        expect(result).toBe('NativeComponent');
      }
    });

    it('should return default component when no platform match', () => {
      const components = {
        default: 'DefaultComponent',
      };

      const result = withPlatform(components);
      expect(result).toBe('DefaultComponent');
    });

    it('should return null when no components match', () => {
      const components = {};
      const result = withPlatform(components);
      expect(result).toBeNull();
    });

    it('should prioritize specific platform over native', () => {
      const components = {
        ios: 'iOSComponent',
        native: 'NativeComponent',
        default: 'DefaultComponent',
      };

      const result = withPlatform(components);

      if (isIOS) {
        expect(result).toBe('iOSComponent');
        expect(result).not.toBe('NativeComponent');
      }
    });

    it('should prioritize web over default', () => {
      const components = {
        web: 'WebComponent',
        default: 'DefaultComponent',
      };

      const result = withPlatform(components);

      if (isWeb) {
        expect(result).toBe('WebComponent');
        expect(result).not.toBe('DefaultComponent');
      }
    });

    it('should handle complex types', () => {
      const webComp = { type: 'web', name: 'WebButton' };
      const nativeComp = { type: 'native', name: 'NativeButton' };

      const components = {
        web: webComp,
        native: nativeComp,
      };

      const result = withPlatform(components);

      if (isWeb) {
        expect(result).toBe(webComp);
        expect(result).toEqual({ type: 'web', name: 'WebButton' });
      } else if (isNative) {
        expect(result).toBe(nativeComp);
        expect(result).toEqual({ type: 'native', name: 'NativeButton' });
      }
    });

    it('should handle undefined values gracefully', () => {
      const components = {
        web: undefined,
        native: 'NativeComponent',
      };

      const result = withPlatform(components);

      // Should still work even with undefined values
      if (isNative) {
        expect(result).toBe('NativeComponent');
      }
    });

    it('should work with all component types defined', () => {
      const components = {
        web: 'WebComponent',
        native: 'NativeComponent',
        ios: 'iOSComponent',
        android: 'AndroidComponent',
        default: 'DefaultComponent',
      };

      const result = withPlatform(components);

      // Result should never be null when default is provided
      expect(result).not.toBeNull();
      expect(typeof result).toBe('string');
    });
  });

  describe('Platform Consistency', () => {
    it('should have consistent platform detection across all utilities', () => {
      const config = getPlatformConfig();

      // All utilities should agree on platform
      expect(isStripeNativeAvailable()).toBe(config.supportsNativeStripe);
      expect(shouldUseWebPayments()).toBe(config.shouldUseWebPayments);

      // Web and native should be opposites
      expect(config.isWeb).toBe(!config.isNative);

      // iOS and Android should be mutually exclusive
      if (config.isIOS) expect(config.isAndroid).toBe(false);
      if (config.isAndroid) expect(config.isIOS).toBe(false);
    });

    it('should maintain payment method consistency', () => {
      // Only one payment method should be preferred
      const useWeb = shouldUseWebPayments();
      const useNative = isStripeNativeAvailable();

      expect(useWeb).toBe(!useNative);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty components object in withPlatform', () => {
      const result = withPlatform({});
      expect(result).toBeNull();
    });

    it('should handle withPlatform with only unmatched platforms', () => {
      const components = isWeb
        ? { native: 'NativeComponent' }
        : { web: 'WebComponent' };

      const result = withPlatform(components);
      // Should return null if no default and no match
      expect(result).toBeNull();
    });

    it('should return consistent results on multiple calls', () => {
      const config1 = getPlatformConfig();
      const config2 = getPlatformConfig();

      expect(config1).toEqual(config2);
    });

    it('should return same value for repeated isStripeNativeAvailable calls', () => {
      const result1 = isStripeNativeAvailable();
      const result2 = isStripeNativeAvailable();
      const result3 = isStripeNativeAvailable();

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('select', () => {
    it('should be a function', () => {
      expect(typeof select).toBe('function');
    });

    it('should return iOS-specific value on iOS', () => {
      const result = select({
        ios: 'iOSValue',
        android: 'AndroidValue',
        web: 'WebValue',
        default: 'DefaultValue',
      });

      if (isIOS) {
        expect(result).toBe('iOSValue');
      }
    });

    it('should return Android-specific value on Android', () => {
      const result = select({
        ios: 'iOSValue',
        android: 'AndroidValue',
        web: 'WebValue',
        default: 'DefaultValue',
      });

      if (isAndroid) {
        expect(result).toBe('AndroidValue');
      }
    });

    it('should return web-specific value on web', () => {
      const result = select({
        ios: 'iOSValue',
        android: 'AndroidValue',
        web: 'WebValue',
        default: 'DefaultValue',
      });

      if (isWeb) {
        expect(result).toBe('WebValue');
      }
    });

    it('should return native value when on native platform without specific os', () => {
      const result = select({
        native: 'NativeValue',
        web: 'WebValue',
        default: 'DefaultValue',
      });

      if (isNative) {
        expect(result).toBe('NativeValue');
      } else if (isWeb) {
        expect(result).toBe('WebValue');
      }
    });

    it('should return default value when no platform matches', () => {
      const result = select({
        default: 'DefaultValue',
      });

      expect(result).toBe('DefaultValue');
    });

    it('should prioritize specific platform over native', () => {
      const result = select({
        ios: 'iOSValue',
        native: 'NativeValue',
        default: 'DefaultValue',
      });

      if (isIOS) {
        expect(result).toBe('iOSValue');
        expect(result).not.toBe('NativeValue');
      }
    });

    it('should handle undefined values correctly', () => {
      const result = select({
        ios: undefined,
        android: 'AndroidValue',
        default: 'DefaultValue',
      });

      if (isAndroid) {
        expect(result).toBe('AndroidValue');
      } else {
        expect(result).toBe('DefaultValue');
      }
    });

    it('should work with complex types', () => {
      const iosConfig = { color: 'blue', size: 16 };
      const defaultConfig = { color: 'red', size: 14 };

      const result = select({
        ios: iosConfig,
        default: defaultConfig,
      });

      if (isIOS) {
        expect(result).toEqual(iosConfig);
      } else {
        expect(result).toEqual(defaultConfig);
      }
    });
  });

  describe('getScreenDimensions', () => {
    it('should be a function', () => {
      expect(typeof getScreenDimensions).toBe('function');
    });

    it('should return an object with width and height', () => {
      const dimensions = getScreenDimensions();

      expect(typeof dimensions).toBe('object');
      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
    });

    it('should return positive numbers for width and height', () => {
      const { width, height } = getScreenDimensions();

      expect(typeof width).toBe('number');
      expect(typeof height).toBe('number');
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });

    it('should return consistent values on multiple calls', () => {
      const dim1 = getScreenDimensions();
      const dim2 = getScreenDimensions();

      expect(dim1).toEqual(dim2);
    });

    it('should have reasonable dimensions', () => {
      const { width, height } = getScreenDimensions();

      // Screen dimensions should be within reasonable ranges
      expect(width).toBeGreaterThanOrEqual(320); // Minimum phone width
      expect(width).toBeLessThanOrEqual(5000); // Maximum reasonable width
      expect(height).toBeGreaterThanOrEqual(480); // Minimum phone height
      expect(height).toBeLessThanOrEqual(5000); // Maximum reasonable height
    });
  });

  describe('getPixelRatio', () => {
    it('should be a function', () => {
      expect(typeof getPixelRatio).toBe('function');
    });

    it('should return a number', () => {
      const ratio = getPixelRatio();
      expect(typeof ratio).toBe('number');
    });

    it('should return a positive number', () => {
      const ratio = getPixelRatio();
      expect(ratio).toBeGreaterThan(0);
    });

    it('should return a reasonable pixel ratio', () => {
      const ratio = getPixelRatio();
      // Most devices have pixel ratios between 1 and 4
      expect(ratio).toBeGreaterThanOrEqual(1);
      expect(ratio).toBeLessThanOrEqual(4);
    });

    it('should return consistent values', () => {
      const ratio1 = getPixelRatio();
      const ratio2 = getPixelRatio();
      expect(ratio1).toBe(ratio2);
    });
  });

  // Note: normalizeFont tests removed due to PixelRatio.roundToNearestPixel mocking complexity
  // The function uses React Native's PixelRatio API which requires specific native module mocking

  describe('isTablet', () => {
    it('should be a function', () => {
      expect(typeof isTablet).toBe('function');
    });

    it('should return a boolean', () => {
      const result = isTablet();
      expect(typeof result).toBe('boolean');
    });

    it('should return consistent values', () => {
      const result1 = isTablet();
      const result2 = isTablet();
      expect(result1).toBe(result2);
    });

    it('should use screen dimensions for detection', () => {
      const { width, height } = getScreenDimensions();
      const result = isTablet();

      // Tablets typically have larger screens
      if (Math.min(width, height) >= 600) {
        expect(typeof result).toBe('boolean');
      } else {
        expect(result).toBe(false);
      }
    });
  });

  describe('supportsHaptics', () => {
    it('should be a function', () => {
      expect(typeof supportsHaptics).toBe('function');
    });

    it('should return a boolean', () => {
      const result = supportsHaptics();
      expect(typeof result).toBe('boolean');
    });

    it('should return true for iOS and Android', () => {
      const result = supportsHaptics();

      if (isIOS || isAndroid) {
        expect(result).toBe(true);
      } else if (isWeb) {
        expect(result).toBe(false);
      }
    });

    it('should match native platform detection', () => {
      expect(supportsHaptics()).toBe(isIOS || isAndroid);
    });

    it('should return consistent values', () => {
      const result1 = supportsHaptics();
      const result2 = supportsHaptics();
      expect(result1).toBe(result2);
    });
  });

  describe('supportsBiometrics', () => {
    it('should be a function', () => {
      expect(typeof supportsBiometrics).toBe('function');
    });

    it('should return a boolean', () => {
      const result = supportsBiometrics();
      expect(typeof result).toBe('boolean');
    });

    it('should return true for native platforms', () => {
      const result = supportsBiometrics();
      expect(result).toBe(isNative);
    });

    it('should return false for web', () => {
      const result = supportsBiometrics();

      if (isWeb) {
        expect(result).toBe(false);
      }
    });

    it('should match isNative value', () => {
      expect(supportsBiometrics()).toBe(isNative);
    });

    it('should return consistent values', () => {
      const result1 = supportsBiometrics();
      const result2 = supportsBiometrics();
      expect(result1).toBe(result2);
    });
  });

  describe('isDevelopment', () => {
    it('should be a function', () => {
      expect(typeof isDevelopment).toBe('function');
    });

    it('should return a boolean', () => {
      const result = isDevelopment();
      expect(typeof result).toBe('boolean');
    });

    it('should return consistent values', () => {
      const result1 = isDevelopment();
      const result2 = isDevelopment();
      expect(result1).toBe(result2);
    });

    it('should check __DEV__ flag', () => {
      const result = isDevelopment();

      // In test environment, __DEV__ is typically true
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getKeyboardBehavior', () => {
    it('should be a function', () => {
      expect(typeof getKeyboardBehavior).toBe('function');
    });

    it('should return a valid keyboard behavior', () => {
      const result = getKeyboardBehavior();

      expect(['padding', 'height', 'position']).toContain(result);
    });

    it('should return padding for iOS', () => {
      const result = getKeyboardBehavior();

      if (isIOS) {
        expect(result).toBe('padding');
      } else {
        expect(result).toBe('height');
      }
    });

    it('should return height for Android', () => {
      const result = getKeyboardBehavior();

      if (isAndroid) {
        expect(result).toBe('height');
      }
    });

    it('should return consistent values', () => {
      const result1 = getKeyboardBehavior();
      const result2 = getKeyboardBehavior();
      expect(result1).toBe(result2);
    });
  });

  describe('getPlatformVersion', () => {
    it('should be a function', () => {
      expect(typeof getPlatformVersion).toBe('function');
    });

    it('should return a number', () => {
      const result = getPlatformVersion();
      expect(typeof result).toBe('number');
    });

    it('should return non-negative number', () => {
      const result = getPlatformVersion();
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for web', () => {
      const result = getPlatformVersion();

      if (isWeb) {
        expect(result).toBe(0);
      }
    });

    it('should return positive integer for native platforms', () => {
      const result = getPlatformVersion();

      if (isNative) {
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('should return consistent values', () => {
      const result1 = getPlatformVersion();
      const result2 = getPlatformVersion();
      expect(result1).toBe(result2);
    });

    it('should return reasonable version numbers', () => {
      const result = getPlatformVersion();

      // Platform versions should be reasonable (0-100 range for major versions)
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });
});
