/**
 * ColorUtils Tests - Full Coverage
 */

import {
  isValidHexColor,
  getContrastRatio,
  generateColorPalette,
  hexToHsl,
  hslToHex,
} from '../colorUtils';

describe('ColorUtils', () => {
  describe('isValidHexColor', () => {
    it('should return true for valid 6-digit hex colors', () => {
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#4A9A72')).toBe(true);
    });

    it('should return true for lowercase hex colors', () => {
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#abc123')).toBe(true);
    });

    it('should return true for mixed case hex colors', () => {
      expect(isValidHexColor('#AbC123')).toBe(true);
      expect(isValidHexColor('#FfFfFf')).toBe(true);
    });

    it('should return false for invalid hex colors without #', () => {
      expect(isValidHexColor('FFFFFF')).toBe(false);
      expect(isValidHexColor('ABC123')).toBe(false);
    });

    it('should return false for 3-digit hex colors', () => {
      expect(isValidHexColor('#FFF')).toBe(false);
      expect(isValidHexColor('#ABC')).toBe(false);
    });

    it('should return false for colors with invalid characters', () => {
      expect(isValidHexColor('#GGGGGG')).toBe(false);
      expect(isValidHexColor('#12345Z')).toBe(false);
    });

    it('should return false for too long hex values', () => {
      expect(isValidHexColor('#FFFFFF00')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidHexColor('')).toBe(false);
    });

    it('should return false for just #', () => {
      expect(isValidHexColor('#')).toBe(false);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast between black and white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeGreaterThan(20); // Should be 21
    });

    it('should calculate contrast with default white background', () => {
      const ratio = getContrastRatio('#000000');
      expect(ratio).toBeGreaterThan(20);
    });

    it('should return 1 for same colors', () => {
      const ratio = getContrastRatio('#FFFFFF', '#FFFFFF');
      expect(ratio).toBe(1);
    });

    it('should calculate contrast for primary green color', () => {
      const ratio = getContrastRatio('#4A9A72', '#FFFFFF');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(21);
    });

    it('should calculate contrast for dark colors', () => {
      const ratio = getContrastRatio('#333333', '#FFFFFF');
      expect(ratio).toBeGreaterThan(10);
    });

    it('should calculate contrast for light colors', () => {
      const ratio = getContrastRatio('#EEEEEE', '#FFFFFF');
      expect(ratio).toBeLessThan(2);
    });

    it('should be symmetric (color order does not matter)', () => {
      const ratio1 = getContrastRatio('#4A9A72', '#FFFFFF');
      const ratio2 = getContrastRatio('#FFFFFF', '#4A9A72');
      expect(ratio1).toBe(ratio2);
    });

    it('should handle colors with high luminance difference', () => {
      const ratio = getContrastRatio('#FF0000', '#0000FF');
      expect(ratio).toBeGreaterThan(1);
    });

    it('should calculate contrast for middle gray', () => {
      const ratio = getContrastRatio('#808080', '#FFFFFF');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(10);
    });
  });

  describe('generateColorPalette', () => {
    it('should generate palette with primary color', () => {
      const palette = generateColorPalette('#4A9A72');
      expect(palette.primary).toBe('#4A9A72');
    });

    it('should include all semantic color keys', () => {
      const palette = generateColorPalette('#000000');
      expect(palette).toHaveProperty('primary');
      expect(palette).toHaveProperty('secondary');
      expect(palette).toHaveProperty('accent');
      expect(palette).toHaveProperty('success');
      expect(palette).toHaveProperty('warning');
      expect(palette).toHaveProperty('error');
    });

    it('should use fixed colors for semantic values', () => {
      const palette = generateColorPalette('#CUSTOM');
      expect(palette.secondary).toBe('#8B5CF6');
      expect(palette.accent).toBe('#06B6D4');
      expect(palette.success).toBe('#10B981');
      expect(palette.warning).toBe('#F59E0B');
      expect(palette.error).toBe('#EF4444');
    });

    it('should generate same palette for same primary color', () => {
      const palette1 = generateColorPalette('#4A9A72');
      const palette2 = generateColorPalette('#4A9A72');
      expect(palette1).toEqual(palette2);
    });

    it('should handle different primary colors', () => {
      const palette1 = generateColorPalette('#FF0000');
      const palette2 = generateColorPalette('#00FF00');
      expect(palette1.primary).not.toBe(palette2.primary);
    });
  });

  describe('hexToHsl', () => {
    it('should convert white to HSL', () => {
      const result = hexToHsl('#FFFFFF');
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBe(100);
    });

    it('should convert black to HSL', () => {
      const result = hexToHsl('#000000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBe(0);
    });

    it('should convert red to HSL', () => {
      const result = hexToHsl('#FF0000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert green to HSL', () => {
      const result = hexToHsl('#00FF00');
      expect(result.h).toBe(120);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert blue to HSL', () => {
      const result = hexToHsl('#0000FF');
      expect(result.h).toBe(240);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert primary green color', () => {
      const result = hexToHsl('#4A9A72');
      expect(result.h).toBeGreaterThanOrEqual(0);
      expect(result.h).toBeLessThanOrEqual(360);
      expect(result.s).toBeGreaterThanOrEqual(0);
      expect(result.s).toBeLessThanOrEqual(100);
      expect(result.l).toBeGreaterThanOrEqual(0);
      expect(result.l).toBeLessThanOrEqual(100);
    });

    it('should handle gray (zero saturation)', () => {
      const result = hexToHsl('#808080');
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBe(50);
    });

    it('should convert cyan', () => {
      const result = hexToHsl('#00FFFF');
      expect(result.h).toBe(180);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert magenta', () => {
      const result = hexToHsl('#FF00FF');
      expect(result.h).toBe(300);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert yellow', () => {
      const result = hexToHsl('#FFFF00');
      expect(result.h).toBe(60);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });
  });

  describe('hslToHex', () => {
    it('should convert white HSL to hex', () => {
      const result = hslToHex(0, 0, 100);
      expect(result).toBe('#FFFFFF');
    });

    it('should convert black HSL to hex', () => {
      const result = hslToHex(0, 0, 0);
      expect(result).toBe('#000000');
    });

    it('should convert red HSL to hex', () => {
      const result = hslToHex(0, 100, 50);
      expect(result).toBe('#FF0000');
    });

    it('should convert green HSL to hex (60-120 range)', () => {
      const result = hslToHex(120, 100, 50);
      expect(result).toBe('#00FF00');
    });

    it('should convert blue HSL to hex (240-300 range)', () => {
      const result = hslToHex(240, 100, 50);
      expect(result).toBe('#0000FF');
    });

    it('should convert cyan HSL to hex (120-180 range)', () => {
      const result = hslToHex(180, 100, 50);
      expect(result).toBe('#00FFFF');
    });

    it('should convert cyan/blue HSL to hex (180-240 range)', () => {
      const result = hslToHex(210, 100, 50);
      expect(result.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should convert magenta HSL to hex (300-360 range)', () => {
      const result = hslToHex(300, 100, 50);
      expect(result).toBe('#FF00FF');
    });

    it('should convert yellow HSL to hex (60-120 boundary)', () => {
      const result = hslToHex(60, 100, 50);
      expect(result).toBe('#FFFF00');
    });

    it('should handle hue wrapping (>360)', () => {
      const result1 = hslToHex(0, 100, 50);
      const result2 = hslToHex(360, 100, 50);
      expect(result1).toBe(result2);
    });

    it('should clamp saturation to 0-100 range', () => {
      const result1 = hslToHex(0, -10, 50);
      const result2 = hslToHex(0, 0, 50);
      expect(result1).toBe(result2);

      const result3 = hslToHex(0, 150, 50);
      const result4 = hslToHex(0, 100, 50);
      expect(result3).toBe(result4);
    });

    it('should clamp lightness to 0-100 range', () => {
      const result1 = hslToHex(0, 100, -10);
      const result2 = hslToHex(0, 100, 0);
      expect(result1).toBe(result2);

      const result3 = hslToHex(0, 100, 150);
      const result4 = hslToHex(0, 100, 100);
      expect(result3).toBe(result4);
    });

    it('should handle middle gray', () => {
      const result = hslToHex(0, 0, 50);
      expect(result).toBe('#808080');
    });

    it('should handle hue in 0-60 range', () => {
      const result = hslToHex(30, 100, 50);
      expect(result).toBe('#FF8000');
    });

    it('should handle hue in 240-300 range', () => {
      const result = hslToHex(270, 100, 50);
      expect(result).toBe('#8000FF');
    });
  });

  describe('Round-trip conversions', () => {
    it('should convert hex to HSL and back to hex for red', () => {
      const original = '#FF0000';
      const hsl = hexToHsl(original);
      const result = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(result).toBe(original);
    });

    it('should convert hex to HSL and back to hex for green', () => {
      const original = '#00FF00';
      const hsl = hexToHsl(original);
      const result = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(result).toBe(original);
    });

    it('should convert hex to HSL and back to hex for blue', () => {
      const original = '#0000FF';
      const hsl = hexToHsl(original);
      const result = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(result).toBe(original);
    });

    it('should convert hex to HSL and back to hex for white', () => {
      const original = '#FFFFFF';
      const hsl = hexToHsl(original);
      const result = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(result).toBe(original);
    });

    it('should convert hex to HSL and back to hex for black', () => {
      const original = '#000000';
      const hsl = hexToHsl(original);
      const result = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(result).toBe(original);
    });
  });
});
