/**
 * Tests for animations.ts - Framer Motion animation configurations
 * Following boundary mocking pattern: no mocks needed, testing real logic
 */

import {
  performanceTransition,
  springTransition,
  smoothTransition,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideInUp,
  staggerContainer,
  fastStaggerContainer,
  hoverScale,
  hoverGlow,
  reduceMotion,
  checkReducedMotion,
  getMotionVariants,
  motionConfig,
  easing,
  timing,
  scrollAnimations,
} from '../animations';

describe('Transition configurations', () => {
  describe('performanceTransition', () => {
    it('uses tween for consistent performance', () => {
      expect(performanceTransition.type).toBe('tween');
      expect(performanceTransition.ease).toBe('easeOut');
      expect(performanceTransition.duration).toBe(0.3);
    });
  });

  describe('springTransition', () => {
    it('uses spring physics for natural motion', () => {
      expect(springTransition.type).toBe('spring');
      expect(springTransition.stiffness).toBe(400);
      expect(springTransition.damping).toBe(30);
      expect(springTransition.mass).toBe(1);
    });
  });

  describe('smoothTransition', () => {
    it('uses custom cubic-bezier easing', () => {
      expect(smoothTransition.type).toBe('tween');
      expect(smoothTransition.ease).toEqual([0.25, 0.1, 0.25, 1]);
      expect(smoothTransition.duration).toBe(0.4);
    });
  });
});

describe('Animation variants', () => {
  describe('fadeInUp', () => {
    it('fades in from bottom', () => {
      expect(fadeInUp.hidden).toMatchObject({
        opacity: 0,
        y: 20,
      });
      expect(fadeInUp.visible).toMatchObject({
        opacity: 1,
        y: 0,
      });
    });

    it('uses performance transition', () => {
      expect(fadeInUp.hidden.transition).toBe(performanceTransition);
      expect(fadeInUp.visible.transition).toBe(performanceTransition);
    });
  });

  describe('fadeInLeft', () => {
    it('fades in from left', () => {
      expect(fadeInLeft.hidden).toMatchObject({
        opacity: 0,
        x: -30,
      });
      expect(fadeInLeft.visible).toMatchObject({
        opacity: 1,
        x: 0,
      });
    });
  });

  describe('fadeInRight', () => {
    it('fades in from right', () => {
      expect(fadeInRight.hidden).toMatchObject({
        opacity: 0,
        x: 30,
      });
      expect(fadeInRight.visible).toMatchObject({
        opacity: 1,
        x: 0,
      });
    });
  });

  describe('scaleIn', () => {
    it('scales up from 90%', () => {
      expect(scaleIn.hidden).toMatchObject({
        opacity: 0,
        scale: 0.9,
      });
      expect(scaleIn.visible).toMatchObject({
        opacity: 1,
        scale: 1,
      });
    });

    it('uses spring transition for visible state', () => {
      expect(scaleIn.visible.transition).toBe(springTransition);
    });
  });

  describe('slideInUp', () => {
    it('slides in from bottom', () => {
      expect(slideInUp.hidden).toMatchObject({
        opacity: 0,
        y: 50,
      });
      expect(slideInUp.visible).toMatchObject({
        opacity: 1,
        y: 0,
      });
    });
  });

  describe('staggerContainer', () => {
    it('staggers children animations', () => {
      expect(staggerContainer.visible).toHaveProperty('transition');
      expect(staggerContainer.visible.transition).toMatchObject({
        staggerChildren: 0.1,
      });
    });
  });

  describe('fastStaggerContainer', () => {
    it('staggers children with shorter delay', () => {
      expect(fastStaggerContainer.visible).toHaveProperty('transition');
      expect(fastStaggerContainer.visible.transition).toMatchObject({
        staggerChildren: 0.05,
      });
    });
  });

  describe('hoverScale', () => {
    it('scales up on hover', () => {
      expect(hoverScale.rest).toMatchObject({ scale: 1 });
      expect(hoverScale.hover).toMatchObject({ scale: 1.05 });
    });

    it('scales down on tap', () => {
      expect(hoverScale.tap).toMatchObject({ scale: 0.95 });
    });
  });

  describe('hoverGlow', () => {
    it('adds glow effect on hover', () => {
      expect(hoverGlow.rest).toBeDefined();
      expect(hoverGlow.rest).toHaveProperty('boxShadow');
      expect(hoverGlow.hover).toBeDefined();
      expect(hoverGlow.hover).toHaveProperty('boxShadow');
    });

    it('has no shadow at rest', () => {
      expect(hoverGlow.rest.boxShadow).toContain('rgba(59, 130, 246, 0)');
    });

    it('has glow shadow on hover', () => {
      expect(hoverGlow.hover.boxShadow).toContain('rgba(59, 130, 246, 0.3)');
    });
  });
});

describe('Utility functions', () => {
  describe('reduceMotion()', () => {
    it('reduces animation duration while preserving all properties', () => {
      const variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      };

      const reduced = reduceMotion(variants);

      // All original properties are preserved
      expect(reduced.hidden).toMatchObject({ opacity: 0, y: 20 });
      expect(reduced.visible).toMatchObject({ opacity: 1, y: 0 });

      // But transitions are very short (0.01s)
      expect(reduced.hidden.transition).toEqual({
        duration: 0.01,
        type: 'tween',
      });
      expect(reduced.visible.transition).toEqual({
        duration: 0.01,
        type: 'tween',
      });
    });

    it('preserves transforms but speeds up transition', () => {
      const variants = {
        hidden: { opacity: 0, x: -20, y: 20, scale: 0.9 },
        visible: { opacity: 1, x: 0, y: 0, scale: 1 },
      };

      const reduced = reduceMotion(variants);

      // All transforms are preserved
      expect(reduced.hidden).toMatchObject({ opacity: 0, x: -20, y: 20, scale: 0.9 });
      expect(reduced.visible).toMatchObject({ opacity: 1, x: 0, y: 0, scale: 1 });

      // Transitions are instant
      expect(reduced.hidden.transition?.duration).toBe(0.01);
      expect(reduced.visible.transition?.duration).toBe(0.01);
    });

    it('handles variants with only opacity', () => {
      const variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      };

      const reduced = reduceMotion(variants);

      expect(reduced.hidden).toMatchObject({ opacity: 0 });
      expect(reduced.visible).toMatchObject({ opacity: 1 });
      expect(reduced.hidden.transition?.duration).toBe(0.01);
    });
  });

  describe('checkReducedMotion()', () => {
    it('returns boolean based on matchMedia', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const result = checkReducedMotion();
      expect(typeof result).toBe('boolean');
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('checks prefers-reduced-motion media query', () => {
      // Mock matchMedia to return true
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: true });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const result = checkReducedMotion();

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      expect(result).toBe(true);
    });

    it('returns false when reduced motion is not preferred', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const result = checkReducedMotion();

      expect(result).toBe(false);
    });
  });

  describe('getMotionVariants()', () => {
    it('returns original variants when reduced motion is not preferred', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      };

      const result = getMotionVariants(variants);

      expect(result).toEqual(variants);
    });

    it('returns reduced variants when reduced motion is preferred', () => {
      const mockMatchMedia = jest.fn().mockReturnValue({ matches: true });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      };

      const result = getMotionVariants(variants);

      // Properties preserved, but transition is instant
      expect(result.hidden).toMatchObject({ opacity: 0, y: 20 });
      expect(result.visible).toMatchObject({ opacity: 1, y: 0 });
      expect(result.hidden.transition?.duration).toBe(0.01);
      expect(result.visible.transition?.duration).toBe(0.01);
    });
  });
});

describe('Configuration objects', () => {
  describe('motionConfig', () => {
    it('defines performance optimization settings', () => {
      expect(motionConfig).toHaveProperty('style');
      expect(motionConfig).toHaveProperty('layoutId');
      expect(motionConfig).toHaveProperty('layout');
      expect(motionConfig).toHaveProperty('layoutDependency');
    });

    it('uses hardware acceleration', () => {
      expect(motionConfig.style).toMatchObject({
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      });
    });

    it('disables layout animations for performance', () => {
      expect(motionConfig.layout).toBe(false);
      expect(motionConfig.layoutId).toBeUndefined();
    });
  });

  describe('easing', () => {
    it('exports easing curve definitions', () => {
      expect(easing).toBeDefined();
      expect(typeof easing).toBe('object');
    });

    it('includes Material Design easing curves', () => {
      expect(easing).toHaveProperty('standard');
      expect(easing).toHaveProperty('decelerate');
      expect(easing).toHaveProperty('accelerate');
    });

    it('includes custom easing curves', () => {
      expect(easing).toHaveProperty('smooth');
      expect(easing).toHaveProperty('bounce');
    });

    it('includes performance-optimized easing curves', () => {
      expect(easing).toHaveProperty('fastOut');
      expect(easing).toHaveProperty('slowIn');
    });

    it('easing values are cubic-bezier arrays', () => {
      expect(Array.isArray(easing.standard)).toBe(true);
      expect(easing.standard).toHaveLength(4);
      expect(Array.isArray(easing.smooth)).toBe(true);
      expect(easing.smooth).toHaveLength(4);
    });
  });

  describe('timing', () => {
    it('exports timing constants', () => {
      expect(timing).toBeDefined();
      expect(typeof timing).toBe('object');
    });

    it('includes duration values', () => {
      expect(timing).toHaveProperty('fast');
      expect(timing).toHaveProperty('normal');
      expect(timing).toHaveProperty('slow');
      expect(timing).toHaveProperty('slower');
    });

    it('durations are numeric', () => {
      expect(typeof timing.fast).toBe('number');
      expect(typeof timing.normal).toBe('number');
      expect(typeof timing.slow).toBe('number');
      expect(typeof timing.slower).toBe('number');
    });

    it('durations are in ascending order', () => {
      expect(timing.fast).toBeLessThan(timing.normal);
      expect(timing.normal).toBeLessThan(timing.slow);
      expect(timing.slow).toBeLessThan(timing.slower);
    });
  });

  describe('scrollAnimations', () => {
    it('exports scroll animation configurations', () => {
      expect(scrollAnimations).toBeDefined();
      expect(typeof scrollAnimations).toBe('object');
    });

    it('includes fadeInOnScroll variant', () => {
      expect(scrollAnimations).toHaveProperty('fadeInOnScroll');
      expect(scrollAnimations.fadeInOnScroll).toHaveProperty('hidden');
      expect(scrollAnimations.fadeInOnScroll).toHaveProperty('visible');
    });

    it('includes scaleInOnScroll variant', () => {
      expect(scrollAnimations).toHaveProperty('scaleInOnScroll');
      expect(scrollAnimations.scaleInOnScroll).toHaveProperty('hidden');
      expect(scrollAnimations.scaleInOnScroll).toHaveProperty('visible');
    });

    it('includes slideInOnScroll variant', () => {
      expect(scrollAnimations).toHaveProperty('slideInOnScroll');
      expect(scrollAnimations.slideInOnScroll).toHaveProperty('hidden');
      expect(scrollAnimations.slideInOnScroll).toHaveProperty('visible');
    });

    it('fadeInOnScroll uses vertical movement', () => {
      expect(scrollAnimations.fadeInOnScroll.hidden).toMatchObject({
        opacity: 0,
        y: 30,
      });
      expect(scrollAnimations.fadeInOnScroll.visible).toMatchObject({
        opacity: 1,
        y: 0,
      });
    });

    it('scaleInOnScroll uses scale transform', () => {
      expect(scrollAnimations.scaleInOnScroll.hidden).toMatchObject({
        opacity: 0,
        scale: 0.8,
      });
      expect(scrollAnimations.scaleInOnScroll.visible).toMatchObject({
        opacity: 1,
        scale: 1,
      });
    });

    it('slideInOnScroll uses horizontal movement', () => {
      expect(scrollAnimations.slideInOnScroll.hidden).toMatchObject({
        opacity: 0,
        x: -50,
      });
      expect(scrollAnimations.slideInOnScroll.visible).toMatchObject({
        opacity: 1,
        x: 0,
      });
    });
  });
});
