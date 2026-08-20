/**
 * Tests for CriticalCSS.tsx - Critical CSS injection for above-the-fold content
 * CriticalCSS is a Server Component that injects a hardcoded CSS constant.
 * No sanitization is performed because the CSS is not user input.
 */

import React from 'react';
import { render } from '@testing-library/react';
import CriticalCSS from '../CriticalCSS';

describe('CriticalCSS', () => {

  describe('Rendering', () => {
    it('renders without error', () => {
      const { container } = render(<CriticalCSS />);
      expect(container).toBeInTheDocument();
    });

    it('renders a style tag', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
    });

    it('wraps in Suspense', () => {
      // Component uses Suspense, so it should render without throwing
      expect(() => render(<CriticalCSS />)).not.toThrow();
    });
  });

  describe('CSS Safety', () => {
    it('does not contain any script tags in injected CSS', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');
      expect(styleTag?.innerHTML).not.toContain('<script>');
      expect(styleTag?.innerHTML).not.toContain('javascript:');
    });

    it('injects the hardcoded CSS constant directly without transformation', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');
      // The CSS is a trusted hardcoded constant — verify a known substring is present
      expect(styleTag?.innerHTML).toContain('box-sizing: border-box');
    });
  });

  describe('Critical CSS Content', () => {
    it('includes CSS reset styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('box-sizing: border-box');
    });

    it('includes HTML base styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('html {');
      expect(styleTag?.innerHTML).toContain('line-height: 1.6');
      expect(styleTag?.innerHTML).toContain('-webkit-font-smoothing: antialiased');
    });

    it('includes body base styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('body {');
      expect(styleTag?.innerHTML).toContain('font-family:');
      expect(styleTag?.innerHTML).toContain('margin: 0');
    });

    it('includes critical layout styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.min-h-screen');
      expect(styleTag?.innerHTML).toContain('min-height: 100vh');
    });

    it('includes hero section styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.hero-section');
      expect(styleTag?.innerHTML).toContain('.hero-title');
      expect(styleTag?.innerHTML).toContain('.hero-description');
    });

    it('includes CTA button styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.cta-button');
      expect(styleTag?.innerHTML).toContain('display: inline-flex');
    });

    it('includes header styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.header');
      expect(styleTag?.innerHTML).toContain('position: fixed');
      expect(styleTag?.innerHTML).toContain('backdrop-filter: blur(8px)');
    });

    it('includes navigation styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.nav-links');
    });

    it('includes loading skeleton styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.skeleton');
      expect(styleTag?.innerHTML).toContain('@keyframes loading');
    });

    it('includes layout stabilization styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.platform-preview-container');
      expect(styleTag?.innerHTML).toContain('min-height: 400px');
    });

    it('includes CLS prevention styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('[data-lazy-loaded="false"]');
      expect(styleTag?.innerHTML).toContain('min-height: 200px');
    });

    it('includes responsive media queries', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('@media (min-width: 640px)');
    });

    it('includes reduced motion support', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('@media (prefers-reduced-motion: reduce)');
      expect(styleTag?.innerHTML).toContain('animation-duration: 0.01ms !important');
    });
  });

  describe('Performance Optimizations', () => {
    it('reserves space for hero title to prevent CLS', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      // Hero title has min-height to prevent layout shift
      expect(styleTag?.innerHTML).toContain('min-height: 3rem');
    });

    it('reserves space for hero description to prevent CLS', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      // Hero description has min-height
      expect(styleTag?.innerHTML).toContain('min-height: 2.5rem');
    });

    it('uses min-height for hero section to prevent CLS', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.hero-section');
      expect(styleTag?.innerHTML).toContain('min-height: 80vh');
    });

    it('defines aspect-ratio for platform preview to prevent CLS', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('aspect-ratio: 16/10');
    });

    it('includes font-smoothing for better text rendering', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('-webkit-font-smoothing: antialiased');
      expect(styleTag?.innerHTML).toContain('-moz-osx-font-smoothing: grayscale');
    });

    it('uses CSS custom properties for theming', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('var(--background)');
      expect(styleTag?.innerHTML).toContain('var(--foreground)');
      expect(styleTag?.innerHTML).toContain('var(--primary)');
    });
  });

  describe('Accessibility', () => {
    it('respects reduced motion preferences', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('prefers-reduced-motion: reduce');
    });

    it('reduces animation duration for reduced motion', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      const cssContent = styleTag?.innerHTML || '';
      const reducedMotionSection = cssContent.substring(
        cssContent.indexOf('prefers-reduced-motion')
      );

      expect(reducedMotionSection).toContain('animation-duration: 0.01ms !important');
    });

    it('reduces transition duration for reduced motion', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      const cssContent = styleTag?.innerHTML || '';
      const reducedMotionSection = cssContent.substring(
        cssContent.indexOf('prefers-reduced-motion')
      );

      expect(reducedMotionSection).toContain('transition-duration: 0.01ms !important');
    });

    it('limits animation iteration count for reduced motion', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      const cssContent = styleTag?.innerHTML || '';
      const reducedMotionSection = cssContent.substring(
        cssContent.indexOf('prefers-reduced-motion')
      );

      expect(reducedMotionSection).toContain('animation-iteration-count: 1 !important');
    });
  });

  describe('Layout Styles', () => {
    it('includes header layout with fixed positioning', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.header {');
      expect(styleTag?.innerHTML).toContain('position: fixed');
      expect(styleTag?.innerHTML).toContain('top: 0');
    });

    it('includes header z-index for layering', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('z-index: 50');
    });

    it('includes flexbox styles for header content', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.header-content');
      expect(styleTag?.innerHTML).toContain('display: flex');
      expect(styleTag?.innerHTML).toContain('justify-content: space-between');
    });

    it('includes logo styles', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.logo');
      expect(styleTag?.innerHTML).toContain('font-weight: 700');
    });

    it('includes responsive padding for hero section', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      // Mobile padding
      expect(styleTag?.innerHTML).toContain('padding: 4rem 1rem 2rem');

      // Desktop padding (in media query)
      const cssContent = styleTag?.innerHTML || '';
      expect(cssContent).toContain('padding: 6rem 1rem 4rem');
    });

    it('includes responsive font sizes', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      // Mobile font size
      expect(styleTag?.innerHTML).toContain('font-size: 2.5rem');

      // Desktop font size (in media query)
      const cssContent = styleTag?.innerHTML || '';
      const mediaQuerySection = cssContent.substring(
        cssContent.indexOf('min-width: 640px')
      );
      expect(mediaQuerySection).toContain('font-size: 3.5rem');
    });
  });

  describe('Visual Styles', () => {
    it('includes CTA button hover state', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.cta-button:hover');
      expect(styleTag?.innerHTML).toContain('opacity: 0.9');
    });

    it('includes header backdrop blur', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('backdrop-filter: blur(8px)');
    });

    it('includes header border', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('border-bottom: 1px solid var(--border)');
    });

    it('includes loading animation keyframes', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('@keyframes loading');
      expect(styleTag?.innerHTML).toContain('background-position: 200% 0');
      expect(styleTag?.innerHTML).toContain('background-position: -200% 0');
    });

    it('includes skeleton background color', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');

      expect(styleTag?.innerHTML).toContain('.skeleton');
      expect(styleTag?.innerHTML).toContain('background-color: var(--muted)');
    });
  });

  describe('Edge Cases', () => {
    it('renders consistently across multiple renders', () => {
      const { container: c1 } = render(<CriticalCSS />);
      const { container: c2 } = render(<CriticalCSS />);
      expect(c1.querySelector('style')?.innerHTML).toBe(
        c2.querySelector('style')?.innerHTML
      );
    });

    it('style tag innerHTML is non-empty', () => {
      const { container } = render(<CriticalCSS />);
      const styleTag = container.querySelector('style');
      expect(styleTag?.innerHTML.trim().length).toBeGreaterThan(0);
    });
  });
});
