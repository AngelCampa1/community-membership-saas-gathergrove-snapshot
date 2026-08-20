/**
 * Tests for ctaConfig.ts - CTA configuration and A/B testing
 * Following boundary mocking pattern: no external dependencies, testing real logic
 */

import {
  CTA_CONFIGS,
  CTA_VARIANTS,
  getCTAConfig,
  getRandomCTA,
} from '../ctaConfig';

describe('CTA_CONFIGS', () => {
  describe('Primary CTAs', () => {
    it('includes primary-start-free config', () => {
      const config = CTA_CONFIGS['primary-start-free'];

      expect(config).toBeDefined();
      expect(config.id).toBe('primary-start-free');
      expect(config.tier).toBe('primary');
      expect(config.variant).toBe('high-intent');
      expect(config.location).toBe('hero');
      expect(config.text).toBe('Start Your Free Trial');
      expect(config.href).toBe('/register');
      expect(config.commitmentLevel).toBe('high');
      expect(config.size).toBe('lg');
    });

    it('includes primary-create-club config', () => {
      const config = CTA_CONFIGS['primary-create-club'];

      expect(config).toBeDefined();
      expect(config.id).toBe('primary-create-club');
      expect(config.tier).toBe('primary');
      expect(config.text).toBe('Create My Club');
      expect(config.description).toBe('Set up in under 5 minutes');
    });

    it('includes primary-get-started config', () => {
      const config = CTA_CONFIGS['primary-get-started'];

      expect(config).toBeDefined();
      expect(config.id).toBe('primary-get-started');
      expect(config.tier).toBe('primary');
      expect(config.text).toBe('Get Started Now');
      expect(config.description).toBe('30-day free trial, then from $9/month');
    });

    it('all primary CTAs have tracking configured', () => {
      const primaryCTAs = Object.values(CTA_CONFIGS).filter(
        config => config.tier === 'primary'
      );

      primaryCTAs.forEach(config => {
        expect(config.tracking).toBeDefined();
        expect(config.tracking.eventName).toBe('cta_click');
        expect(config.tracking.properties.cta_type).toBe('primary');
        expect(config.tracking.properties.commitment_level).toBe('high');
      });
    });
  });

  describe('Secondary CTAs', () => {
    it('includes secondary-watch-demo config', () => {
      const config = CTA_CONFIGS['secondary-watch-demo'];

      expect(config).toBeDefined();
      expect(config.id).toBe('secondary-watch-demo');
      expect(config.tier).toBe('secondary');
      expect(config.text).toBe('Watch 2-Minute Demo');
      expect(config.icon).toBe('▶️');
      expect(config.commitmentLevel).toBe('medium');
    });

    it('secondary-watch-demo dispatches openCTAModal event', () => {
      const config = CTA_CONFIGS['secondary-watch-demo'];
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      config.onClick?.();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'openCTAModal',
          detail: {
            type: 'demo',
            ctaId: 'secondary-watch-demo',
          },
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('includes secondary-see-action config', () => {
      const config = CTA_CONFIGS['secondary-see-action'];

      expect(config).toBeDefined();
      expect(config.id).toBe('secondary-see-action');
      expect(config.text).toBe('See It In Action');
      expect(config.href).toBe('#demo-modal');
      expect(config.icon).toBe('👀');
    });
  });

  describe('Tertiary CTAs', () => {
    it('includes tertiary-download-guide config', () => {
      const config = CTA_CONFIGS['tertiary-download-guide'];

      expect(config).toBeDefined();
      expect(config.id).toBe('tertiary-download-guide');
      expect(config.tier).toBe('tertiary');
      expect(config.text).toBe('Download Club Guide');
      expect(config.commitmentLevel).toBe('low');
      expect(config.icon).toBe('📋');
    });

    it('tertiary-download-guide dispatches lead-magnet event', () => {
      const config = CTA_CONFIGS['tertiary-download-guide'];
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      config.onClick?.();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'openCTAModal',
          detail: {
            type: 'lead-magnet',
            ctaId: 'tertiary-download-guide',
            magnetType: 'guide',
          },
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('includes tertiary-free-checklist config', () => {
      const config = CTA_CONFIGS['tertiary-free-checklist'];

      expect(config).toBeDefined();
      expect(config.id).toBe('tertiary-free-checklist');
      expect(config.text).toBe('Get Free Checklist');
      expect(config.icon).toBe('✅');
    });

    it('all tertiary CTAs have low commitment level', () => {
      const tertiaryCTAs = Object.values(CTA_CONFIGS).filter(
        config => config.tier === 'tertiary'
      );

      tertiaryCTAs.forEach(config => {
        expect(config.commitmentLevel).toBe('low');
      });
    });
  });

  describe('Support CTAs', () => {
    it('includes support-schedule-call config', () => {
      const config = CTA_CONFIGS['support-schedule-call'];

      expect(config).toBeDefined();
      expect(config.id).toBe('support-schedule-call');
      expect(config.tier).toBe('support');
      expect(config.text).toBe('Schedule Consultation');
      expect(config.icon).toBe('📞');
    });

    it('support-schedule-call dispatches consultation event', () => {
      const config = CTA_CONFIGS['support-schedule-call'];
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      config.onClick?.();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'openCTAModal',
          detail: {
            type: 'consultation',
            ctaId: 'support-schedule-call',
          },
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('includes support-get-advice config', () => {
      const config = CTA_CONFIGS['support-get-advice'];

      expect(config).toBeDefined();
      expect(config.id).toBe('support-get-advice');
      expect(config.text).toBe('Get Expert Advice');
      expect(config.href).toBe('#consultation-modal');
    });

    it('includes support-get-quote config', () => {
      const config = CTA_CONFIGS['support-get-quote'];

      expect(config).toBeDefined();
      expect(config.id).toBe('support-get-quote');
      expect(config.text).toBe('Get Enterprise Quote');
      expect(config.icon).toBe('💼');
    });
  });

  describe('Social CTAs', () => {
    it('includes social-join-community config', () => {
      const config = CTA_CONFIGS['social-join-community'];

      expect(config).toBeDefined();
      expect(config.id).toBe('social-join-community');
      expect(config.tier).toBe('social');
      expect(config.text).toBe('Join Community');
      expect(config.href).toBe('https://facebook.com/groups/gathergrove');
      expect(config.icon).toBe('👥');
      expect(config.size).toBe('sm');
    });

    it('includes social-newsletter config', () => {
      const config = CTA_CONFIGS['social-newsletter'];

      expect(config).toBeDefined();
      expect(config.id).toBe('social-newsletter');
      expect(config.text).toBe('Get Tips & Updates');
      expect(config.href).toBe('#newsletter-modal');
      expect(config.icon).toBe('📧');
    });

    it('all social CTAs have low commitment level', () => {
      const socialCTAs = Object.values(CTA_CONFIGS).filter(
        config => config.tier === 'social'
      );

      socialCTAs.forEach(config => {
        expect(config.commitmentLevel).toBe('low');
      });
    });
  });

  describe('All CTAs validation', () => {
    it('all CTAs have required properties', () => {
      Object.values(CTA_CONFIGS).forEach(config => {
        expect(config.id).toBeDefined();
        expect(config.tier).toBeDefined();
        expect(config.variant).toBeDefined();
        expect(config.location).toBeDefined();
        expect(config.text).toBeDefined();
        expect(config.commitmentLevel).toBeDefined();
        expect(config.size).toBeDefined();
        expect(config.tracking).toBeDefined();
      });
    });

    it('all CTAs have either href or onClick', () => {
      Object.values(CTA_CONFIGS).forEach(config => {
        expect(config.href || config.onClick).toBeDefined();
      });
    });

    it('all CTAs have tracking with eventName and properties', () => {
      Object.values(CTA_CONFIGS).forEach(config => {
        expect(config.tracking.eventName).toBe('cta_click');
        expect(config.tracking.properties).toBeDefined();
        expect(config.tracking.properties.cta_type).toBeDefined();
        expect(config.tracking.properties.commitment_level).toBeDefined();
      });
    });

    it('has exactly 12 CTA configs', () => {
      expect(Object.keys(CTA_CONFIGS)).toHaveLength(12);
    });
  });
});

describe('CTA_VARIANTS', () => {
  it('groups primary CTAs correctly', () => {
    expect(CTA_VARIANTS.primary).toHaveLength(3);
    expect(CTA_VARIANTS.primary[0].id).toBe('primary-start-free');
    expect(CTA_VARIANTS.primary[1].id).toBe('primary-create-club');
    expect(CTA_VARIANTS.primary[2].id).toBe('primary-get-started');
  });

  it('groups secondary CTAs correctly', () => {
    expect(CTA_VARIANTS.secondary).toHaveLength(2);
    expect(CTA_VARIANTS.secondary[0].id).toBe('secondary-watch-demo');
    expect(CTA_VARIANTS.secondary[1].id).toBe('secondary-see-action');
  });

  it('groups tertiary CTAs correctly', () => {
    expect(CTA_VARIANTS.tertiary).toHaveLength(2);
    expect(CTA_VARIANTS.tertiary[0].id).toBe('tertiary-download-guide');
    expect(CTA_VARIANTS.tertiary[1].id).toBe('tertiary-free-checklist');
  });

  it('groups support CTAs correctly', () => {
    expect(CTA_VARIANTS.support).toHaveLength(3);
    expect(CTA_VARIANTS.support[0].id).toBe('support-schedule-call');
    expect(CTA_VARIANTS.support[1].id).toBe('support-get-advice');
    expect(CTA_VARIANTS.support[2].id).toBe('support-get-quote');
  });

  it('groups social CTAs correctly', () => {
    expect(CTA_VARIANTS.social).toHaveLength(2);
    expect(CTA_VARIANTS.social[0].id).toBe('social-join-community');
    expect(CTA_VARIANTS.social[1].id).toBe('social-newsletter');
  });

  it('all variants reference actual CTA configs', () => {
    Object.values(CTA_VARIANTS).forEach(variants => {
      variants.forEach(config => {
        expect(CTA_CONFIGS[config.id]).toBe(config);
      });
    });
  });
});

describe('getCTAConfig()', () => {
  it('returns CTA config by location and tier', () => {
    const config = getCTAConfig('hero', 'primary');

    expect(config).toBeDefined();
    expect(config?.tier).toBe('primary');
    expect(config?.location).toBe('hero');
  });

  it('returns first matching config when multiple exist', () => {
    const config = getCTAConfig('hero', 'primary');

    // Multiple primary CTAs at hero, should return first match
    expect(config?.id).toBe('primary-start-free');
  });

  it('returns undefined for non-existent location', () => {
    const config = getCTAConfig('non-existent', 'primary');

    expect(config).toBeUndefined();
  });

  it('returns undefined for non-existent tier', () => {
    const config = getCTAConfig('hero', 'non-existent');

    expect(config).toBeUndefined();
  });

  it('finds support CTAs at pricing location', () => {
    const config = getCTAConfig('pricing', 'support');

    expect(config).toBeDefined();
    expect(config?.tier).toBe('support');
    expect(config?.location).toBe('pricing');
  });

  it('finds tertiary CTAs at footer location', () => {
    const config = getCTAConfig('footer', 'tertiary');

    expect(config).toBeDefined();
    expect(config?.tier).toBe('tertiary');
    expect(config?.location).toBe('footer');
  });

  it('finds social CTAs at footer location', () => {
    const config = getCTAConfig('footer', 'social');

    expect(config).toBeDefined();
    expect(config?.tier).toBe('social');
    expect(config?.location).toBe('footer');
  });
});

describe('getRandomCTA()', () => {
  afterEach(() => {
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('returns a CTA from the specified tier', () => {
    const cta = getRandomCTA('primary');

    expect(CTA_VARIANTS.primary).toContain(cta);
  });

  it('returns first variant when random is 0', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const cta = getRandomCTA('primary');

    expect(cta).toBe(CTA_VARIANTS.primary[0]);
  });

  it('returns last variant when random is close to 1', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const cta = getRandomCTA('primary');

    expect(cta).toBe(CTA_VARIANTS.primary[2]);
  });

  it('returns middle variant when random is 0.5', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const cta = getRandomCTA('primary');

    expect(cta).toBe(CTA_VARIANTS.primary[1]);
  });

  it('works with secondary tier', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const cta = getRandomCTA('secondary');

    expect(cta).toBe(CTA_VARIANTS.secondary[0]);
  });

  it('works with tertiary tier', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const cta = getRandomCTA('tertiary');

    expect(cta).toBe(CTA_VARIANTS.tertiary[1]);
  });

  it('works with support tier', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.33);

    const cta = getRandomCTA('support');

    expect(cta).toBe(CTA_VARIANTS.support[0]);
  });

  it('works with social tier', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const cta = getRandomCTA('social');

    expect(cta).toBe(CTA_VARIANTS.social[1]);
  });

  it('returns different CTAs across multiple calls (statistical)', () => {
    jest.spyOn(Math, 'random').mockRestore(); // Use real random

    const results = new Set();
    for (let i = 0; i < 100; i++) {
      const cta = getRandomCTA('primary');
      results.add(cta.id);
    }

    // With 100 calls and 3 variants, we should see at least 2 different CTAs
    expect(results.size).toBeGreaterThanOrEqual(2);
  });
});
