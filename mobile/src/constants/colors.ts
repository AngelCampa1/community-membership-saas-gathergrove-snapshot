/**
 * GatherGrove Mobile Color Palette
 *
 * Unified color system matching the web app exactly.
 * Base palettes are imported from the generated token system.
 * To update base colors: edit shared/design-tokens/colors.json and run
 * `npm run tokens:build` from the repo root.
 *
 * Web CSS Variables Reference (globals.css):
 * - Light primary: HSL(150, 35%, 45%) = #4a9a72
 * - Dark primary: HSL(150, 45%, 65%) = #7dcda5
 * - Success: HSL(142, 76%, 36%) = #16a149
 * - Warning: HSL(38, 92%, 50%) = #f59e0b
 * - Destructive: HSL(0, 84%, 60%) = #ef4444
 */

import { tokens } from'../generated/tokens';

// =============================================================================
// BRAND COLORS - Primary palette (from generated tokens)
// =============================================================================
export const BRAND_COLORS = {
  primary:   tokens.colors.PRIMARY_COLORS,
  secondary: tokens.colors.SECONDARY_COLORS,
  accent:    tokens.colors.ACCENT_COLORS,
} as const;

// =============================================================================
// NEUTRAL COLORS - Gray scale with green tint (from generated tokens)
// =============================================================================
export const NEUTRAL_COLORS = tokens.colors.NEUTRAL_COLORS;

// =============================================================================
// SEMANTIC COLORS - Status indicators (from generated tokens)
// =============================================================================
export const SEMANTIC_COLORS = tokens.colors.SEMANTIC_COLORS;

// =============================================================================
// LIGHT THEME - Matches web :root CSS variables
// =============================================================================
export const LIGHT_THEME = {
  background: {
    primary:'#ffffff',        // --background: 0 0% 100%
    secondary:'#f8faf9',      // --background-subtle: 150 20% 98%
    tertiary:'#eff4f2',       // --secondary: 150 20% 95%
    overlay:'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary:'#181a1f',        // --foreground: 220 14% 11%
    secondary:'#4a5a52',      // Neutral 600
    tertiary:'#6b7d75',       // --muted-foreground: 150 10% 46%
    inverse:'#ffffff',
    link:'#3d8060',           // Primary 600
  },
  border: {
    primary:'#e3ece8',        // --border: 150 20% 91%
    secondary:'#c8d6d0',      // --input-border: 150 20% 87%
    focus:'#4a9a72',          // --ring: 150 35% 45%
  },
  interactive: {
    primary:'#4a9a72',        // --primary: 150 35% 45%
    primaryHover:'#3d8060',   // --primary-hover: 150 40% 40%
    primaryPressed:'#33664d',
    secondary:'#eff4f2',      // --secondary: 150 20% 95%
    secondaryHover:'#e3ece8', // --secondary-hover: 150 25% 90%
    secondaryPressed:'#c8d6d0',
    accent:'#22c55e',
    accentHover:'#16a34a',
    disabled:'#c8d6d0',
    disabledText:'#94a89f',
  },
  status: {
    success:'#16a149',
    successBackground:'#f0fdf4',
    successBorder:'#bbf7d0',
    warning:'#f59e0b',
    warningBackground:'#fffbeb',
    warningBorder:'#fde68a',
    error:'#ef4444',
    errorBackground:'#fef2f2',
    errorBorder:'#fecaca',
    info:'#3b82f6',
    infoBackground:'#eff6ff',
    infoBorder:'#bfdbfe',
  },
  shadow: {
    none: {
      shadowColor:'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor:'#19241e',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor:'#19241e',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor:'#19241e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor:'#19241e',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8,
    },
    xl: {
      shadowColor:'#19241e',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 12,
    },
    // Legacy aliases
    small: {
      shadowColor:'#19241e',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor:'#19241e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor:'#19241e',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8,
    },
  },
  focus: {
    primary:'#4a9a72',
    width: 2,
    offset: 2,
  },
} as const;

// =============================================================================
// CHAT COLORS - Messaging UI
// =============================================================================
export const CHAT_COLORS = {
  light: {
    ownMessage: BRAND_COLORS.primary[500],
    ownMessageText:'#ffffff',
    ownTimestamp: BRAND_COLORS.primary[100],
    otherMessage:'#ffffff',
    otherMessageText: NEUTRAL_COLORS[900],
    otherTimestamp: NEUTRAL_COLORS[500],
    senderName: BRAND_COLORS.primary[600],
    inputBackground:'#ffffff',
    inputBorder: NEUTRAL_COLORS[300],
    inputText: NEUTRAL_COLORS[900],
    placeholder: NEUTRAL_COLORS[500],
    sendButton: BRAND_COLORS.primary[500],
    sendButtonDisabled: NEUTRAL_COLORS[400],
  },
} as const;

// =============================================================================
// CHART COLORS - Data visualization (matching web chartColors.ts)
// =============================================================================
export const CHART_COLORS = {
  palette: ['#4a9a72', // Primary green'#3b82f6', // Blue'#f59e0b', // Amber'#ef4444', // Red'#8b5cf6', // Purple'#06b6d4', // Cyan'#ec4899', // Pink'#14b8a6', // Teal
  ],
  semantic: {
    positive:'#16a149',
    negative:'#ef4444',
    neutral:'#6b7d75',
    warning:'#f59e0b',
    info:'#3b82f6',
  },
  ratings: {
    1:'#ef4444',
    2:'#f97316',
    3:'#f59e0b',
    4:'#84cc16',
    5:'#16a149',
  },
} as const;

// =============================================================================
// SPECIAL COLORS - External brands, ratings, etc.
// =============================================================================
export const SPECIAL_COLORS = {
  star:'#fbbf24',           // Rating stars
  socialAuth: {
    google:'#4285F4',
    googleText:'#757575',
    apple:'#000000',
    appleText:'#ffffff',
    microsoft:'#00a4ef',
  },
  scanner: {
    overlay:'rgba(0, 0, 0, 0.8)',
    frame:'#ffffff',
    success:'#16a149',
  },
  qrCode: {
    foreground:'#000000',  // High contrast for optimal scanning
    background:'#ffffff',  // White background for QR readability
  },
  glassmorphism: {
    lightBackground:'rgba(255, 255, 255, 0.1)',
    lightBorder:'rgba(255, 255, 255, 0.2)',
    darkBackground:'rgba(0, 0, 0, 0.1)',
    darkBorder:'rgba(0, 0, 0, 0.2)',
  },
  textShadow: {
    light:'rgba(255, 255, 255, 0.8)',
  },
} as const;

// =============================================================================
// GRADIENTS - For modern UI elements
// =============================================================================
export const GRADIENTS = {
  primary: ['#4a9a72','#3d8060'],
  success: ['#16a149','#15803d'],
  warning: ['#f59e0b','#d97706'],
  error: ['#ef4444','#dc2626'],
  info: ['#3b82f6','#2563eb'],
  forest: ['#33664d','#2b5240'],
} as const;

// =============================================================================
// BREAKPOINTS - Screen size breakpoints for responsive design (from generated tokens)
// =============================================================================
export const BREAKPOINTS = tokens.breakpoints;

// =============================================================================
// ACCESSIBILITY COLORS - For high contrast and accessibility features
// Used by accessibility.ts for WCAG AA compliance
// =============================================================================
export const ACCESSIBILITY_COLORS = {
  focusIndicator: {
    primary:'#4a9a72',
    secondary:'#8b5cf6',
    error:'#ef4444',
    success:'#16a149',
  },
  touchTarget: {
    minimum: 44,
    recommended: 48,
    optimal: 52,
  },
  highContrast: {
    primary:'#000000',
    secondary:'#374151',
    onPrimary:'#ffffff',
    onError:'#ffffff',
    highContrastPrimary:'#ffffff',
    highContrastSecondary:'#e2e8f0',
  },
} as const;

// =============================================================================
// ACCESSIBILITY - WCAG AA compliance
// =============================================================================
export const ACCESSIBILITY = {
  focusIndicator: {
    primary:'#4a9a72',
    secondary:'#8b5cf6',
    error:'#ef4444',
    success:'#16a149',
  },
  touchTarget: {
    minimum: 44,
    recommended: 48,
    optimal: 52,
  },
  highContrast: {
    primary:'#000000',
    secondary:'#374151',
    onPrimary:'#ffffff',
    onError:'#ffffff',
    highContrastPrimary:'#ffffff',
    highContrastSecondary:'#e2e8f0',
  },
} as const;

// =============================================================================
// BORDER RADIUS - Consistent with web (from generated tokens)
// =============================================================================
export const BORDER_RADIUS = tokens.radius;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export type ThemeColors = typeof LIGHT_THEME;
export type BrandColors = typeof BRAND_COLORS;
export type SemanticColors = typeof SEMANTIC_COLORS;
export type ChatColors = typeof CHAT_COLORS;

/**
 * Get theme colors for the light display preference
 */
export const getThemeColors = (_isLightOnly: boolean = false): ThemeColors => {
  return LIGHT_THEME;
};

/**
 * Get chat colors for the light theme
 */
export const getChatColors = (_isLightOnly: boolean = false) => {
  return CHAT_COLORS.light;
};

/**
 * Get chart color by index (cycles through palette)
 */
export const getChartColor = (index: number): string => {
  return CHART_COLORS.palette[index % CHART_COLORS.palette.length];
};

/**
 * Get multiple chart colors
 */
export const getChartColors = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => getChartColor(i));
};

/**
 * Apply opacity to a hex color
 */
export const withOpacity = (hexColor: string, opacity: number): string => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Default export for convenience
export const CURRENT_THEME = LIGHT_THEME;
