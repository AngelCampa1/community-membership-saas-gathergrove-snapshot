# GatherGrove Mobile - Icon Assets

This document explains the icon setup for the GatherGrove mobile PWA.

## Icon Sources

All icons are generated from the official **GatherGrove Assets** folder located in the project root.

### Source Files Used:
- **Main App Icons**: `GatherGrove Assets/GatherGrove Logo (1024 x 1024 px).png`
- **Desktop Screenshots**: `GatherGrove Assets/GatherGrove Hero white bg 1920 x 1080.png`
- **Mobile Screenshots**: `GatherGrove Assets/Mobile splash screen no bg 1080 x 1920.png`
- **Favicons**: `GatherGrove Assets/favicon_io (4).zip`

## Generated Icon Sizes

### PWA Manifest Icons (public/assets/images/)
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png ← This was the missing file that caused the 404 error
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### Shortcut Icons (public/assets/icons/)
- calendar-96x96.png (Calendar icon for Events shortcut)
- people-96x96.png (People icon for Directory shortcut)
- payment-96x96.png (Payment icon for Pay Dues shortcut)
- chat-96x96.png (Chat icon for Chat shortcut)

### Screenshots (public/assets/screenshots/)
- desktop-home.png (1280x720 - Desktop Dashboard)
- mobile-home.png (390x844 - Mobile Dashboard)
- mobile-events.png (390x844 - Events Calendar)
- mobile-directory.png (390x844 - Member Directory)

### Favicons (public/)
- favicon.ico (Multi-size ICO file)
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png (180x180)
- android-chrome-192x192.png
- android-chrome-512x512.png

## Regenerating Icons

To regenerate all icons from the official GatherGrove assets:

```bash
npm run generate-icons
```

This script:
1. Reads the high-resolution logo from `GatherGrove Assets/`
2. Resizes it to all required PWA icon sizes
3. Generates branded shortcut icons with emoji overlays
4. Creates screenshots using official hero and splash images
5. Maintains transparency and proper aspect ratios

## Dependencies

The icon generation requires the `sharp` package:
```bash
npm install --save-dev sharp
```

## Manifest Configuration

The PWA manifest is configured in `public/manifest.json` and references all generated icons.

## App Configuration

The Expo app configuration in `app.json` is set to use:
- Web favicon: `./public/favicon.ico`
- iOS icon: `./assets/images/AppIcon-ios-1024x1024.png`
- Android icon: `./assets/images/AppIcon-android-512x512.png`

## Notes

- All icons use the official GatherGrove logo and brand colors
- Icons maintain transparency for proper display on various backgrounds
- The brand green color is `#10b981`
- Screenshots are generated from official marketing assets for brand consistency
