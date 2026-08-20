/**
 * css-hsl transform
 *
 * Converts hex color values to HSL triplet strings suitable for CSS custom
 * properties consumed by Tailwind: `hsl(var(--primary))`.
 *
 * Output format: "H S% L%" (no hsl() wrapper, no commas)
 * Example: #4a9a72 → "150 35% 45%"
 */

/**
 * Format an HSL triplet string from numeric H, S, L components.
 * @param {number} h - Hue [0, 360)
 * @param {number} s - Saturation [0, 100]
 * @param {number} l - Lightness [0, 100]
 * @returns {string} e.g. "150 35% 45%"
 */
export function hslTriplet(h, s, l) {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

/**
 * Convert a hex color string to an HSL triplet string.
 * @param {string} hex - e.g. "#4a9a72" or "#fff"
 * @returns {string} e.g. "150 35% 45%"
 */
export function hexToHsl(hex) {
  const clean = hex.replace('#', '');

  // Expand shorthand (#abc → #aabbcc)
  const full =
    clean.length === 3
      ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
      : clean;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Lightness
  const l = (max + min) / 2;

  // Saturation
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Hue
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta + 6) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  return hslTriplet(h, s * 100, l * 100);
}

/**
 * Style Dictionary v4 transform definition.
 * Register with: StyleDictionary.registerTransform(cssHslTransform)
 */
export const cssHslTransform = {
  name: 'color/css-hsl',
  type: 'value',
  filter: (token) => token.type === 'color' || token.$type === 'color',
  transform: (token) => hexToHsl(token.$value ?? token.value),
};
