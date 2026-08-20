/**
 * Tests for OptimizedImage.tsx - Image optimization component
 * Following boundary mocking pattern: test real component behavior
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import OptimizedImage, { useProgressiveImage } from '../OptimizedImage';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ onLoad, onError, ...props }: any) => {
    // Simulate image component that can trigger load/error
    return (
      <img
        {...props}
        data-testid="next-image"
        onLoad={onLoad}
        onError={onError}
      />
    );
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

// Import mocked logger to use in tests
import { logger } from '@/lib/logger';
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('OptimizedImage', () => {
  describe('Rendering', () => {
    it('renders Next.js Image with correct props', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('src', '/test.jpg');
      expect(image).toHaveAttribute('alt', 'Test image');
    });

    it('renders with loading skeleton initially', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('applies custom className to wrapper', () => {
      const { container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          className="custom-class"
        />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Image loading states', () => {
    it('removes skeleton when image loads', async () => {
      const { container, getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');

      // Initially has skeleton
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

      // Trigger load
      act(() => {
        image.dispatchEvent(new Event('load'));
      });

      // Skeleton should be removed
      await waitFor(() => {
        expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
      });
    });

    it('shows error state when image fails to load', async () => {
      const { container, getByTestId, getByText } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');

      // Trigger error
      act(() => {
        image.dispatchEvent(new Event('error'));
      });

      // Should show error message
      await waitFor(() => {
        expect(getByText('Failed to load image')).toBeInTheDocument();
      });

      // Should not show image anymore
      expect(container.querySelector('[data-testid="next-image"]')).not.toBeInTheDocument();
    });

    it('applies opacity transition when image loads', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');

      // Initially has opacity-0
      expect(image).toHaveClass('opacity-0');

      // After load, should have opacity-100
      act(() => {
        image.dispatchEvent(new Event('load'));
      });

      expect(image).toHaveClass('opacity-100');
    });
  });

  describe('Image quality and optimization', () => {
    it('uses default quality of 85', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('quality', '85');
    });

    it('accepts custom quality', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          quality={95}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('quality', '95');
    });

    it('uses blur placeholder by default', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('placeholder', 'blur');
    });

    it('generates default blur data URL', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');
      const blurDataURL = image.getAttribute('blurdataurl');

      expect(blurDataURL).toContain('data:image/svg+xml;base64,');
    });

    it('uses custom blur data URL when provided', () => {
      const customBlur = 'data:image/png;base64,customdata';

      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          blurDataURL={customBlur}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('blurdataurl', customBlur);
    });

    it('does not use blur data URL when placeholder is empty', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          placeholder="empty"
        />
      );

      const image = getByTestId('next-image');
      expect(image).not.toHaveAttribute('blurdataurl');
    });
  });

  describe('Responsive sizing', () => {
    it('generates default responsive sizes', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');
      const sizes = image.getAttribute('sizes');

      expect(sizes).toContain('(max-width: 640px) 100vw');
      expect(sizes).toContain('(max-width: 1024px) 50vw');
      expect(sizes).toContain('33vw');
    });

    it('uses custom sizes when provided', () => {
      const customSizes = '(max-width: 768px) 100vw, 50vw';

      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          sizes={customSizes}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('sizes', customSizes);
    });
  });

  describe('Priority and loading', () => {
    it('uses lazy loading by default', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('uses eager loading when priority is true', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          priority={true}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('loading', 'eager');
      // priority is a React prop passed to Next.js Image, not an HTML attribute
    });

    it('respects custom loading prop when not priority', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          loading="eager"
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('loading', 'eager');
    });
  });

  describe('Fill mode', () => {
    it('uses width/height by default', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveAttribute('width', '800');
      expect(image).toHaveAttribute('height', '600');
    });

    it('uses fill mode when fill is true', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          fill={true}
        />
      );

      const image = getByTestId('next-image');
      // fill is a React prop, not an HTML attribute
      expect(image).not.toHaveAttribute('width');
      expect(image).not.toHaveAttribute('height');
    });

    it('applies object-cover class in fill mode', () => {
      const { getByTestId } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          fill={true}
        />
      );

      const image = getByTestId('next-image');
      expect(image).toHaveClass('object-cover');
    });
  });

  describe('Error state rendering', () => {
    it('renders error fallback with correct dimensions', async () => {
      const { getByTestId, container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
        />
      );

      const image = getByTestId('next-image');

      act(() => {
        image.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        const errorDiv = container.querySelector('.bg-muted');
        expect(errorDiv).toBeInTheDocument();
        expect(errorDiv).toHaveStyle({ width: '800px', height: '600px' });
      });
    });

    it('applies className to error state', async () => {
      const { getByTestId, container } = render(
        <OptimizedImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          className="custom-error-class"
        />
      );

      const image = getByTestId('next-image');

      act(() => {
        image.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        const errorDiv = container.querySelector('.custom-error-class');
        expect(errorDiv).toBeInTheDocument();
      });
    });
  });
});

describe('useProgressiveImage hook', () => {
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Reset Image mock
    (global as any).Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';

      constructor() {
        // Simulate async load
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 10);
      }
    };
  });

  describe('Initial state', () => {
    it('returns placeholder as initial src', () => {
      const { result } = renderHook(() =>
        useProgressiveImage('/test.jpg', '/placeholder.jpg')
      );

      expect(result.current.src).toBe('/placeholder.jpg');
      expect(result.current.isLoading).toBe(true);
    });

    it('returns empty string when no placeholder', () => {
      const { result } = renderHook(() =>
        useProgressiveImage('/test.jpg')
      );

      expect(result.current.src).toBe('');
      expect(result.current.isLoading).toBe(true);
    });

    it('provides loadImage function', () => {
      const { result } = renderHook(() =>
        useProgressiveImage('/test.jpg')
      );

      expect(result.current.loadImage).toBeDefined();
      expect(typeof result.current.loadImage).toBe('function');
    });
  });

  describe('Image loading', () => {
    it('updates src after successful load', async () => {
      const { result } = renderHook(() =>
        useProgressiveImage('/test.jpg', '/placeholder.jpg')
      );

      await act(async () => {
        await result.current.loadImage();
      });

      await waitFor(() => {
        expect(result.current.src).toBe('/test.jpg');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets isLoading to false after load', async () => {
      const { result } = renderHook(() =>
        useProgressiveImage('/test.jpg')
      );

      await act(async () => {
        await result.current.loadImage();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      // Mock Image to fail
      (global as any).Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src: string = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 10);
        }
      };
    });

    it('handles image load failure gracefully', async () => {
      const { result } = renderHook(() =>
        useProgressiveImage('/broken.jpg', '/placeholder.jpg')
      );

      await act(async () => {
        await result.current.loadImage();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        // Src should remain as placeholder on error
        expect(result.current.src).toBe('/placeholder.jpg');
      });
    });

    it('logs warning on load failure', async () => {
      const { result } = renderHook(() =>
        useProgressiveImage('/broken.jpg')
      );

      await act(async () => {
        await result.current.loadImage();
      });

      await waitFor(() => {
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'ui',
          'Progressive image loading failed',
          expect.objectContaining({
            src: '/broken.jpg',
          })
        );
      });
    });
  });
});
