/**
 * Touch-safe interaction utilities
 * Provides proper hover states that work on both touch and non-touch devices
 */

export const touchSafeHover = {
  // For buttons and interactive elements
  button: 'hover:bg-opacity-90 active:bg-opacity-80 transition-all duration-200 @media (hover: hover) { hover:bg-opacity-90 }',
  
  // For links
  link: 'hover:text-primary active:text-primary/80 transition-colors duration-200 @media (hover: hover) { hover:text-primary }',
  
  // For cards and containers
  card: 'hover:shadow-lg active:shadow-md transition-shadow duration-200 @media (hover: hover) { hover:shadow-lg }',
  
  // For scale effects
  scale: 'hover:scale-105 active:scale-95 transition-transform duration-200 @media (hover: hover) { hover:scale-105 }'
};

/**
 * CSS-in-JS helper for touch-safe hover states
 */
export const touchSafeStyles = {
  button: {
    transition: 'all 0.2s ease',
    '&:active': {
      opacity: 0.8,
      transform: 'scale(0.98)'
    },
    '@media (hover: hover)': {
      '&:hover': {
        opacity: 0.9
      }
    }
  },
  
  link: {
    transition: 'color 0.2s ease',
    '&:active': {
      opacity: 0.8
    },
    '@media (hover: hover)': {
      '&:hover': {
        color: 'var(--primary)'
      }
    }
  }
};

/**
 * Helper function to combine touch-safe classes with existing classes
 */
export function withTouchSafe(baseClasses: string, touchType: keyof typeof touchSafeHover): string {
  return `${baseClasses} ${touchSafeHover[touchType]}`;
}