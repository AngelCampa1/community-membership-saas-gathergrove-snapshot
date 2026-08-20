/**
 * Standardized Call-to-Action messaging
 * Ensures consistent messaging across all landing page components
 */

export const CTA_MESSAGES = {
  // Primary CTA for hero and main sections
  primary: "Start Free Trial",

  // Secondary CTA for less prominent buttons
  secondary: "Start Free Trial",

  // Specific context CTAs
  pricing: "Start Free Trial",
  roi: "See My Savings",
  demo: "Start Free Trial",

  // Supporting text
  supportingText: {
    creditCard: "Credit card required. Cancel anytime.",
    trialDuration: "30-day free trial on all paid plans",
    cancel: "Cancel anytime"
  }
} as const;

export const CTA_DESCRIPTIONS = {
  hero: "Built for clubs and communities like yours",
  pricing: "Start your 30-day free trial on Grow or Expand",
  roi: "See how much time and money you can save",
  demo: "Get started in under 5 minutes"
} as const;
