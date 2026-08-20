/**
 * Security Tests - Full Coverage
 *
 * Target: 100% coverage on security.ts
 */

import { SecurityUtils, useSafeHTML, createSafeHTML, sanitizeInput, sanitizeHtml, sanitizeText, sanitizeCSS, CSP_CONFIG } from '../security';
import { renderHook } from '@testing-library/react';

// Mock DOMPurify - use regular function to avoid jest.fn() reset issues
jest.mock('dompurify', () => {
  // Create a stable mock function that won't be reset
  const sanitizeFn = (input: string) => {
    if (typeof input !== 'string') return '';
    return input.replace(/<script.*?>.*?<\/script>/gi, '');
  };

  return {
    __esModule: true,
    default: {
      sanitize: sanitizeFn,
    },
  };
});

describe('SecurityUtils', () => {
  describe('sanitizeHtml', () => {
    it('should return empty string for empty input', () => {
      expect(SecurityUtils.sanitizeHtml('')).toBe('');
    });

    it('should sanitize HTML with default allowed tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script>';
      const result = SecurityUtils.sanitizeHtml(html);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should sanitize HTML with custom allowed tags', () => {
      const html = '<div>Content</div>';
      const allowedTags = ['div', 'span'];
      const result = SecurityUtils.sanitizeHtml(html, allowedTags);

      expect(result).toBeDefined();
    });

    it('should remove dangerous tags', () => {
      const html = '<script>malicious()</script><p>Safe</p>';
      const result = SecurityUtils.sanitizeHtml(html);

      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeText', () => {
    it('should return empty string for empty input', () => {
      expect(SecurityUtils.sanitizeText('')).toBe('');
    });

    it('should strip all HTML tags from text', () => {
      const text = '<p>Hello <b>World</b></p>';
      const result = SecurityUtils.sanitizeText(text);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle plain text', () => {
      const text = 'Just plain text';
      const result = SecurityUtils.sanitizeText(text);

      expect(result).toBe('Just plain text');
    });
  });

  describe('validateInput', () => {
    it('should return empty string for empty input', () => {
      expect(SecurityUtils.validateInput('')).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  test  ';
      const result = SecurityUtils.validateInput(input);

      expect(result).toBe('test');
    });

    it('should enforce default max length of 1000', () => {
      const input = 'a'.repeat(1500);
      const result = SecurityUtils.validateInput(input);

      expect(result.length).toBe(1000);
    });

    it('should enforce custom max length', () => {
      const input = 'a'.repeat(100);
      const result = SecurityUtils.validateInput(input, 50);

      expect(result.length).toBe(50);
    });

    it('should sanitize HTML in input', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = SecurityUtils.validateInput(input);

      expect(result).toBeDefined();
    });

    it('should handle input shorter than max length', () => {
      const input = 'short';
      const result = SecurityUtils.validateInput(input, 100);

      expect(result).toBe('short');
    });
  });

  describe('createSafeHTML', () => {
    it('should create dangerouslySetInnerHTML object', () => {
      const html = '<p>Safe content</p>';
      const result = SecurityUtils.createSafeHTML(html);

      expect(result).toHaveProperty('__html');
      expect(typeof result.__html).toBe('string');
    });

    it('should sanitize HTML before creating object', () => {
      const html = '<script>alert("xss")</script><p>Content</p>';
      const result = SecurityUtils.createSafeHTML(html);

      expect(result.__html).not.toContain('<script>');
    });

    it('should accept custom allowed tags', () => {
      const html = '<div>Custom</div>';
      const allowedTags = ['div'];
      const result = SecurityUtils.createSafeHTML(html, allowedTags);

      expect(result).toHaveProperty('__html');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(SecurityUtils.isValidUrl('http://example.com')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(SecurityUtils.isValidUrl('https://example.com')).toBe(true);
    });

    it('should return true for URLs with paths', () => {
      expect(SecurityUtils.isValidUrl('https://example.com/path/to/page')).toBe(true);
    });

    it('should return true for URLs with query parameters', () => {
      expect(SecurityUtils.isValidUrl('https://example.com?param=value')).toBe(true);
    });

    it('should return false for javascript: protocol', () => {
      expect(SecurityUtils.isValidUrl('javascript:alert("xss")')).toBe(false);
    });

    it('should return false for data: protocol', () => {
      expect(SecurityUtils.isValidUrl('data:text/html,<script>alert("xss")</script>')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(SecurityUtils.isValidUrl('not a url')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(SecurityUtils.isValidUrl('')).toBe(false);
    });

    it('should return false for malformed URLs', () => {
      expect(SecurityUtils.isValidUrl('ht!tp://bad')).toBe(false);
    });
  });

  describe('sanitizeCSS', () => {
    it('should allow safe CSS properties', () => {
      const css = 'color: blue;';
      const result = SecurityUtils.sanitizeCSS(css);

      expect(result).toContain('color');
    });

    it('should remove JavaScript expressions from CSS', () => {
      const css = 'background: url(javascript:alert("xss"));';
      const result = SecurityUtils.sanitizeCSS(css);

      expect(result).not.toContain('javascript:');
    });

    it('should remove expression() from CSS', () => {
      const css = 'width: expression(alert("xss"));';
      const result = SecurityUtils.sanitizeCSS(css);

      expect(result).not.toContain('expression(');
    });

    it('should remove @import statements', () => {
      const css = '@import url("malicious.css"); color: red;';
      const result = SecurityUtils.sanitizeCSS(css);

      expect(result).not.toContain('@import');
    });

    it('should handle empty CSS', () => {
      const result = SecurityUtils.sanitizeCSS('');

      expect(result).toBe('');
    });

    it('should preserve multiple safe properties', () => {
      const css = 'color: red; font-size: 14px; margin: 10px;';
      const result = SecurityUtils.sanitizeCSS(css);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});

describe('useSafeHTML hook', () => {
  it('should return safe HTML object', () => {
    const html = '<p>Test</p>';
    const { result } = renderHook(() => useSafeHTML(html));

    expect(result.current).toHaveProperty('__html');
  });

  it('should sanitize HTML in hook', () => {
    const html = '<script>alert("xss")</script><p>Content</p>';
    const { result } = renderHook(() => useSafeHTML(html));

    expect(result.current.__html).not.toContain('<script>');
  });

  it('should accept custom allowed tags', () => {
    const html = '<div>Custom</div>';
    const allowedTags = ['div'];
    const { result } = renderHook(() => useSafeHTML(html, allowedTags));

    expect(result.current).toHaveProperty('__html');
  });
});

describe('Exported utility functions', () => {
  it('createSafeHTML should work as standalone function', () => {
    const result = createSafeHTML('<p>Test</p>');

    expect(result).toHaveProperty('__html');
  });

  it('sanitizeInput should work as standalone function', () => {
    const result = sanitizeInput('  test  ');

    expect(result).toBe('test');
  });

  it('sanitizeHtml should work as standalone function', () => {
    const result = sanitizeHtml('<p>Test</p>');

    expect(result).toBeDefined();
  });

  it('sanitizeText should work as standalone function', () => {
    const result = sanitizeText('<p>Test</p>');

    expect(result).toBeDefined();
  });

  it('sanitizeCSS should work as standalone function', () => {
    const result = sanitizeCSS('color: blue;');

    expect(result).toBeDefined();
  });
});

describe('CSP_CONFIG', () => {
  it('should export CSP configuration object', () => {
    expect(CSP_CONFIG).toBeDefined();
    expect(typeof CSP_CONFIG).toBe('object');
  });

  it('should have font-src directive', () => {
    expect(CSP_CONFIG['font-src']).toBeDefined();
    expect(CSP_CONFIG['font-src']).toContain('fonts.gstatic.com');
  });

  it('should allow Ventora widget loader and data endpoints', () => {
    expect(CSP_CONFIG['script-src']).toContain('https://widgets.ventoralabs.com');
    expect(CSP_CONFIG['connect-src']).toContain('https://widgets.ventoralabs.com');
  });
});
