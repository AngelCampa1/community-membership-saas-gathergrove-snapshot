'use client';

import DOMPurify from 'dompurify';

/**
 * Security utilities for XSS prevention and input sanitization
 */
export class SecurityUtils {
  private static readonly DEFAULT_ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'a'
  ];

  private static readonly DEFAULT_ALLOWED_ATTR = [
    'class', 'href', 'title', 'target', 'rel', 'aria-label'
  ];

  /**
   * Sanitize HTML content to prevent XSS attacks
   * @param html - Raw HTML string to sanitize
   * @param allowedTags - Optional array of allowed HTML tags
   * @returns Sanitized HTML string
   */
  static sanitizeHtml(html: string, allowedTags?: string[]): string {
    if (!html) return '';

    const config: Record<string, unknown> = {
      ALLOWED_TAGS: allowedTags || this.DEFAULT_ALLOWED_TAGS,
      ALLOWED_ATTR: this.DEFAULT_ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: true,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'meta', 'link', 'base', 'svg', 'math'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur',
        'onpaste', 'onwheel', 'onscroll', 'onresize', 'onkeydown', 'onkeyup', 'onkeypress',
        'onchange', 'oninput', 'onsubmit', 'ondrag', 'ondrop', 'oncontextmenu', 'style', 'srcdoc'],
      SAFE_FOR_TEMPLATES: true,
      USE_PROFILES: { html: true },
      RETURN_TRUSTED_TYPE: false,
    };

    return DOMPurify.sanitize(html, config) as string;
  }

  /**
   * Sanitize text content for safe display
   * @param text - Raw text to sanitize
   * @returns Sanitized text string
   */
  static sanitizeText(text: string): string {
    if (!text) return '';
    
    // Strip all HTML tags and decode entities
    return DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true 
    });
  }

  /**
   * Validate and sanitize user input
   * @param input - User input to validate
   * @param maxLength - Maximum allowed length
   * @returns Sanitized and validated input
   */
  static validateInput(input: string, maxLength: number = 1000): string {
    if (!input) return '';
    
    // Trim whitespace and limit length
    const trimmed = input.trim().substring(0, maxLength);
    
    // Sanitize for XSS
    return this.sanitizeText(trimmed);
  }

  /**
   * Create safe innerHTML object for React dangerouslySetInnerHTML
   * @param html - HTML content to sanitize
   * @param allowedTags - Optional array of allowed HTML tags
   * @returns Safe object for dangerouslySetInnerHTML
   */
  static createSafeHTML(html: string, allowedTags?: string[]): { __html: string } {
    return {
      __html: this.sanitizeHtml(html, allowedTags)
    };
  }

  /**
   * Validate URL to prevent malicious redirects
   * @param url - URL to validate
   * @returns True if URL is safe
   */
  static isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      return allowedProtocols.includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Sanitize CSS content to prevent XSS attacks and CSS injection
   * Removes dangerous CSS properties, patterns, and embedded scripts
   * @param css - CSS content to sanitize
   * @returns Sanitized CSS content
   */
  static sanitizeCSS(css: string): string {
    if (!css || typeof css !== 'string') {
      return '';
    }

    // Remove potentially dangerous patterns (merged from both previous implementations)
    const dangerous = [
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /expression\s*\(/gi,
      /behavior\s*:/gi,
      /@import/gi,
      /binding\s*:/gi,
      /-webkit-binding/gi,
      /-moz-binding/gi,
      /moz-binding/gi,
      /url\s*\(\s*(['"]?)\s*(?:javascript|data|vbscript):.*?\1\s*\)/gi,
    ];

    let sanitized = css;
    dangerous.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Remove any script tags that might be embedded
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    return sanitized;
  }
}

/**
 * Hook for safe HTML rendering in React components
 * @param html - HTML content to render safely
 * @param allowedTags - Optional array of allowed HTML tags
 * @returns Safe object for dangerouslySetInnerHTML
 */
export function useSafeHTML(html: string, allowedTags?: string[]): { __html: string } {
  return SecurityUtils.createSafeHTML(html, allowedTags);
}

/**
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://widgets.ventoralabs.com https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
  'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src': "'self' https://fonts.gstatic.com",
  'img-src': "'self' data: https: blob:",
  'connect-src': "'self' https://widgets.ventoralabs.com https://api.stripe.com https://www.google-analytics.com https://api-gathergrove-staging.azurewebsites.net https://api-gathergrove-prod.azurewebsites.net https://api.gathergrove.club http://localhost:5284",
  'frame-src': "'self' https://js.stripe.com https://hooks.stripe.com",
  'object-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'"
};

// Export aliases for common functions - wrap static methods to ensure proper binding
export const createSafeHTML = (html: string, allowedTags?: string[]) => SecurityUtils.createSafeHTML(html, allowedTags);
export const sanitizeInput = (input: string, maxLength?: number) => SecurityUtils.validateInput(input, maxLength);
export const sanitizeHtml = (html: string, allowedTags?: string[]) => SecurityUtils.sanitizeHtml(html, allowedTags);
export const sanitizeText = (text: string) => SecurityUtils.sanitizeText(text);
export const sanitizeCSS = (css: string) => SecurityUtils.sanitizeCSS(css);
