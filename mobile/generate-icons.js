const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for the PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Use the highest resolution logo as source
const sourceLogoPath = path.join(__dirname, '..', 'GatherGrove Assets', 'GatherGrove Logo (1024 x 1024 px).png');

// Generate icons from source logo
async function generateIcon(size, outputPath) {
  await sharp(sourceLogoPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent background
    })
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

// Generate shortcut icons with emojis on brand color background
async function generateShortcutIcon(iconName, size, outputPath) {
  let emoji, bgColor;

  switch(iconName) {
    case 'calendar':
      emoji = '📅';
      bgColor = '#10b981'; // GatherGrove green
      break;
    case 'people':
      emoji = '👥';
      bgColor = '#10b981';
      break;
    case 'payment':
      emoji = '💳';
      bgColor = '#10b981';
      break;
    case 'chat':
      emoji = '💬';
      bgColor = '#10b981';
      break;
  }

  const svgIcon = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.225}" fill="${bgColor}"/>
      <text x="${size / 2}" y="${size * 0.7}" font-family="Arial, sans-serif" font-size="${size * 0.6}" text-anchor="middle">${emoji}</text>
    </svg>
  `;

  await sharp(Buffer.from(svgIcon))
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

// Generate placeholder screenshot
async function generateScreenshot(width, height, label, outputPath) {
  // Use the hero image for desktop screenshot
  if (label === 'Dashboard' && width === 1280) {
    const heroPath = path.join(__dirname, '..', 'GatherGrove Assets', 'GatherGrove Hero white bg 1920  x 1080.png');
    await sharp(heroPath)
      .resize(width, height, { fit: 'cover' })
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${outputPath}`);
    return;
  }

  // Use mobile splash for mobile screenshots
  if (width === 390) {
    const splashPath = path.join(__dirname, '..', 'GatherGrove Assets', 'Mobile splash screen no bg 1080 x 1920.png');

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#ffffff"/>
        <text x="${width / 2}" y="${height / 2 + 100}" font-family="Arial, sans-serif" font-size="20" fill="#6b7280" text-anchor="middle">${label}</text>
      </svg>
    `;

    // Overlay the splash screen with label
    const labelBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    await sharp(splashPath)
      .resize(width, height, { fit: 'cover' })
      .composite([{ input: labelBuffer, gravity: 'south' }])
      .png()
      .toFile(outputPath);

    console.log(`Generated: ${outputPath}`);
    return;
  }

  // Fallback simple screenshot
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f7fafc"/>
      <rect x="0" y="0" width="${width}" height="80" fill="#10b981"/>
      <text x="${width / 2}" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">GatherGrove</text>
      <text x="${width / 2}" y="${height / 2}" font-family="Arial, sans-serif" font-size="32" fill="#4a5568" text-anchor="middle">${label}</text>
      <text x="${width / 2}" y="${height / 2 + 40}" font-family="Arial, sans-serif" font-size="18" fill="#718096" text-anchor="middle">Screenshot Placeholder</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

async function main() {
  const imagesDir = path.join(__dirname, 'public', 'assets', 'images');
  const iconsDir = path.join(__dirname, 'public', 'assets', 'icons');
  const screenshotsDir = path.join(__dirname, 'public', 'assets', 'screenshots');

  // Ensure directories exist
  [imagesDir, iconsDir, screenshotsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Check if source logo exists
  if (!fs.existsSync(sourceLogoPath)) {
    console.error(`❌ Source logo not found at: ${sourceLogoPath}`);
    process.exit(1);
  }

  // Generate main app icons from the official logo
  console.log('Generating main app icons from GatherGrove official logo...');
  for (const size of iconSizes) {
    await generateIcon(size, path.join(imagesDir, `icon-${size}x${size}.png`));
  }

  // Generate shortcut icons
  console.log('\nGenerating shortcut icons...');
  const shortcuts = ['calendar', 'people', 'payment', 'chat'];
  for (const shortcut of shortcuts) {
    await generateShortcutIcon(shortcut, 96, path.join(iconsDir, `${shortcut}-96x96.png`));
  }

  // Generate screenshots using official assets
  console.log('\nGenerating screenshots from official assets...');
  await generateScreenshot(1280, 720, 'Dashboard', path.join(screenshotsDir, 'desktop-home.png'));
  await generateScreenshot(390, 844, 'Mobile Dashboard', path.join(screenshotsDir, 'mobile-home.png'));
  await generateScreenshot(390, 844, 'Events Calendar', path.join(screenshotsDir, 'mobile-events.png'));
  await generateScreenshot(390, 844, 'Member Directory', path.join(screenshotsDir, 'mobile-directory.png'));

  console.log('\n✅ All icons and screenshots generated successfully from official GatherGrove assets!');
}

main().catch(console.error);
