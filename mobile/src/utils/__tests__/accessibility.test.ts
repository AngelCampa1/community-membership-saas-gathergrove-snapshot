/**
 * Accessibility Utilities Tests
 * Tests for WCAG compliance, focus management, and accessibility features
 */

import {
  getTouchTargetStyle,
  getFocusStyle,
  getHighContrastStyle,
  getResponsiveStyle,
  getCardLayoutStyle,
  createAccessibilityLabel,
  getContrastRatio,
  getGlassmorphismStyle,
  getOptimizedAnimationStyle,
  getScreenReaderStyle,
} from '../accessibility';

describe('accessibility', () => {
  describe('getTouchTargetStyle', () => {
    it('should return default touch target style', () => {
      const style = getTouchTargetStyle();

      expect(style).toHaveProperty('minWidth');
      expect(style).toHaveProperty('minHeight');
      expect(style).toHaveProperty('paddingHorizontal');
      expect(style).toHaveProperty('paddingVertical');
    });

    it('should use provided size', () => {
      const customSize = 48;
      const style = getTouchTargetStyle(customSize);

      expect(style.minWidth).toBe(customSize);
      expect(style.minHeight).toBe(customSize);
    });

    it('should calculate padding correctly', () => {
      const size = 48;
      const style = getTouchTargetStyle(size);

      // Padding should be (48 - 24) / 2 = 12
      expect(style.paddingHorizontal).toBe(12);
      expect(style.paddingVertical).toBe(12);
    });

    it('should not have negative padding', () => {
      const smallSize = 16;
      const style = getTouchTargetStyle(smallSize);

      expect(style.paddingHorizontal).toBeGreaterThanOrEqual(0);
      expect(style.paddingVertical).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getFocusStyle', () => {
    it('should return default focus style', () => {
      const style = getFocusStyle();

      expect(style).toHaveProperty('borderWidth');
      expect(style).toHaveProperty('borderColor');
      expect(style).toHaveProperty('borderRadius');
      expect(style).toHaveProperty('shadowColor');
      expect(style).toHaveProperty('shadowOffset');
      expect(style).toHaveProperty('shadowOpacity');
      expect(style).toHaveProperty('shadowRadius');
      expect(style).toHaveProperty('elevation');
    });

    it('should use custom color', () => {
      const customColor = '#FF0000';
      const style = getFocusStyle(customColor);

      expect(style.borderColor).toBe(customColor);
      expect(style.shadowColor).toBe(customColor);
    });

    it('should use custom width', () => {
      const customWidth = 4;
      const style = getFocusStyle(undefined, customWidth);

      expect(style.borderWidth).toBe(customWidth);
    });

    it('should use custom offset', () => {
      const customOffset = 4;
      const style = getFocusStyle(undefined, undefined, customOffset);

      expect(style.shadowRadius).toBe(customOffset);
    });

    it('should have shadow offset of {0, 0}', () => {
      const style = getFocusStyle();

      expect(style.shadowOffset).toEqual({ width: 0, height: 0 });
    });
  });

  describe('getHighContrastStyle', () => {
    it('should return light theme high contrast style by default', () => {
      const style = getHighContrastStyle();

      expect(style).toHaveProperty('color');
      expect(style).toHaveProperty('textShadowColor');
      expect(style).toHaveProperty('textShadowOffset');
      expect(style).toHaveProperty('textShadowRadius');
    });

    it('should return different colors for light theme', () => {
      const lightStyle = getHighContrastStyle('light');

      expect(lightStyle.color).toBeDefined();
      expect(lightStyle.textShadowColor).toBeDefined();
    });

    it('should return different colors for Light Theme', () => {
      const darkStyle = getHighContrastStyle('dark');

      expect(darkStyle.color).toBeDefined();
      expect(darkStyle.textShadowColor).toBeDefined();
    });

    it('should have different colors between light and Light Themes', () => {
      const lightStyle = getHighContrastStyle('light');
      const darkStyle = getHighContrastStyle('dark');

      // Colors should be different for contrast
      expect(lightStyle.color).not.toBe(darkStyle.color);
    });

    it('should have text shadow radius of 1', () => {
      const style = getHighContrastStyle();

      expect(style.textShadowRadius).toBe(1);
    });
  });

  describe('getResponsiveStyle', () => {
    it('should return responsive style object', () => {
      const style = getResponsiveStyle();

      expect(style).toHaveProperty('isSmallScreen');
      expect(style).toHaveProperty('isMediumScreen');
      expect(style).toHaveProperty('isLargeScreen');
      expect(style).toHaveProperty('screenWidth');
      expect(style).toHaveProperty('screenHeight');
      expect(style).toHaveProperty('containerPadding');
      expect(style).toHaveProperty('textSize');
      expect(style).toHaveProperty('spacing');
    });

    it('should have boolean screen size flags', () => {
      const style = getResponsiveStyle();

      expect(typeof style.isSmallScreen).toBe('boolean');
      expect(typeof style.isMediumScreen).toBe('boolean');
      expect(typeof style.isLargeScreen).toBe('boolean');
    });

    it('should have numeric screen dimensions', () => {
      const style = getResponsiveStyle();

      expect(typeof style.screenWidth).toBe('number');
      expect(typeof style.screenHeight).toBe('number');
      expect(style.screenWidth).toBeGreaterThan(0);
      expect(style.screenHeight).toBeGreaterThan(0);
    });

    it('should have text size object with all sizes', () => {
      const style = getResponsiveStyle();

      expect(style.textSize).toHaveProperty('xs');
      expect(style.textSize).toHaveProperty('sm');
      expect(style.textSize).toHaveProperty('base');
      expect(style.textSize).toHaveProperty('lg');
      expect(style.textSize).toHaveProperty('xl');
      expect(style.textSize).toHaveProperty('2xl');
      expect(style.textSize).toHaveProperty('3xl');
    });

    it('should have spacing object with all sizes', () => {
      const style = getResponsiveStyle();

      expect(style.spacing).toHaveProperty('xs');
      expect(style.spacing).toHaveProperty('sm');
      expect(style.spacing).toHaveProperty('md');
      expect(style.spacing).toHaveProperty('lg');
      expect(style.spacing).toHaveProperty('xl');
    });

    it('should have exactly one screen size flag true', () => {
      const style = getResponsiveStyle();
      const trueCount = [
        style.isSmallScreen,
        style.isMediumScreen,
        style.isLargeScreen,
      ].filter(Boolean).length;

      expect(trueCount).toBe(1);
    });
  });

  describe('getCardLayoutStyle', () => {
    it('should return card layout style with default 2 items per row', () => {
      const style = getCardLayoutStyle();

      expect(style).toHaveProperty('cardWidth');
      expect(style).toHaveProperty('cardStyle');
      expect(style).toHaveProperty('containerStyle');
    });

    it('should calculate card width correctly', () => {
      const style = getCardLayoutStyle(2);

      expect(typeof style.cardWidth).toBe('number');
      expect(style.cardWidth).toBeGreaterThan(0);
    });

    it('should have card style with width and margins', () => {
      const style = getCardLayoutStyle();

      expect(style.cardStyle).toHaveProperty('width');
      expect(style.cardStyle).toHaveProperty('marginBottom');
      expect(style.cardStyle).toHaveProperty('marginRight');
    });

    it('should have container style with flex properties', () => {
      const style = getCardLayoutStyle();

      expect(style.containerStyle).toHaveProperty('paddingHorizontal');
      expect(style.containerStyle).toHaveProperty('flexDirection');
      expect(style.containerStyle).toHaveProperty('flexWrap');
      expect(style.containerStyle).toHaveProperty('justifyContent');
    });

    it('should adjust card width for different items per row', () => {
      const style2 = getCardLayoutStyle(2);
      const style3 = getCardLayoutStyle(3);

      // More items per row should result in smaller cards
      expect(style3.cardWidth).toBeLessThan(style2.cardWidth);
    });

    it('should have floor values for card width', () => {
      const style = getCardLayoutStyle(3);

      // Should be whole numbers
      expect(style.cardWidth).toBe(Math.floor(style.cardWidth));
      expect(style.cardStyle.width).toBe(Math.floor(style.cardStyle.width));
    });
  });

  describe('createAccessibilityLabel', () => {
    it('should create basic accessibility label', () => {
      const label = createAccessibilityLabel('Button Text');

      expect(label).toHaveProperty('accessible', true);
      expect(label).toHaveProperty('accessibilityLabel', 'Button Text');
    });

    it('should include hint when provided', () => {
      const label = createAccessibilityLabel('Button', 'Double tap to activate');

      expect(label).toHaveProperty('accessibilityHint', 'Double tap to activate');
    });

    it('should include role when provided', () => {
      const label = createAccessibilityLabel('Submit', undefined, 'button');

      expect(label).toHaveProperty('accessibilityRole', 'button');
    });

    it('should include all properties when all params provided', () => {
      const label = createAccessibilityLabel('Delete', 'Removes item', 'button');

      expect(label.accessible).toBe(true);
      expect(label.accessibilityLabel).toBe('Delete');
      expect(label.accessibilityHint).toBe('Removes item');
      expect(label.accessibilityRole).toBe('button');
    });

    it('should handle empty hint gracefully', () => {
      const label = createAccessibilityLabel('Text', '');

      expect(label.accessibilityHint).toBe('');
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');

      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeCloseTo(21, 0); // Black/white should be ~21:1
    });

    it('should return same ratio regardless of color order', () => {
      const ratio1 = getContrastRatio('#000000', '#FFFFFF');
      const ratio2 = getContrastRatio('#FFFFFF', '#000000');

      expect(ratio1).toBe(ratio2);
    });

    it('should return 1 for identical colors', () => {
      const ratio = getContrastRatio('#FF0000', '#FF0000');

      expect(ratio).toBeCloseTo(1, 1);
    });

    it('should handle uppercase hex colors', () => {
      const ratio = getContrastRatio('#FF0000', '#00FF00');

      expect(ratio).toBeGreaterThan(1);
    });

    it('should handle lowercase hex colors', () => {
      const ratio = getContrastRatio('#ff0000', '#00ff00');

      expect(ratio).toBeGreaterThan(1);
    });

    it('should calculate reasonable ratios for common color pairs', () => {
      // Blue background with white text
      const ratio = getContrastRatio('#0000FF', '#FFFFFF');

      expect(ratio).toBeGreaterThan(4.5); // Should meet WCAG AA for normal text
    });
  });

  describe('getGlassmorphismStyle', () => {
    it('should return default glassmorphism style', () => {
      const style = getGlassmorphismStyle();

      expect(style).toHaveProperty('backgroundColor');
      expect(style).toHaveProperty('borderWidth');
      expect(style).toHaveProperty('borderColor');
      expect(style).toHaveProperty('backdropFilter');
      expect(style).toHaveProperty('shadowColor');
      expect(style).toHaveProperty('shadowOffset');
      expect(style).toHaveProperty('shadowOpacity');
      expect(style).toHaveProperty('shadowRadius');
      expect(style).toHaveProperty('elevation');
    });

    it('should use custom opacity', () => {
      const customOpacity = 0.3;
      const style = getGlassmorphismStyle(customOpacity);

      expect(style.backgroundColor).toContain(String(customOpacity));
    });

    it('should have border width of 1', () => {
      const style = getGlassmorphismStyle();

      expect(style.borderWidth).toBe(1);
    });

    it('should have elevation of 8', () => {
      const style = getGlassmorphismStyle();

      expect(style.elevation).toBe(8);
    });

    it('should have shadow opacity of 0.1', () => {
      const style = getGlassmorphismStyle();

      expect(style.shadowOpacity).toBe(0.1);
    });

    it('should use default SPECIAL_COLORS when opacity is 0.1', () => {
      const defaultStyle = getGlassmorphismStyle(0.1);

      // Should not contain 'rgba' for default
      expect(typeof defaultStyle.backgroundColor).toBe('string');
    });
  });

  describe('getOptimizedAnimationStyle', () => {
    it('should return optimization flags', () => {
      const style = getOptimizedAnimationStyle();

      expect(style).toHaveProperty('shouldRasterizeIOS');
      expect(style).toHaveProperty('renderToHardwareTextureAndroid');
    });

    it('should enable iOS rasterization', () => {
      const style = getOptimizedAnimationStyle();

      expect(style.shouldRasterizeIOS).toBe(true);
    });

    it('should enable Android hardware texture', () => {
      const style = getOptimizedAnimationStyle();

      expect(style.renderToHardwareTextureAndroid).toBe(true);
    });
  });

  describe('getScreenReaderStyle', () => {
    it('should return visible screen reader style by default', () => {
      const style = getScreenReaderStyle();

      expect(style.accessible).toBe(true);
      expect(style.accessibilityElementsHidden).toBe(false);
      expect(style.importantForAccessibility).toBe('yes');
    });

    it('should return hidden screen reader style when false', () => {
      const style = getScreenReaderStyle(false);

      expect(style.accessible).toBe(false);
      expect(style.accessibilityElementsHidden).toBe(true);
      expect(style.importantForAccessibility).toBe('no-hide-descendants');
    });

    it('should handle explicit true parameter', () => {
      const style = getScreenReaderStyle(true);

      expect(style.accessible).toBe(true);
      expect(style.accessibilityElementsHidden).toBe(false);
      expect(style.importantForAccessibility).toBe('yes');
    });
  });

  describe('Integration Tests', () => {
    it('should work together for accessible button', () => {
      const touchStyle = getTouchTargetStyle(48);
      const focusStyle = getFocusStyle();
      const label = createAccessibilityLabel('Submit', 'Submit the form', 'button');

      // Combined style should have all accessibility features
      expect(touchStyle.minWidth).toBe(48);
      expect(focusStyle.borderWidth).toBeGreaterThan(0);
      expect(label.accessible).toBe(true);
      expect(label.accessibilityRole).toBe('button');
    });

    it('should work together for high contrast card', () => {
      const highContrast = getHighContrastStyle('dark');
      const glassStyle = getGlassmorphismStyle();
      const cardLayout = getCardLayoutStyle(2);

      expect(highContrast.color).toBeDefined();
      expect(glassStyle.backgroundColor).toBeDefined();
      expect(cardLayout.cardWidth).toBeGreaterThan(0);
    });

    it('should maintain consistency across responsive styles', () => {
      const responsive = getResponsiveStyle();
      const cardLayout = getCardLayoutStyle(2);

      // Card layout should use responsive padding
      expect(cardLayout.containerStyle.paddingHorizontal).toBeGreaterThan(0);
      expect(responsive.containerPadding).toBeGreaterThan(0);
    });
  });
});
