/**
 * GatherGrove Chart Color Palette
 *
 * Centralized color definitions for all chart and analytics components.
 * These colors are derived from the design system and should be used
 * instead of hardcoded hex values in chart configurations.
 */

// Primary chart palette - 8 distinct colors for data visualization
export const CHART_COLORS = {
  primary:'hsl(var(--primary))',      // #4a9a72 - Primary green
  blue:'#3b82f6',                      // Blue
  amber:'#f59e0b',                     // Amber/Warning
  red:'#ef4444',                       // Red/Error
  purple:'#8b5cf6',                    // Purple
  cyan:'#06b6d4',                      // Cyan
  pink:'#ec4899',                      // Pink
  teal:'#14b8a6',                      // Teal
} as const;

// Ordered array for cycling through colors in charts
export const CHART_COLOR_ARRAY = [
  '#4a9a72', // Primary green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#14b8a6', // Teal
] as const;

// Extended palette for charts needing more colors
export const CHART_COLOR_EXTENDED = [
  '#4a9a72', // Primary green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#a855f7', // Violet
] as const;

// Semantic colors for positive/negative indicators
export const CHART_SEMANTIC = {
  positive:'#16a149',  // Success green
  negative:'#ef4444',  // Error red
  neutral:'#6b7d75',   // Neutral gray
  warning:'#f59e0b',   // Warning amber
  info:'#3b82f6',      // Info blue
} as const;

// Gradient pairs for area charts
export const CHART_GRADIENTS = {
  primary: ['#4a9a72','#3d8060'],
  blue: ['#3b82f6','#2563eb'],
  amber: ['#f59e0b','#d97706'],
  red: ['#ef4444','#dc2626'],
  purple: ['#8b5cf6','#7c3aed'],
  success: ['#16a149','#15803d'],
} as const;

// Opacity variants for backgrounds
export const CHART_BACKGROUNDS = {
  primary:'rgba(74, 154, 114, 0.1)',
  blue:'rgba(59, 130, 246, 0.1)',
  amber:'rgba(245, 158, 11, 0.1)',
  red:'rgba(239, 68, 68, 0.1)',
  purple:'rgba(139, 92, 246, 0.1)',
  success:'rgba(22, 161, 73, 0.1)',
} as const;

// Rating colors (1-5 stars)
export const RATING_COLORS = {
  1:'#ef4444', // Red - Poor
  2:'#f97316', // Orange - Below Average
  3:'#f59e0b', // Amber - Average
  4:'#84cc16', // Lime - Good
  5:'#16a149', // Green - Excellent
} as const;

// Cohort/Heatmap color scales
export const HEATMAP_SCALE = {
  0:'#f8faf9',   // Lightest
  10:'#e3ece8',
  20:'#c8d6d0',
  30:'#a8d5ba',
  40:'#86c9a3',
  50:'#64bd8c',
  60:'#4a9a72',
  70:'#3d8060',
  80:'#33664d',
  90:'#2b5240',
  100:'#1a3a2d', // Darkest
} as const;

// Cohort analysis color palettes (8 shades from light to dark)
export const COHORT_PALETTES = {
  blue: ['#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8'],
  green: ['#f0fdf4','#dcfce7','#bbf7d0','#86efac','#4ade80','#22c55e','#16a34a','#15803d'],
  purple: ['#faf5ff','#f3e8ff','#e9d5ff','#d8b4fe','#c084fc','#a855f7','#9333ea','#7c3aed'],
  primary: ['#f0f9f4','#daf1e3','#b8e3ca','#8acfaa','#5bb586','#4a9a72','#3d8060','#33664d'],
} as const;

// Default fallback colors for cohort charts
export const COHORT_FALLBACK_COLORS = ['#e3ece8','#94a89f','#6b7d75','#4a5a52','#354540'] as const;

// Status badge colors
export const STATUS_COLORS = {
  active:'#16a149',
  pending:'#f59e0b',
  inactive:'#6b7d75',
  error:'#ef4444',
  success:'#16a149',
  warning:'#f59e0b',
  info:'#3b82f6',
} as const;

// Helper function to get color by index (cycles through palette)
export function getChartColor(index: number): string {
  return CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length];
}

// Helper function to get multiple colors
export function getChartColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => getChartColor(i));
}

// Helper to get color with opacity
export function withOpacity(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // Handle rgb colors
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(','rgba(').replace(')', `, ${opacity})`);
  }
  return color;
}

// Chart.js compatible dataset colors
export function getDatasetColors(index: number) {
  const color = getChartColor(index);
  return {
    borderColor: color,
    backgroundColor: withOpacity(color, 0.1),
    pointBackgroundColor: color,
    pointBorderColor:'#ffffff',
  };
}

// Recharts compatible color array
export const RECHARTS_COLORS = CHART_COLOR_ARRAY;

// =============================================================================
// GLASSMORPHISM - Transparency values for frosted glass UI effects
// =============================================================================
export const GLASSMORPHISM = {
  // Light mode backgrounds
  light: {
    background:'rgba(255, 255, 255, 0.9)',
    backgroundSubtle:'rgba(255, 255, 255, 0.7)',
    backgroundStrong:'rgba(255, 255, 255, 0.95)',
    border:'rgba(0, 0, 0, 0.06)',
    shadow:'0 8px 32px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
    shadowInset:'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    insetBorder:'rgba(255, 255, 255, 0.6)',
  },
  // Light-Only Mode backgrounds
// Generic overlay
  overlay:'rgba(255, 255, 255, 0.1)',
} as const;

// Border color variants (20% opacity versions of semantic colors)
export const CHART_BORDERS = {
  primary:'rgba(74, 154, 114, 0.2)',
  blue:'rgba(59, 130, 246, 0.2)',
  amber:'rgba(245, 158, 11, 0.2)',
  red:'rgba(239, 68, 68, 0.2)',
  purple:'rgba(139, 92, 246, 0.2)',
  success:'rgba(22, 161, 73, 0.2)',
} as const;

// Text colors for use on colored backgrounds
export const TEXT_ON_COLOR = {
  light:'#ffffff',
  inverse:'#000000',
} as const;
