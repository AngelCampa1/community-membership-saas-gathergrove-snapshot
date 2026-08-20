/**
 * Web-compatible PlatformColorValueTypes implementation
 * This provides platform color support for web browsers
 */

export const PlatformColor = (...names) => {
  // On web, we'll just return the first color name as a CSS color
  // This is a simple fallback for web compatibility
  return names[0] || null;
};

export const normalizeColorObject = (color) => {
  // On web, just return the color as-is
  return color;
};

export const processColorObject = (color) => {
  // On web, no processing needed
  return color;
};