/**
 * Tests for touch-safe.ts - Touch-safe interaction utilities
 * Following boundary mocking pattern: no mocks needed, testing real logic
 */

import { touchSafeHover, touchSafeStyles, withTouchSafe } from '../touch-safe';

describe('touchSafeHover', () => {
  it('exports button hover classes', () => {
    expect(touchSafeHover.button).toBeDefined();
    expect(typeof touchSafeHover.button).toBe('string');
    expect(touchSafeHover.button).toContain('hover:bg-opacity-90');
    expect(touchSafeHover.button).toContain('active:bg-opacity-80');
    expect(touchSafeHover.button).toContain('transition-all');
  });

  it('exports link hover classes', () => {
    expect(touchSafeHover.link).toBeDefined();
    expect(typeof touchSafeHover.link).toBe('string');
    expect(touchSafeHover.link).toContain('hover:text-primary');
    expect(touchSafeHover.link).toContain('active:text-primary/80');
    expect(touchSafeHover.link).toContain('transition-colors');
  });

  it('exports card hover classes', () => {
    expect(touchSafeHover.card).toBeDefined();
    expect(typeof touchSafeHover.card).toBe('string');
    expect(touchSafeHover.card).toContain('hover:shadow-lg');
    expect(touchSafeHover.card).toContain('active:shadow-md');
    expect(touchSafeHover.card).toContain('transition-shadow');
  });

  it('exports scale hover classes', () => {
    expect(touchSafeHover.scale).toBeDefined();
    expect(typeof touchSafeHover.scale).toBe('string');
    expect(touchSafeHover.scale).toContain('hover:scale-105');
    expect(touchSafeHover.scale).toContain('active:scale-95');
    expect(touchSafeHover.scale).toContain('transition-transform');
  });

  it('includes media query for hover support in all classes', () => {
    expect(touchSafeHover.button).toContain('@media (hover: hover)');
    expect(touchSafeHover.link).toContain('@media (hover: hover)');
    expect(touchSafeHover.card).toContain('@media (hover: hover)');
    expect(touchSafeHover.scale).toContain('@media (hover: hover)');
  });
});

describe('touchSafeStyles', () => {
  it('exports button CSS-in-JS styles', () => {
    expect(touchSafeStyles.button).toBeDefined();
    expect(touchSafeStyles.button).toHaveProperty('transition', 'all 0.2s ease');
    expect(touchSafeStyles.button).toHaveProperty('&:active');
    expect(touchSafeStyles.button['&:active']).toEqual({
      opacity: 0.8,
      transform: 'scale(0.98)'
    });
    expect(touchSafeStyles.button).toHaveProperty('@media (hover: hover)');
  });

  it('exports link CSS-in-JS styles', () => {
    expect(touchSafeStyles.link).toBeDefined();
    expect(touchSafeStyles.link).toHaveProperty('transition', 'color 0.2s ease');
    expect(touchSafeStyles.link).toHaveProperty('&:active');
    expect(touchSafeStyles.link['&:active']).toEqual({
      opacity: 0.8
    });
    expect(touchSafeStyles.link).toHaveProperty('@media (hover: hover)');
  });

  it('includes hover media query in CSS-in-JS styles', () => {
    expect(touchSafeStyles.button['@media (hover: hover)']).toHaveProperty('&:hover');
    expect(touchSafeStyles.button['@media (hover: hover)']['&:hover']).toEqual({
      opacity: 0.9
    });

    expect(touchSafeStyles.link['@media (hover: hover)']).toHaveProperty('&:hover');
    expect(touchSafeStyles.link['@media (hover: hover)']['&:hover']).toEqual({
      color: 'var(--primary)'
    });
  });
});

describe('withTouchSafe()', () => {
  it('combines base classes with button touch-safe classes', () => {
    const result = withTouchSafe('bg-blue-500 text-white', 'button');

    expect(result).toContain('bg-blue-500 text-white');
    expect(result).toContain('hover:bg-opacity-90');
    expect(result).toContain('active:bg-opacity-80');
    expect(result).toContain('transition-all');
  });

  it('combines base classes with link touch-safe classes', () => {
    const result = withTouchSafe('text-blue-600 underline', 'link');

    expect(result).toContain('text-blue-600 underline');
    expect(result).toContain('hover:text-primary');
    expect(result).toContain('active:text-primary/80');
    expect(result).toContain('transition-colors');
  });

  it('combines base classes with card touch-safe classes', () => {
    const result = withTouchSafe('rounded-lg border p-4', 'card');

    expect(result).toContain('rounded-lg border p-4');
    expect(result).toContain('hover:shadow-lg');
    expect(result).toContain('active:shadow-md');
    expect(result).toContain('transition-shadow');
  });

  it('combines base classes with scale touch-safe classes', () => {
    const result = withTouchSafe('inline-block cursor-pointer', 'scale');

    expect(result).toContain('inline-block cursor-pointer');
    expect(result).toContain('hover:scale-105');
    expect(result).toContain('active:scale-95');
    expect(result).toContain('transition-transform');
  });

  it('handles empty base classes', () => {
    const result = withTouchSafe('', 'button');

    expect(result).toContain('hover:bg-opacity-90');
    expect(result).toContain('active:bg-opacity-80');
  });

  it('preserves whitespace correctly', () => {
    const result = withTouchSafe('class1 class2', 'link');

    // Should have space between base classes and touch-safe classes
    expect(result).toBe(`class1 class2 ${touchSafeHover.link}`);
  });

  it('works with multiple base classes', () => {
    const result = withTouchSafe('px-4 py-2 bg-blue-500 text-white rounded-md', 'button');

    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('text-white');
    expect(result).toContain('rounded-md');
    expect(result).toContain('hover:bg-opacity-90');
  });
});
