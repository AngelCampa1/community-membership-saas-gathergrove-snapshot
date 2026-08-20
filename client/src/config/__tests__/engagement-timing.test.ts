/**
 * Tests for engagement-timing.ts - Unified engagement timing configuration
 * Validates progressive engagement escalation and session storage keys
 */

import { ENGAGEMENT_TIMING, SESSION_STORAGE_KEYS, type EngagementStage } from '../engagement-timing';

describe('ENGAGEMENT_TIMING', () => {
  describe('Exit intent configuration', () => {
    it('has exit intent delay', () => {
      expect(ENGAGEMENT_TIMING.exitIntent.delay).toBe(30000);
    });

    it('has exit intent session key', () => {
      expect(ENGAGEMENT_TIMING.exitIntent.sessionKey).toBe('gathergrove-exit-intent-shown');
    });

    it('exit intent delay is 30 seconds', () => {
      expect(ENGAGEMENT_TIMING.exitIntent.delay).toBe(30 * 1000);
    });

    it('exit intent session key follows naming convention', () => {
      expect(ENGAGEMENT_TIMING.exitIntent.sessionKey).toMatch(/^gathergrove-/);
    });

    it('exit intent is first engagement trigger', () => {
      const delays = [
        ENGAGEMENT_TIMING.exitIntent.delay,
        ENGAGEMENT_TIMING.floatingButton.showAfterTime,
        ENGAGEMENT_TIMING.smartBanner.timeThreshold,
      ];

      expect(ENGAGEMENT_TIMING.exitIntent.delay).toBe(Math.min(...delays));
    });
  });

  describe('Floating button configuration', () => {
    it('has showAfterScroll threshold', () => {
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterScroll).toBe(50);
    });

    it('has showAfterTime delay', () => {
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterTime).toBe(45000);
    });

    it('has position configuration', () => {
      expect(ENGAGEMENT_TIMING.floatingButton.position).toBe('bottom-right');
    });

    it('scroll threshold is percentage (0-100)', () => {
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterScroll).toBeGreaterThanOrEqual(0);
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterScroll).toBeLessThanOrEqual(100);
    });

    it('showAfterTime is 45 seconds', () => {
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterTime).toBe(45 * 1000);
    });

    it('appears after exit intent opportunity', () => {
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterTime).toBeGreaterThan(
        ENGAGEMENT_TIMING.exitIntent.delay
      );
    });

    it('position is valid CSS position', () => {
      const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
      expect(validPositions).toContain(ENGAGEMENT_TIMING.floatingButton.position);
    });
  });

  describe('Smart banner configuration', () => {
    it('has scrollThreshold', () => {
      expect(ENGAGEMENT_TIMING.smartBanner.scrollThreshold).toBe(75);
    });

    it('has timeThreshold', () => {
      expect(ENGAGEMENT_TIMING.smartBanner.timeThreshold).toBe(90000);
    });

    it('has engagementThreshold', () => {
      expect(ENGAGEMENT_TIMING.smartBanner.engagementThreshold).toBe(15);
    });

    it('has session key', () => {
      expect(ENGAGEMENT_TIMING.smartBanner.sessionKey).toBe('gathergrove-smart-cta-dismissed');
    });

    it('scroll threshold is higher than floating button', () => {
      expect(ENGAGEMENT_TIMING.smartBanner.scrollThreshold).toBeGreaterThan(
        ENGAGEMENT_TIMING.floatingButton.showAfterScroll
      );
    });

    it('time threshold is 90 seconds (1.5 minutes)', () => {
      expect(ENGAGEMENT_TIMING.smartBanner.timeThreshold).toBe(90 * 1000);
    });

    it('is final escalation trigger', () => {
      const delays = [
        ENGAGEMENT_TIMING.exitIntent.delay,
        ENGAGEMENT_TIMING.floatingButton.showAfterTime,
        ENGAGEMENT_TIMING.smartBanner.timeThreshold,
      ];

      expect(ENGAGEMENT_TIMING.smartBanner.timeThreshold).toBe(Math.max(...delays));
    });

    it('engagement threshold is interaction count', () => {
      expect(typeof ENGAGEMENT_TIMING.smartBanner.engagementThreshold).toBe('number');
      expect(ENGAGEMENT_TIMING.smartBanner.engagementThreshold).toBeGreaterThan(0);
    });
  });

  describe('Progressive engagement escalation', () => {
    it('follows time-based escalation pattern', () => {
      // Exit intent at 30s → Floating button at 45s → Smart banner at 90s
      expect(ENGAGEMENT_TIMING.exitIntent.delay).toBe(30000);
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterTime).toBe(45000);
      expect(ENGAGEMENT_TIMING.smartBanner.timeThreshold).toBe(90000);
    });

    it('follows scroll-based escalation pattern', () => {
      // Floating button at 50% → Smart banner at 75%
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterScroll).toBe(50);
      expect(ENGAGEMENT_TIMING.smartBanner.scrollThreshold).toBe(75);
    });

    it('has reasonable time gaps between triggers', () => {
      const gap1 = ENGAGEMENT_TIMING.floatingButton.showAfterTime - ENGAGEMENT_TIMING.exitIntent.delay;
      const gap2 = ENGAGEMENT_TIMING.smartBanner.timeThreshold - ENGAGEMENT_TIMING.floatingButton.showAfterTime;

      // Each gap should be at least 10 seconds
      expect(gap1).toBeGreaterThanOrEqual(10000);
      expect(gap2).toBeGreaterThanOrEqual(10000);
    });

    it('time thresholds are in milliseconds', () => {
      // All time values should be reasonably large (in ms, not seconds)
      expect(ENGAGEMENT_TIMING.exitIntent.delay).toBeGreaterThan(1000);
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterTime).toBeGreaterThan(1000);
      expect(ENGAGEMENT_TIMING.smartBanner.timeThreshold).toBeGreaterThan(1000);
    });

    it('scroll thresholds are percentages', () => {
      expect(ENGAGEMENT_TIMING.floatingButton.showAfterScroll).toBeLessThanOrEqual(100);
      expect(ENGAGEMENT_TIMING.smartBanner.scrollThreshold).toBeLessThanOrEqual(100);
    });
  });

  describe('Session keys consistency', () => {
    it('exit intent uses correct session key', () => {
      expect(ENGAGEMENT_TIMING.exitIntent.sessionKey).toBe(
        SESSION_STORAGE_KEYS.exitIntentShown
      );
    });

    it('smart banner uses correct session key', () => {
      expect(ENGAGEMENT_TIMING.smartBanner.sessionKey).toBe(
        SESSION_STORAGE_KEYS.smartCtaDismissed
      );
    });

    it('all session keys have gathergrove prefix', () => {
      expect(ENGAGEMENT_TIMING.exitIntent.sessionKey).toMatch(/^gathergrove-/);
      expect(ENGAGEMENT_TIMING.smartBanner.sessionKey).toMatch(/^gathergrove-/);
    });

    it('session keys are descriptive', () => {
      expect(ENGAGEMENT_TIMING.exitIntent.sessionKey).toContain('exit-intent');
      expect(ENGAGEMENT_TIMING.smartBanner.sessionKey).toContain('smart-cta');
    });
  });
});

describe('SESSION_STORAGE_KEYS', () => {
  describe('Key definitions', () => {
    it('has exitIntentShown key', () => {
      expect(SESSION_STORAGE_KEYS.exitIntentShown).toBe('gathergrove-exit-intent-shown');
    });

    it('has smartCtaDismissed key', () => {
      expect(SESSION_STORAGE_KEYS.smartCtaDismissed).toBe('gathergrove-smart-cta-dismissed');
    });

    it('has lastVisit key', () => {
      expect(SESSION_STORAGE_KEYS.lastVisit).toBe('gathergrove-last-visit');
    });

    it('has progressiveEngagement key', () => {
      expect(SESSION_STORAGE_KEYS.progressiveEngagement).toBe('gathergrove-progressive-engagement');
    });
  });

  describe('Naming conventions', () => {
    it('all keys use gathergrove prefix', () => {
      Object.values(SESSION_STORAGE_KEYS).forEach(key => {
        expect(key).toMatch(/^gathergrove-/);
      });
    });

    it('all keys use kebab-case', () => {
      Object.values(SESSION_STORAGE_KEYS).forEach(key => {
        // Should contain hyphens, not underscores or camelCase
        expect(key).toMatch(/^[a-z-]+$/);
        expect(key).not.toContain('_');
      });
    });

    it('keys are descriptive and unique', () => {
      const keys = Object.values(SESSION_STORAGE_KEYS);
      const uniqueKeys = new Set(keys);

      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('keys indicate their purpose', () => {
      expect(SESSION_STORAGE_KEYS.exitIntentShown).toContain('exit-intent');
      expect(SESSION_STORAGE_KEYS.smartCtaDismissed).toContain('cta');
      expect(SESSION_STORAGE_KEYS.lastVisit).toContain('visit');
      expect(SESSION_STORAGE_KEYS.progressiveEngagement).toContain('engagement');
    });
  });

  describe('Key usage alignment', () => {
    it('exitIntentShown matches ENGAGEMENT_TIMING.exitIntent.sessionKey', () => {
      expect(SESSION_STORAGE_KEYS.exitIntentShown).toBe(
        ENGAGEMENT_TIMING.exitIntent.sessionKey
      );
    });

    it('smartCtaDismissed matches ENGAGEMENT_TIMING.smartBanner.sessionKey', () => {
      expect(SESSION_STORAGE_KEYS.smartCtaDismissed).toBe(
        ENGAGEMENT_TIMING.smartBanner.sessionKey
      );
    });

    it('provides keys for all engagement features', () => {
      // Should have keys for tracking all engagement states
      expect(SESSION_STORAGE_KEYS.exitIntentShown).toBeDefined();
      expect(SESSION_STORAGE_KEYS.smartCtaDismissed).toBeDefined();
      expect(SESSION_STORAGE_KEYS.lastVisit).toBeDefined();
      expect(SESSION_STORAGE_KEYS.progressiveEngagement).toBeDefined();
    });
  });
});

describe('EngagementStage type', () => {
  it('type is exported', () => {
    // TypeScript compilation ensures this
    const stage: EngagementStage = 'initial';
    expect(stage).toBe('initial');
  });

  it('has all engagement stages', () => {
    const validStages: EngagementStage[] = [
      'initial',
      'scroll-engaged',
      'time-engaged',
      'highly-engaged',
      'conversion-ready',
    ];

    validStages.forEach(stage => {
      const test: EngagementStage = stage;
      expect(test).toBe(stage);
    });
  });

  it('stages follow progression order', () => {
    const stages: EngagementStage[] = [
      'initial',
      'scroll-engaged',
      'time-engaged',
      'highly-engaged',
      'conversion-ready',
    ];

    // Stages should be in order from least to most engaged
    expect(stages[0]).toBe('initial');
    expect(stages[stages.length - 1]).toBe('conversion-ready');
  });
});

describe('Configuration integration', () => {
  it('timing values support progressive engagement strategy', () => {
    // Times should create a funnel from broad to narrow
    const times = [
      ENGAGEMENT_TIMING.exitIntent.delay,
      ENGAGEMENT_TIMING.floatingButton.showAfterTime,
      ENGAGEMENT_TIMING.smartBanner.timeThreshold,
    ];

    // Should be in ascending order
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThan(times[i - 1]);
    }
  });

  it('scroll values support progressive engagement strategy', () => {
    const scrolls = [
      ENGAGEMENT_TIMING.floatingButton.showAfterScroll,
      ENGAGEMENT_TIMING.smartBanner.scrollThreshold,
    ];

    // Should be in ascending order
    for (let i = 1; i < scrolls.length; i++) {
      expect(scrolls[i]).toBeGreaterThan(scrolls[i - 1]);
    }
  });

  it('configuration prevents conflicts', () => {
    // Exit intent comes first
    expect(ENGAGEMENT_TIMING.exitIntent.delay).toBeLessThan(
      ENGAGEMENT_TIMING.floatingButton.showAfterTime
    );

    // Floating button comes before smart banner
    expect(ENGAGEMENT_TIMING.floatingButton.showAfterTime).toBeLessThan(
      ENGAGEMENT_TIMING.smartBanner.timeThreshold
    );

    // Scroll thresholds also escalate
    expect(ENGAGEMENT_TIMING.floatingButton.showAfterScroll).toBeLessThan(
      ENGAGEMENT_TIMING.smartBanner.scrollThreshold
    );
  });

  it('time values are reasonable for user experience', () => {
    // Exit intent at 30s is reasonable for reading/evaluating
    expect(ENGAGEMENT_TIMING.exitIntent.delay).toBe(30000);

    // Floating button at 45s gives time to engage
    expect(ENGAGEMENT_TIMING.floatingButton.showAfterTime).toBe(45000);

    // Smart banner at 90s is for highly engaged users
    expect(ENGAGEMENT_TIMING.smartBanner.timeThreshold).toBe(90000);
  });

  it('scroll values are reasonable for user experience', () => {
    // 50% scroll shows some engagement
    expect(ENGAGEMENT_TIMING.floatingButton.showAfterScroll).toBe(50);

    // 75% scroll shows high engagement
    expect(ENGAGEMENT_TIMING.smartBanner.scrollThreshold).toBe(75);
  });

  it('exports are immutable (as const)', () => {
    // TypeScript enforces this at compile time
    expect(typeof ENGAGEMENT_TIMING).toBe('object');
    expect(typeof SESSION_STORAGE_KEYS).toBe('object');
  });
});
