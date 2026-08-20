import { BrandSettings } from './brandingService';

export interface ThemeVariables {
  '--color-primary': string;
  '--color-secondary': string;
  '--color-accent': string;
  '--color-success': string;
  '--color-warning': string;
  '--color-error': string;
}

export const themeService = {
  /**
   * Apply theme variables to the document
   */
  applyTheme(brandSettings: BrandSettings): void {
    const root = document.documentElement;
    
    // Apply primary and secondary colors
    root.style.setProperty('--color-primary', brandSettings.primaryColor || null);
    root.style.setProperty('--color-secondary', brandSettings.secondaryColor || null);
    
    // Apply additional brand colors if available
    if (brandSettings.customCSS) {
      // Create a temporary style element to apply custom CSS
      let styleElement = document.getElementById('custom-brand-styles') as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-brand-styles';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = brandSettings.customCSS;
    }
  },
  
  /**
   * Remove custom theme and restore defaults
   */
  removeTheme(): void {
    const root = document.documentElement;
    
    // Reset to default colors
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-secondary');
    
    // Remove custom CSS
    const styleElement = document.getElementById('custom-brand-styles');
    if (styleElement) {
      styleElement.remove();
    }
  },
  
  /**
   * Generate CSS variables from brand settings
   */
  generateCssVariables(brandSettings: BrandSettings): ThemeVariables {
    return {
      '--color-primary': brandSettings.primaryColor || '#3B82F6',
      '--color-secondary': brandSettings.secondaryColor || '#10B981',
      '--color-accent': '#06B6D4',
      '--color-success': '#10B981',
      '--color-warning': '#F59E0B',
      '--color-error': '#EF4444'
    };
  },
  
  /**
   * Preview theme changes without applying them
   */
  previewTheme(brandSettings: BrandSettings, previewElement: HTMLElement): void {
    const variables = this.generateCssVariables(brandSettings);
    
    Object.entries(variables).forEach(([property, value]) => {
      previewElement.style.setProperty(property, value);
    });
    
    if (brandSettings.customCSS) {
      // Apply custom CSS to preview element only
      let styleElement = previewElement.querySelector('#preview-custom-styles') as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'preview-custom-styles';
        previewElement.appendChild(styleElement);
      }
      styleElement.textContent = brandSettings.customCSS;
    }
  },
  
  /**
   * Get current theme variables
   */
  getCurrentTheme(): ThemeVariables {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    return {
      '--color-primary': computedStyle.getPropertyValue('--color-primary') || '#3B82F6',
      '--color-secondary': computedStyle.getPropertyValue('--color-secondary') || '#8B5CF6',
      '--color-accent': computedStyle.getPropertyValue('--color-accent') || '#06B6D4',
      '--color-success': computedStyle.getPropertyValue('--color-success') || '#10B981',
      '--color-warning': computedStyle.getPropertyValue('--color-warning') || '#F59E0B',
      '--color-error': computedStyle.getPropertyValue('--color-error') || '#EF4444'
    };
  }
};
