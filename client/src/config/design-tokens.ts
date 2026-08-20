/**
 * Design Token System — Re-export Layer
 *
 * This file re-exports tokens from the generated source of truth.
 * To update tokens: edit shared/design-tokens/*.json and run `npm run tokens:build`
 * from the repository root.
 *
 * DO NOT add hand-maintained values here — put them in the JSON source files.
 */

import { tokens } from '../generated/tokens';

// ── Color tokens ────────────────────────────────────────────────────────────

/** Brand, semantic, neutral colors as HSL triplets for CSS var usage */
export const colorTokens = {
  primary:  tokens.color.brand.primary,
  semantic: tokens.color.semantic,
  neutral:  tokens.color.neutral,
} as const;

// ── Spacing tokens ───────────────────────────────────────────────────────────

export const spacingTokens = tokens.spacing;

// ── Typography tokens ────────────────────────────────────────────────────────

export const typographyTokens = tokens.typography;

// ── Border radius tokens ─────────────────────────────────────────────────────

export const radiusTokens = tokens.radius;

// ── Shadow tokens ────────────────────────────────────────────────────────────

export const shadowTokens = tokens.shadow;

// ── Breakpoint tokens ────────────────────────────────────────────────────────

export const breakpointTokens = tokens.breakpoint;

// ── Animation tokens ─────────────────────────────────────────────────────────

export const animationTokens = tokens.animation;

// ── Z-index tokens ───────────────────────────────────────────────────────────

export const zIndexTokens = tokens.zIndex;

// ── Unified design tokens object ─────────────────────────────────────────────

export const designTokens = {
  colors:     colorTokens,
  spacing:    spacingTokens,
  typography: typographyTokens,
  radius:     radiusTokens,
  shadows:    shadowTokens,
  breakpoints: breakpointTokens,
  animations: animationTokens,
  zIndex:     zIndexTokens,
} as const;

// ── Type exports ─────────────────────────────────────────────────────────────

export type { Tokens, ColorTokens, SpacingTokens } from '../generated/tokens';
export type ColorToken      = typeof colorTokens;
export type SpacingToken    = typeof spacingTokens;
export type RadiusToken     = typeof radiusTokens;
export type ShadowToken     = typeof shadowTokens;
export type BreakpointToken = typeof breakpointTokens;
export type AnimationToken  = typeof animationTokens;
export type ZIndexToken     = typeof zIndexTokens;
export type DesignTokens    = typeof designTokens;
