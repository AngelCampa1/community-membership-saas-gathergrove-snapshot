/**
 * Accessibility Utilities for GatherGrove Mobile
 * 
 * Provides utilities for WCAG AA compliance, focus management, and accessibility enhancements
 */

import { Dimensions, AccessibilityRole } from 'react-native';
import { ACCESSIBILITY_COLORS, BORDER_RADIUS, BREAKPOINTS, SPECIAL_COLORS } from '../constants/colors';

// Screen dimensions for responsive design - with safe fallback for testing
const getDimensions = () => {
  try {
    return Dimensions?.get ? Dimensions.get('window') : { width: 375, height: 812 };
  } catch (error) {
    return { width: 375, height: 812 };
  }
};

const { width: screenWidth, height: screenHeight } = getDimensions();

/**
 * Touch Target Utilities
 */
export const getTouchTargetStyle = (size?: number) => {
  const targetSize = size || ACCESSIBILITY_COLORS.touchTarget.recommended;
  return {
    minWidth: targetSize,
    minHeight: targetSize,
    paddingHorizontal: Math.max(0, (targetSize - 24) / 2), // Ensure icon/text has space
    paddingVertical: Math.max(0, (targetSize - 24) / 2),
  };
};

/**
 * Focus Indicator Utilities
 */
export const getFocusStyle = (color?: string, width?: number, offset?: number) => ({
  borderWidth: width || 2,
  borderColor: color || ACCESSIBILITY_COLORS.focusIndicator.primary,
  borderRadius: BORDER_RADIUS.md,
  shadowColor: color || ACCESSIBILITY_COLORS.focusIndicator.primary,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.3,
  shadowRadius: offset || 2,
  elevation: 2,
});

/**
 * High Contrast Text Utilities
 */
export const getHighContrastStyle = (theme: 'light' | 'dark' = 'light') => ({
  color: theme === 'dark'
    ? ACCESSIBILITY_COLORS.highContrast.highContrastPrimary
    : ACCESSIBILITY_COLORS.highContrast.primary,
  textShadowColor: theme === 'dark'
    ? ACCESSIBILITY_COLORS.highContrast.secondary
    : SPECIAL_COLORS.textShadow.light,
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 1,
});

/**
 * Responsive Design Utilities
 */
export const getResponsiveStyle = () => {
  const isSmallScreen = screenWidth < BREAKPOINTS.sm;
  const isMediumScreen = screenWidth >= BREAKPOINTS.sm && screenWidth < BREAKPOINTS.lg;
  const isLargeScreen = screenWidth >= BREAKPOINTS.lg;
  
  return {
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    screenWidth,
    screenHeight,
    
    // Responsive padding
    containerPadding: isSmallScreen ? 16 : isMediumScreen ? 24 : 32,
    
    // Responsive text sizes
    textSize: {
      xs: isSmallScreen ? 10 : 12,
      sm: isSmallScreen ? 12 : 14,
      base: isSmallScreen ? 14 : 16,
      lg: isSmallScreen ? 16 : 18,
      xl: isSmallScreen ? 18 : 20,
      '2xl': isSmallScreen ? 20 : 24,
      '3xl': isSmallScreen ? 24 : 32,
    },
    
    // Responsive spacing
    spacing: {
      xs: isSmallScreen ? 4 : 6,
      sm: isSmallScreen ? 8 : 12,
      md: isSmallScreen ? 12 : 16,
      lg: isSmallScreen ? 16 : 24,
      xl: isSmallScreen ? 24 : 32,
    },
  };
};

/**
 * Card Layout Utilities for Responsive Grid
 */
export const getCardLayoutStyle = (itemsPerRow: number = 2) => {
  const responsive = getResponsiveStyle();
  const padding = responsive.containerPadding;
  const gap = responsive.spacing.md;
  
  // Calculate card width accounting for padding and gaps
  const availableWidth = screenWidth - (padding * 2);
  const totalGaps = (itemsPerRow - 1) * gap;
  const cardWidth = (availableWidth - totalGaps) / itemsPerRow;
  
  return {
    cardWidth: Math.floor(cardWidth),
    cardStyle: {
      width: Math.floor(cardWidth),
      marginBottom: gap,
      marginRight: gap,
    },
    containerStyle: {
      paddingHorizontal: padding,
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
    },
  };
};

/**
 * Accessibility Announcements
 */
export const createAccessibilityLabel = (
  text: string,
  hint?: string,
  role?: AccessibilityRole
) => ({
  accessible: true,
  accessibilityLabel: text,
  accessibilityHint: hint,
  accessibilityRole: role,
});

/**
 * Color Contrast Utilities
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  // Simple contrast calculation - in production would use a proper library
  const getLuminance = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const [sR, sG, sB] = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    
    return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Enhanced Shadow for Glassmorphism
 * Note: Uses default opacity values from SPECIAL_COLORS.glassmorphism for base styling.
 * Custom opacity parameter allows for variations while maintaining design consistency.
 */
export const getGlassmorphismStyle = (opacity: number = 0.1) => ({
  // For custom opacity, we compute the rgba; for default, use design system
  backgroundColor: opacity === 0.1
    ? SPECIAL_COLORS.glassmorphism.lightBackground
    : `rgba(255, 255, 255, ${opacity})`,
  borderWidth: 1,
  borderColor: opacity === 0.1
    ? SPECIAL_COLORS.glassmorphism.lightBorder
    : `rgba(255, 255, 255, ${opacity * 2})`,
  backdropFilter: 'blur(10px)', // Note: Limited support in React Native
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 8,
});

/**
 * Animation Performance Utilities
 */
export const getOptimizedAnimationStyle = () => ({
  // Use transform properties for better performance
  shouldRasterizeIOS: true,
  renderToHardwareTextureAndroid: true,
});

/**
 * Screen Reader Utilities
 */
export const getScreenReaderStyle = (isVisible: boolean = true) => ({
  accessible: isVisible,
  accessibilityElementsHidden: !isVisible,
  importantForAccessibility: isVisible ? 'yes' as const : 'no-hide-descendants' as const,
});
