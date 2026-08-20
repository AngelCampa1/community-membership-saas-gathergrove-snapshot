/**
 * Asset Verification Test
 * Verifies that all required mobile app assets exist and app.json is properly configured
 */

const fs = require('fs');
const path = require('path');

// Test configuration paths
const appJsonPath = path.join(__dirname, '../app.json');
const assetsDir = path.join(__dirname, '../assets/images');

describe('GatherGrove Mobile Asset Verification', () => {
  let appJson;

  beforeAll(() => {
    // Load app.json configuration
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf-8');
    appJson = JSON.parse(appJsonContent);
  });

  test('app.json should exist and be valid JSON', () => {
    expect(appJson).toBeDefined();
    expect(appJson.expo).toBeDefined();
    expect(appJson.expo.name).toBe('GatherGrove Mobile');
  });

  test('app.json should reference correct asset paths', () => {
    // Main icon
    expect(appJson.expo.icon).toBe('./assets/images/AppIcon-ios-1024x1024.png');
    
    // iOS configuration
    expect(appJson.expo.ios.icon).toBe('./assets/images/AppIcon-ios-1024x1024.png');
    expect(appJson.expo.ios.bundleIdentifier).toBe('com.gathergrove.mobile');
    
    // Android configuration
    expect(appJson.expo.android.icon).toBe('./assets/images/AppIcon-android-512x512.png');
    expect(appJson.expo.android.adaptiveIcon.foregroundImage).toBe('./assets/images/AppIcon-android-512x512.png');
    expect(appJson.expo.android.adaptiveIcon.backgroundColor).toBe('#10b981');
    expect(appJson.expo.android.package).toBe('com.gathergrove.mobile');
    
    // Splash screen configuration
    expect(appJson.expo.splash.image).toBe('./assets/images/splash-default.png');
    expect(appJson.expo.splash.backgroundColor).toBe('#ffffff');
    expect(appJson.expo.splash.light.backgroundColor).toBe('#1f2937');
  });

  test('all required iOS app store icons should exist', () => {
    const iosIconSizes = [
      'AppIcon-ios-1024x1024.png',  // App Store
      'AppIcon-ios-180x180.png',    // iPhone App (iOS 14+)
      'AppIcon-ios-167x167.png',    // iPad Pro App
      'AppIcon-ios-152x152.png',    // iPad App
      'AppIcon-ios-120x120.png',    // iPhone App (iOS 7-13)
      'AppIcon-ios-87x87.png',      // iPhone Settings (iOS 14+)
      'AppIcon-ios-80x80.png',      // iPhone Spotlight (iOS 7+)
      'AppIcon-ios-76x76.png',      // iPad App (iOS 7+)
      'AppIcon-ios-58x58.png',      // iPhone Settings (iOS 7+)
      'AppIcon-ios-40x40.png',      // iPhone Spotlight (iOS 7+)
      'AppIcon-ios-29x29.png',      // iPhone Settings (iOS 5-6)
      'AppIcon-ios-20x20.png',      // iPhone Notifications (iOS 7+)
    ];

    iosIconSizes.forEach(iconFile => {
      const iconPath = path.join(assetsDir, iconFile);
      expect(fs.existsSync(iconPath)).toBe(true);
    });
  });

  test('all required Android app store icons should exist', () => {
    const androidIconSizes = [
      'AppIcon-android-512x512.png',  // Google Play Store
      'AppIcon-android-192x192.png',  // xxxhdpi launcher
      'AppIcon-android-144x144.png',  // xxhdpi launcher
      'AppIcon-android-96x96.png',    // xhdpi launcher
      'AppIcon-android-72x72.png',    // hdpi launcher
      'AppIcon-android-48x48.png',    // mdpi launcher
      'AppIcon-android-36x36.png',    // ldpi launcher
    ];

    androidIconSizes.forEach(iconFile => {
      const iconPath = path.join(assetsDir, iconFile);
      expect(fs.existsSync(iconPath)).toBe(true);
    });
  });

  test('splash screen assets should exist', () => {
    const splashScreens = [
      'splash-default.png',
      'splash-ios-1242x2208.png',
      'splash-ios-2208x1242.png',
      'splash-android-mdpi.png',
      'splash-android-hdpi.png',
      'splash-android-xhdpi.png',
      'splash-android-xxhdpi.png',
      'splash-android-xxxhdpi.png',
    ];

    splashScreens.forEach(splashFile => {
      const splashPath = path.join(assetsDir, splashFile);
      expect(fs.existsSync(splashPath)).toBe(true);
    });
  });

  test('branding assets should be copied', () => {
    const brandingAssets = [
      'branding-vertical-logo.png',
      'branding-horizontal-logo.png',
      'branding-hero-no-bg.png',
      'branding-logo-1024x1024.png',
    ];

    brandingAssets.forEach(brandingFile => {
      const brandingPath = path.join(assetsDir, brandingFile);
      expect(fs.existsSync(brandingPath)).toBe(true);
    });
  });

  test('documentation should be generated', () => {
    const iconRequirementsPath = path.join(assetsDir, 'ICON_REQUIREMENTS.md');
    const splashGuidePath = path.join(assetsDir, 'SPLASH_SCREEN_GUIDE.md');
    
    expect(fs.existsSync(iconRequirementsPath)).toBe(true);
    expect(fs.existsSync(splashGuidePath)).toBe(true);
  });

  test('app store compliance checks', () => {
    // iOS App Store main icon must be 1024x1024
    const iosMainIconPath = path.join(assetsDir, 'AppIcon-ios-1024x1024.png');
    expect(fs.existsSync(iosMainIconPath)).toBe(true);
    
    // Android Play Store main icon must be 512x512
    const androidMainIconPath = path.join(assetsDir, 'AppIcon-android-512x512.png');
    expect(fs.existsSync(androidMainIconPath)).toBe(true);
    
    // Check that bundle identifiers are set
    expect(appJson.expo.ios.bundleIdentifier).toMatch(/^com\./);
    expect(appJson.expo.android.package).toMatch(/^com\./);
    
    // Check GatherGrove branding colors are used
    expect(appJson.expo.android.adaptiveIcon.backgroundColor).toBe('#10b981'); // Emerald green
  });
});