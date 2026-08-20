/**
 * @deprecated Use `useAnalytics` from '@/hooks/useAnalytics' instead.
 * This hook is kept for backward compatibility and re-exports from the unified
 * analytics layer that dispatches to both GA4 and PostHog.
 */
export { useAnalytics as useGoogleAnalytics, CONVERSION_FUNNEL_STEPS } from '@/hooks/useAnalytics';
