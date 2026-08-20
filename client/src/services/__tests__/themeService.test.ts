/**
 * @jest-environment jsdom
 *
 * Theme Service Tests
 *
 * Tests theme management functionality following boundary mocking pattern:
 * - NO mocking needed - this service manipulates the DOM directly
 * - Test REAL service logic (CSS variable manipulation, style element management)
 */

import { themeService, ThemeVariables } from '../themeService';
import { BrandSettings } from '../brandingService';

describe('themeService', () => {
  // Store original document state
  let originalGetComputedStyle: typeof window.getComputedStyle;

  beforeEach(() => {
    // Clear all CSS variables
    document.documentElement.style.cssText = '';

    // Remove any custom style elements
    const customStyles = document.getElementById('custom-brand-styles');
    if (customStyles) {
      customStyles.remove();
    }

    originalGetComputedStyle = window.getComputedStyle;
  });

  afterEach(() => {
    // Restore original state
    document.documentElement.style.cssText = '';
    const customStyles = document.getElementById('custom-brand-styles');
    if (customStyles) {
      customStyles.remove();
    }
    window.getComputedStyle = originalGetComputedStyle;
  });

  describe('applyTheme', () => {
    it('should apply primary color to document root', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      themeService.applyTheme(brandSettings);

      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#FF5733');
    });

    it('should apply secondary color to document root', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      themeService.applyTheme(brandSettings);

      expect(document.documentElement.style.getPropertyValue('--color-secondary')).toBe('#33FF57');
    });

    it('should handle null primary color by setting to null', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: undefined as unknown as string,
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      themeService.applyTheme(brandSettings);

      // When undefined is passed, setProperty receives null
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('');
    });

    it('should apply custom CSS via style element', () => {
      const customCSS = '.custom-class { color: red; }';
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
        customCSS,
      };

      themeService.applyTheme(brandSettings);

      const styleElement = document.getElementById('custom-brand-styles') as HTMLStyleElement;
      expect(styleElement).toBeTruthy();
      expect(styleElement.textContent).toBe(customCSS);
    });

    it('should create custom style element if not exists', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
        customCSS: '.test { color: blue; }',
      };

      expect(document.getElementById('custom-brand-styles')).toBeNull();

      themeService.applyTheme(brandSettings);

      expect(document.getElementById('custom-brand-styles')).toBeTruthy();
    });

    it('should reuse existing custom style element', () => {
      // Create initial style element
      const existingStyle = document.createElement('style');
      existingStyle.id = 'custom-brand-styles';
      existingStyle.textContent = '.old { color: gray; }';
      document.head.appendChild(existingStyle);

      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
        customCSS: '.new { color: yellow; }',
      };

      themeService.applyTheme(brandSettings);

      const styleElements = document.querySelectorAll('#custom-brand-styles');
      expect(styleElements.length).toBe(1);
      expect((styleElements[0] as HTMLStyleElement).textContent).toBe('.new { color: yellow; }');
    });

    it('should not create style element without customCSS', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      themeService.applyTheme(brandSettings);

      expect(document.getElementById('custom-brand-styles')).toBeNull();
    });
  });

  describe('removeTheme', () => {
    it('should remove primary color from document root', () => {
      document.documentElement.style.setProperty('--color-primary', '#FF5733');

      themeService.removeTheme();

      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('');
    });

    it('should remove secondary color from document root', () => {
      document.documentElement.style.setProperty('--color-secondary', '#33FF57');

      themeService.removeTheme();

      expect(document.documentElement.style.getPropertyValue('--color-secondary')).toBe('');
    });

    it('should remove custom style element', () => {
      const styleElement = document.createElement('style');
      styleElement.id = 'custom-brand-styles';
      styleElement.textContent = '.custom { color: red; }';
      document.head.appendChild(styleElement);

      expect(document.getElementById('custom-brand-styles')).toBeTruthy();

      themeService.removeTheme();

      expect(document.getElementById('custom-brand-styles')).toBeNull();
    });

    it('should handle removeTheme when no custom styles exist', () => {
      expect(() => themeService.removeTheme()).not.toThrow();
    });

    it('should handle removeTheme when no CSS variables are set', () => {
      expect(() => themeService.removeTheme()).not.toThrow();
    });
  });

  describe('generateCssVariables', () => {
    it('should generate CSS variables from brand settings', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      const variables = themeService.generateCssVariables(brandSettings);

      expect(variables['--color-primary']).toBe('#FF5733');
      expect(variables['--color-secondary']).toBe('#33FF57');
    });

    it('should use default primary color when not provided', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      const variables = themeService.generateCssVariables(brandSettings);

      expect(variables['--color-primary']).toBe('#3B82F6');
    });

    it('should use default secondary color when not provided', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      const variables = themeService.generateCssVariables(brandSettings);

      expect(variables['--color-secondary']).toBe('#10B981');
    });

    it('should include accent color', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      const variables = themeService.generateCssVariables(brandSettings);

      expect(variables['--color-accent']).toBe('#06B6D4');
    });

    it('should include success color', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      const variables = themeService.generateCssVariables(brandSettings);

      expect(variables['--color-success']).toBe('#10B981');
    });

    it('should include warning color', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      const variables = themeService.generateCssVariables(brandSettings);

      expect(variables['--color-warning']).toBe('#F59E0B');
    });

    it('should include error color', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      const variables = themeService.generateCssVariables(brandSettings);

      expect(variables['--color-error']).toBe('#EF4444');
    });

    it('should return all required CSS variables', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      const variables = themeService.generateCssVariables(brandSettings);

      expect(Object.keys(variables)).toEqual([
        '--color-primary',
        '--color-secondary',
        '--color-accent',
        '--color-success',
        '--color-warning',
        '--color-error',
      ]);
    });
  });

  describe('previewTheme', () => {
    let previewElement: HTMLDivElement;

    beforeEach(() => {
      previewElement = document.createElement('div');
      document.body.appendChild(previewElement);
    });

    afterEach(() => {
      previewElement.remove();
    });

    it('should apply CSS variables to preview element', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      themeService.previewTheme(brandSettings, previewElement);

      expect(previewElement.style.getPropertyValue('--color-primary')).toBe('#FF5733');
      expect(previewElement.style.getPropertyValue('--color-secondary')).toBe('#33FF57');
    });

    it('should apply all theme variables to preview element', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      themeService.previewTheme(brandSettings, previewElement);

      expect(previewElement.style.getPropertyValue('--color-accent')).toBe('#06B6D4');
      expect(previewElement.style.getPropertyValue('--color-success')).toBe('#10B981');
      expect(previewElement.style.getPropertyValue('--color-warning')).toBe('#F59E0B');
      expect(previewElement.style.getPropertyValue('--color-error')).toBe('#EF4444');
    });

    it('should apply custom CSS to preview element only', () => {
      const customCSS = '.preview-only { font-size: 20px; }';
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
        customCSS,
      };

      themeService.previewTheme(brandSettings, previewElement);

      const styleElement = previewElement.querySelector('#preview-custom-styles') as HTMLStyleElement;
      expect(styleElement).toBeTruthy();
      expect(styleElement.textContent).toBe(customCSS);
    });

    it('should not affect document root', () => {
      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
      };

      themeService.previewTheme(brandSettings, previewElement);

      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('');
    });

    it('should reuse existing preview style element', () => {
      const existingStyle = document.createElement('style');
      existingStyle.id = 'preview-custom-styles';
      existingStyle.textContent = '.old { color: gray; }';
      previewElement.appendChild(existingStyle);

      const brandSettings: BrandSettings = {
        id: '1',
        name: 'Test Brand',
        primaryColor: '#FF5733',
        secondaryColor: '#33FF57',
        logoUrl: '',
        faviconUrl: '',
        clubId: 1,
        customCSS: '.new { color: yellow; }',
      };

      themeService.previewTheme(brandSettings, previewElement);

      const styleElements = previewElement.querySelectorAll('#preview-custom-styles');
      expect(styleElements.length).toBe(1);
      expect((styleElements[0] as HTMLStyleElement).textContent).toBe('.new { color: yellow; }');
    });
  });

  describe('getCurrentTheme', () => {
    it('should get current primary color from computed styles', () => {
      document.documentElement.style.setProperty('--color-primary', '#FF5733');

      // Mock getComputedStyle
      window.getComputedStyle = jest.fn().mockReturnValue({
        getPropertyValue: jest.fn((prop: string) => {
          if (prop === '--color-primary') return '#FF5733';
          return '';
        }),
      });

      const theme = themeService.getCurrentTheme();

      expect(theme['--color-primary']).toBe('#FF5733');
    });

    it('should return default values when CSS variables not set', () => {
      // Mock getComputedStyle returning empty values
      window.getComputedStyle = jest.fn().mockReturnValue({
        getPropertyValue: jest.fn(() => ''),
      });

      const theme = themeService.getCurrentTheme();

      expect(theme['--color-primary']).toBe('#3B82F6');
      expect(theme['--color-secondary']).toBe('#8B5CF6');
      expect(theme['--color-accent']).toBe('#06B6D4');
      expect(theme['--color-success']).toBe('#10B981');
      expect(theme['--color-warning']).toBe('#F59E0B');
      expect(theme['--color-error']).toBe('#EF4444');
    });

    it('should return all theme variables', () => {
      window.getComputedStyle = jest.fn().mockReturnValue({
        getPropertyValue: jest.fn((prop: string) => {
          const values: Record<string, string> = {
            '--color-primary': '#FF0000',
            '--color-secondary': '#00FF00',
            '--color-accent': '#0000FF',
            '--color-success': '#00FF00',
            '--color-warning': '#FFFF00',
            '--color-error': '#FF0000',
          };
          return values[prop] || '';
        }),
      });

      const theme = themeService.getCurrentTheme();

      expect(Object.keys(theme)).toEqual([
        '--color-primary',
        '--color-secondary',
        '--color-accent',
        '--color-success',
        '--color-warning',
        '--color-error',
      ]);
    });
  });

  describe('service instance', () => {
    it('should export themeService singleton', () => {
      expect(themeService).toBeDefined();
    });

    it('should have applyTheme method', () => {
      expect(typeof themeService.applyTheme).toBe('function');
    });

    it('should have removeTheme method', () => {
      expect(typeof themeService.removeTheme).toBe('function');
    });

    it('should have generateCssVariables method', () => {
      expect(typeof themeService.generateCssVariables).toBe('function');
    });

    it('should have previewTheme method', () => {
      expect(typeof themeService.previewTheme).toBe('function');
    });

    it('should have getCurrentTheme method', () => {
      expect(typeof themeService.getCurrentTheme).toBe('function');
    });
  });
});
