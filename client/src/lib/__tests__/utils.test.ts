/**
 * Tests for utils.ts - Utility functions
 * Following boundary mocking pattern: no mocks needed, testing real logic
 */

import { cn } from '../utils';

describe('cn()', () => {
  describe('Basic Class Merging', () => {
    it('merges multiple class strings', () => {
      expect(cn('px-4', 'py-2', 'bg-blue-500')).toBe('px-4 py-2 bg-blue-500');
    });

    it('returns empty string for no inputs', () => {
      expect(cn()).toBe('');
    });

    it('handles single class string', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('removes extra whitespace', () => {
      expect(cn('px-4   py-2')).toBe('px-4 py-2');
    });
  });

  describe('Conditional Classes', () => {
    it('includes classes based on conditions', () => {
      const isActive = true;
      const isDisabled = false;

      expect(cn('base-class', isActive && 'active', isDisabled && 'disabled')).toBe('base-class active');
    });

    it('handles falsy values', () => {
      expect(cn('base', false, null, undefined, 0, '')).toBe('base');
    });

    it('handles ternary expressions', () => {
      const variant = 'primary';
      expect(cn(variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500')).toBe('bg-blue-500');
    });
  });

  describe('Array Inputs', () => {
    it('merges array of classes', () => {
      expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2');
    });

    it('merges nested arrays', () => {
      expect(cn(['px-4', ['py-2', 'text-sm']])).toBe('px-4 py-2 text-sm');
    });

    it('handles arrays with conditional values', () => {
      expect(cn(['px-4', false, 'py-2'])).toBe('px-4 py-2');
    });
  });

  describe('Object Inputs', () => {
    it('includes classes where value is truthy', () => {
      expect(cn({
        'px-4': true,
        'py-2': true,
        'hidden': false,
      })).toBe('px-4 py-2');
    });

    it('handles object with all falsy values', () => {
      expect(cn({
        'px-4': false,
        'py-2': false,
      })).toBe('');
    });

    it('combines objects and strings', () => {
      expect(cn('base-class', {
        'active': true,
        'disabled': false,
      })).toBe('base-class active');
    });
  });

  describe('Tailwind Class Conflicts', () => {
    it('resolves conflicting padding classes (twMerge behavior)', () => {
      // Last padding-x value wins
      expect(cn('px-2 px-4')).toBe('px-4');
    });

    it('resolves conflicting background colors', () => {
      // Last bg color wins
      expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500');
    });

    it('resolves conflicting text sizes', () => {
      expect(cn('text-sm text-lg')).toBe('text-lg');
    });

    it('keeps non-conflicting classes from same group', () => {
      // px and py don't conflict
      expect(cn('px-4 py-2')).toBe('px-4 py-2');
    });

    it('resolves multiple conflicts at once', () => {
      expect(cn('px-2 py-4 px-4 py-2')).toBe('px-4 py-2');
    });
  });

  describe('Complex Scenarios', () => {
    it('handles mix of strings, arrays, and objects', () => {
      const result = cn(
        'base-class',
        ['px-4', 'py-2'],
        {
          'active': true,
          'disabled': false,
        },
        'text-sm'
      );

      expect(result).toBe('base-class px-4 py-2 active text-sm');
    });

    it('handles conditionals with conflicts', () => {
      const size = 'large';
      const result = cn(
        'px-2', // Default
        size === 'large' && 'px-4', // Override
        'py-2'
      );

      expect(result).toBe('px-4 py-2');
    });

    it('handles variant-based styling', () => {
      const variant = 'danger';
      const size = 'large';

      const result = cn(
        'rounded font-semibold',
        {
          'bg-red-500 text-white': variant === 'danger',
          'bg-blue-500 text-white': variant === 'primary',
        },
        {
          'px-4 py-2 text-sm': size === 'small',
          'px-6 py-3 text-base': size === 'large',
        }
      );

      expect(result).toBe('rounded font-semibold bg-red-500 text-white px-6 py-3 text-base');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty strings', () => {
      expect(cn('', 'px-4', '')).toBe('px-4');
    });

    it('handles only whitespace', () => {
      expect(cn('   ', 'px-4')).toBe('px-4');
    });

    it('handles undefined and null', () => {
      expect(cn(undefined, 'px-4', null)).toBe('px-4');
    });

    it('handles zero', () => {
      expect(cn(0, 'px-4')).toBe('px-4');
    });

    it('handles empty array', () => {
      expect(cn([])).toBe('');
    });

    it('handles empty object', () => {
      expect(cn({})).toBe('');
    });
  });

  describe('Real-World Usage Patterns', () => {
    it('handles button variants', () => {
      const getButtonClasses = (variant: 'primary' | 'secondary' | 'danger', size: 'sm' | 'md' | 'lg', disabled: boolean) => {
        return cn(
          'rounded font-semibold transition-colors',
          {
            'bg-blue-500 text-white hover:bg-blue-600': variant === 'primary',
            'bg-gray-200 text-gray-800 hover:bg-gray-300': variant === 'secondary',
            'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          {
            'opacity-50 cursor-not-allowed': disabled,
          }
        );
      };

      expect(getButtonClasses('primary', 'md', false)).toBe(
        'rounded font-semibold transition-colors bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 text-base'
      );

      expect(getButtonClasses('danger', 'lg', true)).toBe(
        'rounded font-semibold transition-colors bg-red-500 text-white hover:bg-red-600 px-6 py-3 text-lg opacity-50 cursor-not-allowed'
      );
    });

    it('handles card styling with states', () => {
      const getCardClasses = (isHoverable: boolean, isSelected: boolean, isDisabled: boolean) => {
        return cn(
          'rounded-lg border p-4',
          isHoverable && 'hover:shadow-lg transition-shadow',
          isSelected && 'border-blue-500 bg-blue-50',
          isDisabled && 'opacity-50 cursor-not-allowed'
        );
      };

      expect(getCardClasses(true, false, false)).toBe(
        'rounded-lg border p-4 hover:shadow-lg transition-shadow'
      );

      expect(getCardClasses(true, true, false)).toBe(
        'rounded-lg border p-4 hover:shadow-lg transition-shadow border-blue-500 bg-blue-50'
      );
    });

    it('handles responsive classes', () => {
      const getResponsiveClasses = (isMobile: boolean) => {
        return cn(
          'container',
          isMobile ? 'px-4' : 'px-8',
          isMobile ? 'text-sm' : 'text-base'
        );
      };

      expect(getResponsiveClasses(true)).toBe('container px-4 text-sm');
      expect(getResponsiveClasses(false)).toBe('container px-8 text-base');
    });
  });
});
