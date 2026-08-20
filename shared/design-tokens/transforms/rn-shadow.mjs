/**
 * rn-shadow transform
 *
 * Converts abstract shadow token objects to React Native StyleSheet-compatible
 * shadow objects.
 *
 * Abstract format (stored in shadows.json):
 * { offsetX, offsetY, blur, spread, color, opacity, elevation }
 *
 * React Native output:
 * { shadowColor, shadowOffset: { width, height }, shadowOpacity, shadowRadius, elevation }
 */

/**
 * Convert an abstract shadow descriptor to a React Native shadow object.
 * @param {{ offsetX: number, offsetY: number, blur: number, spread: number, color: string, opacity: number, elevation: number }} shadow
 * @returns {{ shadowColor: string, shadowOffset: { width: number, height: number }, shadowOpacity: number, shadowRadius: number, elevation: number }}
 */
export function abstractShadowToRN(shadow) {
  return {
    shadowColor: shadow.color,
    shadowOffset: { width: shadow.offsetX, height: shadow.offsetY },
    shadowOpacity: shadow.opacity,
    shadowRadius: shadow.blur,
    elevation: shadow.elevation,
  };
}

/**
 * Convert a CSS box-shadow string to a React Native shadow object.
 * Handles simple single-layer shadows: "0 1px 2px 0 rgba(0,0,0,0.05)"
 *
 * @param {string} cssShadow
 * @returns {{ shadowColor: string, shadowOffset: { width: number, height: number }, shadowOpacity: number, shadowRadius: number, elevation: number }}
 */
export function cssShadowToRN(cssShadow) {
  if (cssShadow === 'none' || cssShadow === '0 0 #0000') {
    return {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    };
  }

  // Parse rgba(r, g, b, a) or #hex from the end of the shadow string
  const rgbaMatch = cssShadow.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  const hexMatch = cssShadow.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);

  let shadowColor = '#000000';
  let shadowOpacity = 0.1;

  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch;
    shadowColor = `rgb(${r}, ${g}, ${b})`;
    shadowOpacity = parseFloat(a);
  } else if (hexMatch) {
    shadowColor = `#${hexMatch[1]}`;
  }

  // Extract numeric values: "offsetX offsetY blur spread"
  const parts = cssShadow
    .replace(/rgba\([^)]+\)/g, '')
    .replace(/#[0-9a-fA-F]+/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const parsePx = (s) => parseFloat(s) || 0;
  const offsetX = parsePx(parts[0]);
  const offsetY = parsePx(parts[1]);
  const blur = parsePx(parts[2]);

  // Estimate elevation from blur radius
  const elevation = Math.max(1, Math.round(blur / 4));

  return {
    shadowColor,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity,
    shadowRadius: blur,
    elevation,
  };
}
