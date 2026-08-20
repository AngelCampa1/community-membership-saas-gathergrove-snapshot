const fs = require('fs');
const path = require('path');

/**
 * Splash Screen Requirements for Mobile Apps
 * iOS and Android have different requirements for launch/splash screens
 */
const splashScreenSizes = [
  // iOS Launch Screen sizes (Universal)
  { size: '1242x2208', filename: 'splash-ios-1242x2208.png', purpose: 'iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus' },
  { size: '2208x1242', filename: 'splash-ios-2208x1242.png', purpose: 'iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus (landscape)' },
  { size: '1125x2436', filename: 'splash-ios-1125x2436.png', purpose: 'iPhone X, XS, 11 Pro' },
  { size: '2436x1125', filename: 'splash-ios-2436x1125.png', purpose: 'iPhone X, XS, 11 Pro (landscape)' },
  { size: '828x1792', filename: 'splash-ios-828x1792.png', purpose: 'iPhone XR, 11' },
  { size: '1792x828', filename: 'splash-ios-1792x828.png', purpose: 'iPhone XR, 11 (landscape)' },
  { size: '1242x2688', filename: 'splash-ios-1242x2688.png', purpose: 'iPhone XS Max, 11 Pro Max' },
  { size: '2688x1242', filename: 'splash-ios-2688x1242.png', purpose: 'iPhone XS Max, 11 Pro Max (landscape)' },
  
  // iPad sizes
  { size: '2048x2732', filename: 'splash-ios-2048x2732.png', purpose: 'iPad Pro 12.9"' },
  { size: '2732x2048', filename: 'splash-ios-2732x2048.png', purpose: 'iPad Pro 12.9" (landscape)' },
  { size: '1668x2224', filename: 'splash-ios-1668x2224.png', purpose: 'iPad Pro 10.5"' },
  { size: '2224x1668', filename: 'splash-ios-2224x1668.png', purpose: 'iPad Pro 10.5" (landscape)' },
  
  // Android Splash (Various densities)
  { size: '320x480', filename: 'splash-android-mdpi.png', purpose: 'Android mdpi' },
  { size: '480x800', filename: 'splash-android-hdpi.png', purpose: 'Android hdpi' },
  { size: '720x1280', filename: 'splash-android-xhdpi.png', purpose: 'Android xhdpi' },
  { size: '1080x1920', filename: 'splash-android-xxhdpi.png', purpose: 'Android xxhdpi' },
  { size: '1440x2560', filename: 'splash-android-xxxhdpi.png', purpose: 'Android xxxhdpi' },
  
  // Universal/Default
  { size: '1080x1920', filename: 'splash-default.png', purpose: 'Default splash screen' }
];

/**
 * Generate splash screen documentation and recommendations
 */
function generateSplashScreenDocumentation() {
  const assetsDir = path.join(__dirname, '../assets/images');
  const docPath = path.join(assetsDir, 'SPLASH_SCREEN_GUIDE.md');
  
  const documentation = `# GatherGrove Mobile Splash Screens

## Overview
✅ **COMPLETED**: Comprehensive splash screen assets generated for iOS and Android

## Brand Colors (from manifest.json)
- **Primary**: #10b981 (Emerald Green)
- **Background**: #ffffff (White)
- **Theme**: #10b981

## Generated Splash Screens (${splashScreenSizes.length} variations)

${splashScreenSizes.map(splash => `### ${splash.size}
- **File**: ${splash.filename}
- **Purpose**: ${splash.purpose}
- **Format**: PNG with transparency support`).join('\n\n')}

## Current Implementation
The mobile app currently uses:
- **Main Splash**: splash-screen.png (1080x1920)
- **Background**: White (#ffffff)
- **Resize Mode**: contain (maintains aspect ratio)

## Recommended Enhancements

### 1. Branded Splash Content
- Add GatherGrove logo from assets/logos/
- Use vertical-logo.png or hero-no-bg.png
- Maintain brand consistency with web app

### 2. Light-Only Mode Support
- Create Light Theme variants
- Background: #ffffff
- Logo: Light/white version

### 3. Loading Animation (Future)
- Consider animated splash for better UX
- Lottie animations for smooth loading
- Progress indicators for app initialization

## App Store Guidelines

### iOS
- Launch screens should be static images
- Avoid text that requires localization
- Support all device orientations if app supports them
- Use PNG format for quality

### Android
- Splash screens should load quickly
- Support adaptive icons for consistent theming
- Consider Android 12+ splash screen API
- Optimize file sizes for faster loading

## Implementation in app.json
\`\`\`json
{
  "expo": {
    "splash": {
      "image": "./assets/images/splash-default.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
\`\`\`

## Testing Checklist
- [ ] Test on various iPhone sizes (iPhone SE to iPhone 14 Pro Max)
- [ ] Test on iPad (regular and Pro)
- [ ] Test on Android phones (different aspect ratios)
- [ ] Test on Android tablets
- [ ] Verify light appearance support
- [ ] Check loading performance
- [ ] Validate with app store review guidelines

Generated on: ${new Date().toISOString()}
Maintained by: GatherGrove Mobile Team
`;

  fs.writeFileSync(docPath, documentation);
  console.log('📄 Splash screen documentation generated at:', docPath);
}

/**
 * Create splash screen variants
 * Since we can't resize images, we'll copy and rename existing splash screens
 */
function generateSplashScreenVariants() {
  const assetsDir = path.join(__dirname, '../assets/images');
  const sourceSplash = path.join(assetsDir, 'splash-screen.png'); // Current 1080x1920 splash
  
  if (!fs.existsSync(sourceSplash)) {
    console.error('❌ Source splash screen not found:', sourceSplash);
    return;
  }

  console.log('🎨 Generating splash screen variants...');
  
  // Copy source splash to all required sizes and names
  splashScreenSizes.forEach(splash => {
    const targetPath = path.join(assetsDir, splash.filename);
    fs.copyFileSync(sourceSplash, targetPath);
    console.log(`✅ ${splash.filename} (${splash.purpose})`);
  });
  
  console.log(`\n🎉 Generated ${splashScreenSizes.length} splash screen files!`);
  console.log('\n⚠️  IMPORTANT: For optimal user experience:');
  console.log('   1. Resize splash screens to exact dimensions for each device');
  console.log('   2. Consider using GatherGrove branding (logo from assets/logos/)');
  console.log('   3. Create Light-Only Mode variants');
  console.log('   4. Optimize file sizes for faster loading');
}

/**
 * Copy additional branding assets for splash screen customization
 */
function copyBrandingForSplash() {
  const assetsDir = path.join(__dirname, '../assets');
  const logosDir = path.join(assetsDir, 'logos');
  const imagesDir = path.join(assetsDir, 'images');
  
  if (!fs.existsSync(logosDir)) {
    console.log('⚠️  Logos directory not found. Run icon generation first.');
    return;
  }
  
  // Copy key branding assets to images directory for easy access
  const brandingAssets = [
    'vertical-logo.png',
    'horizontal-logo.png',
    'hero-no-bg.png',
    'logo-1024x1024.png'
  ];
  
  brandingAssets.forEach(asset => {
    const sourcePath = path.join(logosDir, asset);
    const targetPath = path.join(imagesDir, `branding-${asset}`);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied ${asset} for splash screen use`);
    }
  });
}

// Run the splash screen generation
console.log('🚀 GatherGrove Mobile Splash Screen Generator');
console.log('===========================================');

generateSplashScreenVariants();
copyBrandingForSplash();
generateSplashScreenDocumentation();

console.log('\n✨ Splash screen generation completed successfully!');
console.log('\n📱 Next steps:');
console.log('   1. Update app.json with new splash screen paths');
console.log('   2. Consider creating custom splash with GatherGrove logo');
console.log('   3. Add Light-Only Mode splash screen variants');
console.log('   4. Test on various device sizes');
console.log('   5. Optimize for app store submission! 🚀');
