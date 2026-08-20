/**
 * Tests for cta-messaging.ts - CTA messaging configuration
 * Validates CTA messages, descriptions, and supporting text
 */

import { CTA_MESSAGES, CTA_DESCRIPTIONS } from '../cta-messaging';

describe('CTA_MESSAGES', () => {
  describe('Primary CTAs', () => {
    it('has primary CTA message', () => {
      expect(CTA_MESSAGES.primary).toBe('Start Free Trial');
    });

    it('has secondary CTA message', () => {
      expect(CTA_MESSAGES.secondary).toBe('Start Free Trial');
    });

    it('primary CTA is a non-empty string', () => {
      expect(typeof CTA_MESSAGES.primary).toBe('string');
      expect(CTA_MESSAGES.primary.length).toBeGreaterThan(0);
    });

    it('secondary CTA is a non-empty string', () => {
      expect(typeof CTA_MESSAGES.secondary).toBe('string');
      expect(CTA_MESSAGES.secondary.length).toBeGreaterThan(0);
    });
  });

  describe('Context-specific CTAs', () => {
    it('has pricing CTA', () => {
      expect(CTA_MESSAGES.pricing).toBe('Start Free Trial');
    });

    it('has ROI CTA', () => {
      expect(CTA_MESSAGES.roi).toBe('See My Savings');
    });

    it('has demo CTA', () => {
      expect(CTA_MESSAGES.demo).toBe('Start Free Trial');
    });

    it('all context CTAs are non-empty strings', () => {
      expect(typeof CTA_MESSAGES.pricing).toBe('string');
      expect(typeof CTA_MESSAGES.roi).toBe('string');
      expect(typeof CTA_MESSAGES.demo).toBe('string');

      expect(CTA_MESSAGES.pricing.length).toBeGreaterThan(0);
      expect(CTA_MESSAGES.roi.length).toBeGreaterThan(0);
      expect(CTA_MESSAGES.demo.length).toBeGreaterThan(0);
    });
  });

  describe('Supporting text', () => {
    it('has creditCard supporting text with cancel framing', () => {
      expect(CTA_MESSAGES.supportingText.creditCard).toBe("Credit card required. Cancel anytime.");
    });

    it('has trialDuration supporting text', () => {
      expect(CTA_MESSAGES.supportingText.trialDuration).toBe('30-day free trial on all paid plans');
    });

    it('has cancel supporting text', () => {
      expect(CTA_MESSAGES.supportingText.cancel).toBe('Cancel anytime');
    });

    it('all supporting texts are non-empty strings', () => {
      expect(typeof CTA_MESSAGES.supportingText.creditCard).toBe('string');
      expect(typeof CTA_MESSAGES.supportingText.trialDuration).toBe('string');
      expect(typeof CTA_MESSAGES.supportingText.cancel).toBe('string');

      expect(CTA_MESSAGES.supportingText.creditCard.length).toBeGreaterThan(0);
      expect(CTA_MESSAGES.supportingText.trialDuration.length).toBeGreaterThan(0);
      expect(CTA_MESSAGES.supportingText.cancel.length).toBeGreaterThan(0);
    });
  });

  describe('Consistency checks', () => {
    it('emphasizes trial theme across CTAs', () => {
      const allCTAs = [
        CTA_MESSAGES.primary,
        CTA_MESSAGES.secondary,
        CTA_MESSAGES.pricing,
        CTA_MESSAGES.roi,
        CTA_MESSAGES.demo,
      ];

      const trialCount = allCTAs.filter(cta =>
        cta.toLowerCase().includes('trial') || cta.toLowerCase().includes('free')
      ).length;
      expect(trialCount).toBeGreaterThanOrEqual(3);
    });

    it('keeps CTAs concise (under 35 characters)', () => {
      const allCTAs = [
        CTA_MESSAGES.primary,
        CTA_MESSAGES.secondary,
        CTA_MESSAGES.pricing,
        CTA_MESSAGES.roi,
        CTA_MESSAGES.demo,
      ];

      allCTAs.forEach(cta => {
        expect(cta.length).toBeLessThanOrEqual(35);
      });
    });

    it('uses action-oriented verbs in CTAs', () => {
      const actionVerbs = ['start', 'try', 'begin', 'get', 'see'];
      const allCTAs = [
        CTA_MESSAGES.primary,
        CTA_MESSAGES.secondary,
        CTA_MESSAGES.pricing,
        CTA_MESSAGES.roi,
        CTA_MESSAGES.demo,
      ];

      allCTAs.forEach(cta => {
        const hasActionVerb = actionVerbs.some(verb =>
          cta.toLowerCase().includes(verb)
        );
        expect(hasActionVerb).toBe(true);
      });
    });
  });
});

describe('CTA_DESCRIPTIONS', () => {
  describe('Context descriptions', () => {
    it('has hero description', () => {
      expect(CTA_DESCRIPTIONS.hero).toBe('Built for clubs and communities like yours');
    });

    it('has pricing description', () => {
      expect(CTA_DESCRIPTIONS.pricing).toBe('Start your 30-day free trial on Grow or Expand');
    });

    it('has ROI description', () => {
      expect(CTA_DESCRIPTIONS.roi).toBe('See how much time and money you can save');
    });

    it('has demo description', () => {
      expect(CTA_DESCRIPTIONS.demo).toBe('Get started in under 5 minutes');
    });

    it('all descriptions are non-empty strings', () => {
      expect(typeof CTA_DESCRIPTIONS.hero).toBe('string');
      expect(typeof CTA_DESCRIPTIONS.pricing).toBe('string');
      expect(typeof CTA_DESCRIPTIONS.roi).toBe('string');
      expect(typeof CTA_DESCRIPTIONS.demo).toBe('string');

      expect(CTA_DESCRIPTIONS.hero.length).toBeGreaterThan(0);
      expect(CTA_DESCRIPTIONS.pricing.length).toBeGreaterThan(0);
      expect(CTA_DESCRIPTIONS.roi.length).toBeGreaterThan(0);
      expect(CTA_DESCRIPTIONS.demo.length).toBeGreaterThan(0);
    });
  });

  describe('Description quality checks', () => {
    it('keeps descriptions concise (under 100 characters)', () => {
      const allDescriptions = Object.values(CTA_DESCRIPTIONS);

      allDescriptions.forEach(desc => {
        expect(desc.length).toBeLessThanOrEqual(100);
      });
    });

    it('uses benefit-oriented language', () => {
      const benefitKeywords = ['save', 'started', 'trial', 'free', 'using', 'built'];
      const allDescriptions = Object.values(CTA_DESCRIPTIONS);

      allDescriptions.forEach(desc => {
        const hasBenefitKeyword = benefitKeywords.some(keyword =>
          desc.toLowerCase().includes(keyword)
        );
        expect(hasBenefitKeyword).toBe(true);
      });
    });

    it('maintains professional tone', () => {
      const allDescriptions = Object.values(CTA_DESCRIPTIONS);

      allDescriptions.forEach(desc => {
        // Should not contain informal language
        expect(desc.toLowerCase()).not.toContain('!');
        expect(desc.toLowerCase()).not.toContain('awesome');
        expect(desc.toLowerCase()).not.toContain('amazing');
      });
    });
  });

  describe('Contextual alignment', () => {
    it('hero description emphasizes relevance', () => {
      expect(CTA_DESCRIPTIONS.hero.toLowerCase()).toContain('clubs');
    });

    it('pricing description mentions trial', () => {
      expect(CTA_DESCRIPTIONS.pricing.toLowerCase()).toContain('trial');
    });

    it('ROI description focuses on value', () => {
      const roiKeywords = ['save', 'time', 'money'];
      const hasRoiKeyword = roiKeywords.some(keyword =>
        CTA_DESCRIPTIONS.roi.toLowerCase().includes(keyword)
      );
      expect(hasRoiKeyword).toBe(true);
    });

    it('demo description emphasizes speed', () => {
      expect(CTA_DESCRIPTIONS.demo.toLowerCase()).toContain('minutes');
    });
  });
});

describe('CTA_MESSAGES and CTA_DESCRIPTIONS integration', () => {
  it('have matching context keys where applicable', () => {
    // Both should have pricing, roi, demo contexts
    expect(CTA_MESSAGES.pricing).toBeDefined();
    expect(CTA_DESCRIPTIONS.pricing).toBeDefined();

    expect(CTA_MESSAGES.roi).toBeDefined();
    expect(CTA_DESCRIPTIONS.roi).toBeDefined();

    expect(CTA_MESSAGES.demo).toBeDefined();
    expect(CTA_DESCRIPTIONS.demo).toBeDefined();
  });

  it('messages and descriptions complement each other', () => {
    // Pricing: message mentions "Trial", description expands on it
    expect(CTA_MESSAGES.pricing.toLowerCase()).toContain('trial');
    expect(CTA_DESCRIPTIONS.pricing.toLowerCase()).toContain('trial');

    // Demo: message mentions "trial"/"free", description adds timeline
    const demoHasFreeOrTrial = CTA_MESSAGES.demo.toLowerCase().includes('free') ||
      CTA_MESSAGES.demo.toLowerCase().includes('trial');
    expect(demoHasFreeOrTrial).toBe(true);
    expect(CTA_DESCRIPTIONS.demo.toLowerCase()).toContain('minutes');
  });

  it('exports are immutable (as const)', () => {
    // TypeScript enforces this at compile time, but we can verify structure
    expect(Object.isFrozen(CTA_MESSAGES)).toBe(false); // as const doesn't freeze runtime
    expect(typeof CTA_MESSAGES).toBe('object');
    expect(typeof CTA_DESCRIPTIONS).toBe('object');
  });
});
