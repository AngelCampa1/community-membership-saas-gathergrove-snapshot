/**
 * Constants Index
 *
 * Centralized export for all application constants.
 * Import from this file to access any constant throughout the application.
 *
 * @example
 * ```ts
 * import { TOUCH_TARGET, Z_INDEX, BREAKPOINTS, DEBOUNCE_MS } from '@/constants';
 *
 * // Usage
 * const minSize = TOUCH_TARGET.MIN_SIZE; // 44
 * const modalZIndex = Z_INDEX.MODAL; // 50
 * const tabletBreakpoint = BREAKPOINTS.MD; // 768
 * const searchDebounce = DEBOUNCE_MS.SEARCH; // 300
 * ```
 */

// Export all UI constants
export * from './ui';

// Export timing constants
export * from './timing';

// Export dues frequency constants
export * from './duesFrequency';

// Re-export commonly used constants for convenience
export {
  // UI Constants
  TOUCH_TARGET,
  BREAKPOINTS,
  Z_INDEX,
  ANIMATION_DURATION,
  SPACING,
  FONT_SIZE,
  FORM,
  API,
  DELAYS,
  REGEX,
  HTTP_STATUS,
  STORAGE_KEYS,
  ICON_SIZE,
  GRADIENT_OPACITY,
} from './ui';

export {
  // Timing Constants
  DEBOUNCE_MS,
  SCROLL,
  EXIT_INTENT,
  PWA,
  ANIMATION,
  NOTIFICATION,
  SESSION,
  POLLING,
  SIGNALR,
  ENGAGEMENT,
  PERFORMANCE,
} from './timing';

export {
  // Dues Frequency
  DUES_FREQUENCY_OPTIONS,
  getDuesFrequencyOption,
  getDuesFrequencyLabel,
  type DuesFrequency,
  type DuesFrequencyOption,
} from './duesFrequency';
