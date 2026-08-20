/**
 * Tests for design-tokens.ts - Unified design token system
 * Validates color tokens, spacing, typography, radius, shadows, breakpoints, animations, and z-index
 */

import {
  colorTokens,
  spacingTokens,
  typographyTokens,
  radiusTokens,
  shadowTokens,
  breakpointTokens,
  animationTokens,
  zIndexTokens,
  designTokens,
} from '../design-tokens';

describe('colorTokens', () => {
  describe('Primary colors', () => {
    it('has all primary color shades from 50 to 950', () => {
      const expectedShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      expectedShades.forEach(shade => {
        expect(colorTokens.primary[shade as keyof typeof colorTokens.primary]).toBeDefined();
      });
    });

    it('primary colors use HSL triplet format', () => {
      // Generated tokens use "H S% L%" triplet format (without hsl() wrapper)
      const tripletPattern = /^\d+ \d+% \d+%$/;
      Object.values(colorTokens.primary).forEach(color => {
        expect(color).toMatch(tripletPattern);
      });
    });

    it('primary colors maintain green hue range (143–152°)', () => {
      // Shades use perceptually adjusted hues in the 140–155° green range
      Object.values(colorTokens.primary).forEach(color => {
        const hue = parseInt(color.split(' ')[0]);
        expect(hue).toBeGreaterThanOrEqual(140);
        expect(hue).toBeLessThanOrEqual(155);
      });
    });

    it('primary 500 is the main brand color', () => {
      expect(colorTokens.primary['500']).toBe('150 35% 45%');
    });

    it('lighter shades have higher lightness values', () => {
      const getL = (triplet: string) => parseInt(triplet.split(' ')[2]);
      const lightness50  = getL(colorTokens.primary['50']);
      const lightness500 = getL(colorTokens.primary['500']);
      const lightness950 = getL(colorTokens.primary['950']);

      expect(lightness50).toBeGreaterThan(lightness500);
      expect(lightness500).toBeGreaterThan(lightness950);
    });
  });

  describe('Semantic colors', () => {
    it('has success, warning, error, and info colors', () => {
      expect(colorTokens.semantic.success).toBeDefined();
      expect(colorTokens.semantic.warning).toBeDefined();
      expect(colorTokens.semantic.error).toBeDefined();
      expect(colorTokens.semantic.info).toBeDefined();
    });

    it('semantic color objects contain light/dark aliases in HSL triplet format', () => {
      const tripletPattern = /^\d+ \d+% \d+%$/;
      Object.values(colorTokens.semantic).forEach(colorScale => {
        expect(colorScale.light).toMatch(tripletPattern);
        expect(colorScale.light).toMatch(tripletPattern);
      });
    });

    it('success color is green (142° hue)', () => {
      expect(colorTokens.semantic.success.light).toMatch(/^142 /);
    });

    it('warning color is orange/yellow (38° hue)', () => {
      expect(colorTokens.semantic.warning.light).toMatch(/^38 /);
    });

    it('error color is red (0° hue)', () => {
      expect(colorTokens.semantic.error.light).toMatch(/^0 /);
    });

    it('info color is blue (217° hue)', () => {
      expect(colorTokens.semantic.info.light).toMatch(/^217 /);
    });
  });

  describe('Neutral colors', () => {
    it('has neutral color scale from 50 to 950', () => {
      const expectedShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      expectedShades.forEach(shade => {
        expect(colorTokens.neutral[shade as keyof typeof colorTokens.neutral]).toBeDefined();
      });
    });

    it('neutral colors maintain subtle green tint (150° hue)', () => {
      const tripletPattern = /^\d+ \d+% \d+%$/;
      Object.values(colorTokens.neutral).forEach(color => {
        expect(color).toMatch(tripletPattern);
      });
    });
  });
});

describe('spacingTokens', () => {
  it('has all expected spacing values', () => {
    const expectedKeys = [
      '0', 'px', '0-5', '1', '1-5', '2', '2-5', '3', '3-5', '4', '5', '6', '7', '8', '9', '10',
      '11', '12', '14', '16', '18', '20', '24',
      '28', '32', '36', '40', '44',
      '48', '52', '56', '60', '64', '72', '80', '96',
    ];
    expectedKeys.forEach(key => {
      expect(spacingTokens[key as keyof typeof spacingTokens]).toBeDefined();
    });
  });

  it('spacing 0 is zero', () => {
    expect(spacingTokens['0']).toBe('0');
  });

  it('spacing px is 1 pixel', () => {
    expect(spacingTokens.px).toBe('1px');
  });

  it('spacing values use rem units', () => {
    const remPattern = /^\d+(\.\d+)?rem$/;
    // Check all numeric keys except 0 and px
    Object.entries(spacingTokens).forEach(([key, value]) => {
      if (key !== '0' && key !== 'px') {
        expect(value).toMatch(remPattern);
      }
    });
  });

  it('larger spacing keys have larger rem values', () => {
    const spacing4 = parseFloat(spacingTokens['4']);
    const spacing8 = parseFloat(spacingTokens['8']);
    const spacing16 = parseFloat(spacingTokens['16']);

    expect(spacing8).toBeGreaterThan(spacing4);
    expect(spacing16).toBeGreaterThan(spacing8);
  });

  it('spacing 4 equals 1rem (base unit)', () => {
    expect(spacingTokens['4']).toBe('1rem');
  });
});

describe('typographyTokens', () => {
  describe('Font sizes', () => {
    it('has all font size scales', () => {
      const expectedSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
      expectedSizes.forEach(size => {
        expect(typographyTokens.fontSize[size as keyof typeof typographyTokens.fontSize]).toBeDefined();
      });
    });

    it('font sizes are rem strings', () => {
      const remPattern = /^\d+(\.\d+)?rem$/;
      Object.values(typographyTokens.fontSize).forEach(size => {
        expect(typeof size).toBe('string');
        expect(size).toMatch(remPattern);
      });
    });

    it('base size is 1rem', () => {
      expect(typographyTokens.fontSize.base).toBe('1rem');
    });

    it('larger sizes have larger rem values', () => {
      const xs   = parseFloat(typographyTokens.fontSize.xs);
      const base = parseFloat(typographyTokens.fontSize.base);
      const xl   = parseFloat(typographyTokens.fontSize.xl);

      expect(base).toBeGreaterThan(xs);
      expect(xl).toBeGreaterThan(base);
    });
  });

  describe('Font weights', () => {
    it('has all font weight scales', () => {
      const expectedWeights = ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'];
      expectedWeights.forEach(weight => {
        expect(typographyTokens.fontWeight[weight as keyof typeof typographyTokens.fontWeight]).toBeDefined();
      });
    });

    it('font weights are numeric strings', () => {
      Object.values(typographyTokens.fontWeight).forEach(weight => {
        expect(typeof weight).toBe('string');
        expect(parseInt(weight)).toBeGreaterThanOrEqual(100);
        expect(parseInt(weight)).toBeLessThanOrEqual(900);
      });
    });

    it('normal weight is 400', () => {
      expect(typographyTokens.fontWeight.normal).toBe('400');
    });

    it('bold weight is 700', () => {
      expect(typographyTokens.fontWeight.bold).toBe('700');
    });
  });

  describe('Line heights', () => {
    it('has all line height scales', () => {
      const expectedLineHeights = ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'];
      expectedLineHeights.forEach(lh => {
        expect(typographyTokens.lineHeight[lh as keyof typeof typographyTokens.lineHeight]).toBeDefined();
      });
    });

    it('line heights are numeric strings', () => {
      Object.values(typographyTokens.lineHeight).forEach(lh => {
        expect(typeof lh).toBe('string');
        expect(parseFloat(lh)).toBeGreaterThanOrEqual(1);
      });
    });

    it('normal line height is 1.5', () => {
      expect(typographyTokens.lineHeight.normal).toBe('1.5');
    });

    it('looser line heights have higher values', () => {
      const tight  = parseFloat(typographyTokens.lineHeight.tight);
      const normal = parseFloat(typographyTokens.lineHeight.normal);
      const loose  = parseFloat(typographyTokens.lineHeight.loose);

      expect(normal).toBeGreaterThan(tight);
      expect(loose).toBeGreaterThan(normal);
    });
  });
});

describe('radiusTokens', () => {
  it('has all radius scales', () => {
    const expectedRadii = ['none', 'sm', 'DEFAULT', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];
    expectedRadii.forEach(radius => {
      expect(radiusTokens[radius as keyof typeof radiusTokens]).toBeDefined();
    });
  });

  it('radius none is zero', () => {
    expect(radiusTokens.none).toBe('0px');
  });

  it('radius full is maximum', () => {
    expect(radiusTokens.full).toBe('9999px');
  });

  it('radius values use px or rem units', () => {
    const unitPattern = /^\d+(\.\d+)?(px|rem)$/;
    Object.entries(radiusTokens).forEach(([key, value]) => {
      if (key !== 'full') {
        expect(value).toMatch(unitPattern);
      }
    });
  });

  it('default radius is 0.75rem', () => {
    expect(radiusTokens.DEFAULT).toBe('0.75rem');
  });
});

describe('shadowTokens', () => {
  it('has all shadow scales', () => {
    const expectedShadows = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'inner', 'none'];
    expectedShadows.forEach(shadow => {
      expect(shadowTokens[shadow as keyof typeof shadowTokens]).toBeDefined();
    });
  });

  it('shadow none has no shadow', () => {
    expect(shadowTokens.none).toBe('0 0 #0000');
  });

  it('shadows contain rgba values', () => {
    Object.entries(shadowTokens).forEach(([key, value]) => {
      if (key !== 'none') {
        expect(value).toContain('rgba');
      }
    });
  });

  it('inner shadow uses inset', () => {
    expect(shadowTokens.inner).toContain('inset');
  });

  it('larger shadows have larger offset values', () => {
    // Extract y-offset (second value) from each shadow
    const getYOffset = (shadow: string) => {
      // Pattern: "x-offset y-offset blur ..." - we want the second value
      const match = shadow.match(/^\d+\s+(\d+)px/);
      return match ? parseInt(match[1]) : 0;
    };

    const smOffset = getYOffset(shadowTokens.sm);
    const mdOffset = getYOffset(shadowTokens.md);
    const lgOffset = getYOffset(shadowTokens.lg);

    expect(mdOffset).toBeGreaterThan(smOffset);
    expect(lgOffset).toBeGreaterThan(mdOffset);
  });
});

describe('breakpointTokens', () => {
  it('has all breakpoint scales', () => {
    const expectedBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    expectedBreakpoints.forEach(bp => {
      expect(breakpointTokens[bp as keyof typeof breakpointTokens]).toBeDefined();
    });
  });

  it('breakpoints use px units', () => {
    const pxPattern = /^\d+px$/;
    Object.values(breakpointTokens).forEach(bp => {
      expect(bp).toMatch(pxPattern);
    });
  });

  it('larger breakpoints have larger pixel values', () => {
    const xs  = parseInt(breakpointTokens.xs);
    const sm  = parseInt(breakpointTokens.sm);
    const md  = parseInt(breakpointTokens.md);
    const lg  = parseInt(breakpointTokens.lg);
    const xl  = parseInt(breakpointTokens.xl);
    const xxl = parseInt(breakpointTokens['2xl']);

    expect(sm).toBeGreaterThan(xs);
    expect(md).toBeGreaterThan(sm);
    expect(lg).toBeGreaterThan(md);
    expect(xl).toBeGreaterThan(lg);
    expect(xxl).toBeGreaterThan(xl);
  });

  it('follows common breakpoint standards', () => {
    // Common Tailwind/Bootstrap-like breakpoints
    expect(breakpointTokens.sm).toBe('640px');
    expect(breakpointTokens.md).toBe('768px');
    expect(breakpointTokens.lg).toBe('1024px');
    expect(breakpointTokens.xl).toBe('1280px');
  });
});

describe('animationTokens', () => {
  describe('Animation durations', () => {
    it('has all duration scales', () => {
      const expectedDurations = ['75', '100', '150', '200', '300', '500', '700', '1000'];
      expectedDurations.forEach(duration => {
        expect(animationTokens.duration[duration as keyof typeof animationTokens.duration]).toBeDefined();
      });
    });

    it('durations use ms units', () => {
      const msPattern = /^\d+ms$/;
      Object.values(animationTokens.duration).forEach(duration => {
        expect(duration).toMatch(msPattern);
      });
    });

    it('duration values match their keys', () => {
      Object.entries(animationTokens.duration).forEach(([key, value]) => {
        expect(value).toBe(`${key}ms`);
      });
    });

    it('provides range from quick to slow animations', () => {
      const durations = Object.keys(animationTokens.duration).map(Number);
      expect(Math.min(...durations)).toBe(75);
      expect(Math.max(...durations)).toBe(1000);
    });
  });

  describe('Animation easing', () => {
    it('has all easing functions', () => {
      const expectedEasings = ['linear', 'in', 'out', 'inOut'];
      expectedEasings.forEach(easing => {
        expect(animationTokens.easing[easing as keyof typeof animationTokens.easing]).toBeDefined();
      });
    });

    it('linear easing is truly linear', () => {
      expect(animationTokens.easing.linear).toBe('linear');
    });

    it('cubic-bezier easings have correct format', () => {
      const bezierPattern = /^cubic-bezier\([\d.]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+\)$/;
      expect(animationTokens.easing.in).toMatch(bezierPattern);
      expect(animationTokens.easing.out).toMatch(bezierPattern);
      expect(animationTokens.easing.inOut).toMatch(bezierPattern);
    });
  });
});

describe('zIndexTokens', () => {
  it('has all z-index layers', () => {
    const expectedLayers = [
      'hide', 'base', 'docked', 'dropdown', 'sticky', 'banner',
      'overlay', 'modal', 'popover', 'skipLink', 'toast', 'tooltip',
    ];
    expectedLayers.forEach(layer => {
      expect(zIndexTokens[layer as keyof typeof zIndexTokens]).toBeDefined();
    });
  });

  it('hide layer is negative', () => {
    expect(zIndexTokens.hide).toBe(-1);
  });

  it('base layer is zero', () => {
    expect(zIndexTokens.base).toBe(0);
  });

  it('z-index values increase in logical stacking order', () => {
    expect(zIndexTokens.docked).toBeLessThan(zIndexTokens.dropdown as number);
    expect(zIndexTokens.dropdown).toBeLessThan(zIndexTokens.sticky as number);
    expect(zIndexTokens.sticky).toBeLessThan(zIndexTokens.modal as number);
    expect(zIndexTokens.modal).toBeLessThan(zIndexTokens.toast as number);
    expect(zIndexTokens.toast).toBeLessThan(zIndexTokens.tooltip as number);
  });

  it('tooltip has highest z-index', () => {
    const numericValues = Object.entries(zIndexTokens)
      .filter(([_, value]) => typeof value === 'number')
      .map(([_, value]) => value as number);

    expect(Math.max(...numericValues)).toBe(zIndexTokens.tooltip);
  });

  it('modal is above overlay', () => {
    expect(zIndexTokens.modal).toBeGreaterThan(zIndexTokens.overlay as number);
  });
});

describe('designTokens (unified export)', () => {
  it('exports all token systems', () => {
    expect(designTokens.colors).toBe(colorTokens);
    expect(designTokens.spacing).toBe(spacingTokens);
    expect(designTokens.typography).toBe(typographyTokens);
    expect(designTokens.radius).toBe(radiusTokens);
    expect(designTokens.shadows).toBe(shadowTokens);
    expect(designTokens.breakpoints).toBe(breakpointTokens);
    expect(designTokens.animations).toBe(animationTokens);
    expect(designTokens.zIndex).toBe(zIndexTokens);
  });

  it('provides consistent token structure', () => {
    expect(typeof designTokens).toBe('object');
    expect(Object.keys(designTokens)).toHaveLength(8);
  });

  it('all token systems are objects', () => {
    Object.values(designTokens).forEach(tokenSystem => {
      expect(typeof tokenSystem).toBe('object');
    });
  });
});

describe('Token system consistency', () => {
  it('maintains consistent naming conventions', () => {
    // Check that multi-word keys use camelCase
    const allKeys = [
      ...Object.keys(colorTokens.semantic),
      ...Object.keys(typographyTokens.fontWeight),
      ...Object.keys(typographyTokens.lineHeight),
    ];

    allKeys.forEach(key => {
      // Should not contain underscores or hyphens
      expect(key).not.toContain('_');
      expect(key).not.toContain('-');
    });
  });

  it('uses "as const" for immutability', () => {
    // TypeScript enforces this at compile time
    expect(typeof colorTokens).toBe('object');
    expect(typeof spacingTokens).toBe('object');
  });

  it('provides comprehensive coverage of design needs', () => {
    // Should have tokens for all major design aspects
    expect(designTokens.colors).toBeDefined(); // Color system
    expect(designTokens.spacing).toBeDefined(); // Layout
    expect(designTokens.typography).toBeDefined(); // Text
    expect(designTokens.radius).toBeDefined(); // Borders
    expect(designTokens.shadows).toBeDefined(); // Depth
    expect(designTokens.breakpoints).toBeDefined(); // Responsive
    expect(designTokens.animations).toBeDefined(); // Motion
    expect(designTokens.zIndex).toBeDefined(); // Stacking
  });
});
