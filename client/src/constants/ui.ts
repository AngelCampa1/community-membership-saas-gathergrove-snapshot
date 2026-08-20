/**
 * UI Constants
 *
 * Centralized constants for UI-related values used throughout the application.
 * These constants ensure consistency and make it easier to update values globally.
 *
 * Token-sourced values (TOUCH_TARGET, BREAKPOINTS, ANIMATION_DURATION, BORDER_RADIUS)
 * are derived from shared/design-tokens/ and re-exported here in app-convenient shapes.
 * To update: edit the JSON source files and run `npm run tokens:build` from the repo root.
 */

import { tokens } from '../generated/tokens';

/**
 * Accessibility - Touch Target Sizes (WCAG 2.1)
 * Derived from tokens.accessibility.touchTarget
 */
export const TOUCH_TARGET = {
  /** Minimum touch target size in pixels (WCAG 2.1 AA - 2.5.5) */
  MIN_SIZE: parseInt(tokens.accessibility.touchTarget.minimum),
  /** Recommended touch target size for better UX */
  RECOMMENDED_SIZE: parseInt(tokens.accessibility.touchTarget.recommended),
  /** Minimum spacing between touch targets */
  MIN_SPACING: parseInt(tokens.accessibility.touchTarget.spacing),
} as const;

/**
 * Responsive Breakpoints (matches Tailwind config)
 * Derived from tokens.breakpoint
 */
export const BREAKPOINTS = {
  /** Extra small devices (475px and up) */
  XS: parseInt(tokens.breakpoint.xs),
  /** Small devices (640px and up) */
  SM: parseInt(tokens.breakpoint.sm),
  /** Medium devices - Tablets (768px and up) */
  MD: parseInt(tokens.breakpoint.md),
  /** Large devices - Laptops (1024px and up) */
  LG: parseInt(tokens.breakpoint.lg),
  /** Extra large devices - Desktops (1280px and up) */
  XL: parseInt(tokens.breakpoint.xl),
  /** 2XL devices - Large screens (1536px and up) */
  '2XL': parseInt(tokens.breakpoint['2xl']),
} as const;

/**
 * Animation Durations (milliseconds)
 * Derived from tokens.animation.duration
 */
export const ANIMATION_DURATION = {
  /** Fast micro-interactions (200ms) */
  FAST: parseInt(tokens.animation.duration['200']),
  /** Default transitions (300ms) */
  DEFAULT: parseInt(tokens.animation.duration['300']),
  /** Slow page transitions (500ms) */
  SLOW: parseInt(tokens.animation.duration['500']),
  /** Extra slow for complex animations (1000ms) */
  EXTRA_SLOW: parseInt(tokens.animation.duration['1000']),
} as const;

/**
 * Z-Index Layers (matches Design System)
 */
export const Z_INDEX = {
  /** Base layer - normal document flow */
  BASE: 0,
  /** Dropdown menus, tooltips, popovers */
  DROPDOWN: 10,
  /** Sticky positioned elements */
  STICKY: 20,
  /** Fixed UI elements */
  FIXED: 30,
  /** Overlays, modal backdrops */
  OVERLAY: 40,
  /** Modals, navigation headers */
  MODAL: 50,
  /** Notifications, toasts (reserved) */
  NOTIFICATION: 60,
} as const;

/**
 * Spacing Scale (Tailwind units)
 */
export const SPACING = {
  /** Extra small (4px) */
  XS: 1,
  /** Small (8px) */
  SM: 2,
  /** Medium (12px) */
  MD: 3,
  /** Default (16px) */
  DEFAULT: 4,
  /** Large (24px) */
  LG: 6,
  /** Extra large (32px) */
  XL: 8,
  /** 2XL (48px) */
  '2XL': 12,
  /** 3XL (64px) */
  '3XL': 16,
} as const;

/**
 * Border Radius Scale (matches Design System)
 * Derived from tokens.radius
 */
export const BORDER_RADIUS = {
  /** Small radius (0.5rem / 8px) */
  SM: tokens.radius.sm,
  /** Medium radius (0.75rem / 12px) */
  MD: tokens.radius.md,
  /** Large radius (1rem / 16px) */
  LG: tokens.radius.lg,
  /** Extra large radius (1.25rem / 20px) */
  XL: tokens.radius.xl,
  /** 2XL radius (1.5rem / 24px) */
  '2XL': tokens.radius['2xl'],
  /** Full circle (9999px) */
  FULL: tokens.radius.full,
} as const;

/**
 * Typography Scale (text sizes)
 */
export const FONT_SIZE = {
  /** Extra small (12px) */
  XS: 'text-xs',
  /** Small (14px) */
  SM: 'text-sm',
  /** Base (16px) */
  BASE: 'text-base',
  /** Large (18px) */
  LG: 'text-lg',
  /** Extra large (20px) */
  XL: 'text-xl',
  /** 2XL (24px) */
  '2XL': 'text-2xl',
  /** 3XL (30px) */
  '3XL': 'text-3xl',
  /** 4XL (36px) */
  '4XL': 'text-4xl',
  /** 5XL (48px) */
  '5XL': 'text-5xl',
} as const;

/**
 * Form Constants
 */
export const FORM = {
  /** Default input height (36px - h-9) */
  INPUT_HEIGHT: 9,
  /** Small input height (32px - h-8) */
  INPUT_HEIGHT_SM: 8,
  /** Large input height (40px - h-10) */
  INPUT_HEIGHT_LG: 10,
  /** Maximum file upload size (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  /** Maximum text input length */
  MAX_TEXT_LENGTH: 255,
  /** Maximum textarea length */
  MAX_TEXTAREA_LENGTH: 2000,
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 12,
} as const;

/**
 * API Constants
 */
export const API = {
  /** Default request timeout (30 seconds) */
  TIMEOUT: 30000,
  /** Retry attempts for failed requests */
  RETRY_ATTEMPTS: 3,
  /** Delay between retries (milliseconds) */
  RETRY_DELAY: 1000,
  /** Maximum items per page for pagination */
  DEFAULT_PAGE_SIZE: 20,
} as const;

/**
 * Debounce/Throttle Delays (milliseconds)
 */
export const DELAYS = {
  /** Search input debounce */
  SEARCH: 300,
  /** Resize event throttle */
  RESIZE: 150,
  /** Scroll event throttle */
  SCROLL: 100,
  /** Auto-save debounce */
  AUTO_SAVE: 2000,
} as const;

/**
 * Performance Thresholds
 */
export const PERFORMANCE = {
  /** Large list threshold - consider virtualization */
  LARGE_LIST_THRESHOLD: 100,
  /** Bundle size warning threshold (KB) */
  BUNDLE_SIZE_WARNING: 500,
  /** Time to Interactive target (milliseconds) */
  TTI_TARGET: 3000,
  /** First Contentful Paint target (milliseconds) */
  FCP_TARGET: 1500,
} as const;

/**
 * Component-Specific Constants
 */
export const COMPONENTS = {
  /** Toast notification duration (milliseconds) */
  TOAST_DURATION: 5000,
  /** Modal animation duration (milliseconds) */
  MODAL_ANIMATION: 300,
  /** Tooltip show delay (milliseconds) */
  TOOLTIP_DELAY: 500,
  /** Sidebar width (pixels) */
  SIDEBAR_WIDTH: 256,
  /** Mobile sidebar width (pixels) */
  SIDEBAR_WIDTH_MOBILE: 256,
  /** Header height (pixels) */
  HEADER_HEIGHT: 64,
} as const;

/**
 * Color Contrast Ratios (WCAG)
 */
export const CONTRAST_RATIO = {
  /** WCAG AA minimum for normal text */
  AA_NORMAL: 4.5,
  /** WCAG AA minimum for large text */
  AA_LARGE: 3,
  /** WCAG AAA minimum for normal text */
  AAA_NORMAL: 7,
  /** WCAG AAA minimum for large text */
  AAA_LARGE: 4.5,
  /** UI component contrast minimum */
  UI_MINIMUM: 3,
} as const;

/**
 * Icon Sizes
 */
export const ICON_SIZE = {
  /** Extra small (12px) - h-3 w-3 */
  XS: 3,
  /** Small (16px) - h-4 w-4 */
  SM: 4,
  /** Medium (20px) - h-5 w-5 */
  MD: 5,
  /** Large (24px) - h-6 w-6 */
  LG: 6,
  /** Extra large (32px) - h-8 w-8 */
  XL: 8,
  /** 2XL (40px) - h-10 w-10 */
  '2XL': 10,
} as const;

/**
 * Gradient Opacity Levels (for icon backgrounds)
 */
export const GRADIENT_OPACITY = {
  /** Light backgrounds */
  LIGHT: 10,
  /** Strong emphasis */
  STRONG: 30,
} as const;

/**
 * Regular Expression Patterns
 */
export const REGEX = {
  /** Email validation */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Phone number (US format) */
  PHONE_US: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
  /** URL validation */
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  /** Password strength (min 12 chars, uppercase, lowercase, number, special) */
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/,
  /** Alphanumeric only */
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  /** Hex color */
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

/**
 * HTTP Status Codes (commonly used)
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  /** Theme preference */
  THEME: 'theme',
  /** Auth token */
  TOKEN: 'auth_token',
  /** User preferences */
  USER_PREFS: 'user_preferences',
  /** Onboarding completed */
  ONBOARDING_COMPLETE: 'onboarding_complete',
  /** Last visited page */
  LAST_PAGE: 'last_page',
} as const;

/**
 * Type exports for TypeScript
 */
export type TouchTarget = typeof TOUCH_TARGET;
export type Breakpoints = typeof BREAKPOINTS;
export type AnimationDuration = typeof ANIMATION_DURATION;
export type ZIndex = typeof Z_INDEX;
export type Spacing = typeof SPACING;
export type BorderRadius = typeof BORDER_RADIUS;
export type FontSize = typeof FONT_SIZE;
export type FormConstants = typeof FORM;
export type ApiConstants = typeof API;
export type Delays = typeof DELAYS;
export type Performance = typeof PERFORMANCE;
export type ComponentConstants = typeof COMPONENTS;
export type ContrastRatio = typeof CONTRAST_RATIO;
export type IconSize = typeof ICON_SIZE;
export type GradientOpacity = typeof GRADIENT_OPACITY;
export type Regex = typeof REGEX;
export type HttpStatus = typeof HTTP_STATUS;
export type StorageKeys = typeof STORAGE_KEYS;
