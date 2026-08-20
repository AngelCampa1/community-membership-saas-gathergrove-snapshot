/**
 * Unified engagement timing configuration
 * Prevents conflicts between different engagement triggers
 */

export const ENGAGEMENT_TIMING = {
  // Progressive engagement escalation
  exitIntent: {
    delay: 30000, // 30 seconds - first engagement
    sessionKey: 'gathergrove-exit-intent-shown'
  },
  floatingButton: {
    showAfterScroll: 50, // 50% scroll
    showAfterTime: 45000, // 45 seconds - tighter window to catch bouncing visitors
    position: 'bottom-right'
  },
  smartBanner: {
    scrollThreshold: 75, // 75% scroll
    timeThreshold: 90000, // 90 seconds - final escalation for engaged visitors
    engagementThreshold: 15, // interaction count
    sessionKey: 'gathergrove-smart-cta-dismissed'
  }
} as const;

export const SESSION_STORAGE_KEYS = {
  exitIntentShown: 'gathergrove-exit-intent-shown',
  smartCtaDismissed: 'gathergrove-smart-cta-dismissed',
  lastVisit: 'gathergrove-last-visit',
  progressiveEngagement: 'gathergrove-progressive-engagement'
} as const;

export type EngagementStage = 'initial' | 'scroll-engaged' | 'time-engaged' | 'highly-engaged' | 'conversion-ready';