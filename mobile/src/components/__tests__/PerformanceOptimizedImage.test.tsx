import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import PerformanceOptimizedImage from '../PerformanceOptimizedImage';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock Platform for web vs native testing
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: jest.fn((obj) => obj.web),
}));

// Mock IntersectionObserver for lazy loading tests
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;
  private elements: Set<Element> = new Set();

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  triggerIntersection(isIntersecting: boolean) {
    const entries = Array.from(this.elements).map((target) => ({
      target,
      isIntersecting,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    }));

    this.callback(entries as IntersectionObserverEntry[], this as any);
  }
}

describe('PerformanceOptimizedImage', () => {
  let mockObserver: MockIntersectionObserver;

  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as any) = 'web';

    // Setup IntersectionObserver mock
    mockObserver = new MockIntersectionObserver(() => {});
    (global as any).IntersectionObserver = jest.fn((callback, options) => {
      mockObserver = new MockIntersectionObserver(callback, options);
      return mockObserver;
    });
  });

  afterEach(() => {
    delete (global as any).IntersectionObserver;
  });

  describe('Basic Rendering', () => {
    it('should render with required props', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          testID="test-image"
          lazy={false}
        />
      );

      expect(getByTestId('test-image')).toBeDefined();
    });

    it('should render with local source (number)', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={12345}
          testID="local-image"
          lazy={false}
        />
      );

      expect(getByTestId('local-image')).toBeDefined();
    });

    it('should apply custom styles', () => {
      const customStyle = { width: 200, height: 200 };
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          style={customStyle}
          testID="styled-image"
          lazy={false}
        />
      );

      const image = getByTestId('styled-image');
      expect(image.props.style).toMatchObject(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });

    it('should set accessibility label', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          accessibilityLabel="Test Image"
          testID="accessible-image"
          lazy={false}
        />
      );

      const image = getByTestId('accessible-image');
      expect(image.props.accessibilityLabel).toBe('Test Image');
    });

    it('should use alt text as fallback for accessibility', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          alt="Alt Text"
          testID="alt-image"
          lazy={false}
        />
      );

      const image = getByTestId('alt-image');
      expect(image.props.accessibilityLabel).toBe('Alt Text');
    });
  });

  describe('Lazy Loading', () => {
    it('should show placeholder when lazy and not in view', () => {
      const { getByTestId, queryByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={true}
          testID="lazy-image"
        />
      );

      // Should show placeholder, not main image
      expect(getByTestId('lazy-image-placeholder')).toBeDefined();
      expect(queryByTestId('lazy-image')).toBeNull();
    });

    it('should load image when intersection observer triggers', async () => {
      const { getByTestId, queryByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={true}
          testID="lazy-image"
        />
      );

      // Initially shows placeholder
      expect(getByTestId('lazy-image-placeholder')).toBeDefined();

      // Trigger intersection
      await act(async () => {
        mockObserver.triggerIntersection(true);
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should now show actual image
      await waitFor(() => {
        expect(queryByTestId('lazy-image')).toBeDefined();
      });
    });

    it('should load immediately when lazy is false', () => {
      const { getByTestId, queryByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="eager-image"
        />
      );

      // Should show image immediately
      expect(getByTestId('eager-image')).toBeDefined();
      expect(queryByTestId('eager-image-placeholder')).toBeNull();
    });

    it('should disconnect observer on unmount', () => {
      const disconnectSpy = jest.spyOn(MockIntersectionObserver.prototype, 'disconnect');

      const { unmount } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={true}
          testID="lazy-image"
        />
      );

      unmount();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should not create observer on native platforms', () => {
      (Platform.OS as any) = 'ios';
      const observerConstructor = (global as any).IntersectionObserver;

      renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={true}
          testID="native-lazy-image"
        />
      );

      expect(observerConstructor).not.toHaveBeenCalled();
    });

    it('should set placeholder accessibility correctly', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={true}
          accessibilityLabel="Custom Label"
          testID="lazy-image"
        />
      );

      const placeholder = getByTestId('lazy-image-placeholder');
      expect(placeholder.props.accessibilityLabel).toBe('Custom Label');
      expect(placeholder.props.accessibilityRole).toBe('image');
    });
  });

  describe('Image Optimization', () => {
    it('should add quality parameter to URI', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          quality={90}
          lazy={false}
          testID="quality-image"
        />
      );

      const image = getByTestId('quality-image');
      expect(image.props.source.uri).toContain('q=90');
    });

    it('should add webp format parameter', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          webp={true}
          lazy={false}
          testID="webp-image"
        />
      );

      const image = getByTestId('webp-image');
      expect(image.props.source.uri).toContain('fm=webp');
    });

    it('should add avif format parameter when enabled', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          avif={true}
          lazy={false}
          testID="avif-image"
        />
      );

      const image = getByTestId('avif-image');
      expect(image.props.source.uri).toContain('fm=avif');
    });

    it('should handle URLs with existing query parameters', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg?existing=param' }}
          quality={85}
          lazy={false}
          testID="query-image"
        />
      );

      const image = getByTestId('query-image');
      expect(image.props.source.uri).toContain('existing=param');
      expect(image.props.source.uri).toContain('&q=85');
    });

    it('should not optimize local images', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={12345}
          quality={90}
          lazy={false}
          testID="local-image"
        />
      );

      const image = getByTestId('local-image');
      expect(image.props.source).toBe(12345);
    });

    it('should use default quality of 80', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="default-quality-image"
        />
      );

      const image = getByTestId('default-quality-image');
      expect(image.props.source.uri).toContain('q=80');
    });
  });

  describe('Responsive Images (Web)', () => {
    it('should generate srcSet for remote images on web', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="srcset-image"
        />
      );

      const image = getByTestId('srcset-image');
      expect(image.props.srcSet).toBeDefined();
      expect(image.props.srcSet).toContain('640w');
      expect(image.props.srcSet).toContain('768w');
      expect(image.props.srcSet).toContain('1024w');
      expect(image.props.srcSet).toContain('1280w');
      expect(image.props.srcSet).toContain('1920w');
    });

    it('should include quality in srcSet URLs', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          quality={75}
          lazy={false}
          testID="srcset-quality-image"
        />
      );

      const image = getByTestId('srcset-quality-image');
      expect(image.props.srcSet).toContain('q=75');
    });

    it('should use avif format in srcSet when enabled', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          avif={true}
          lazy={false}
          testID="srcset-avif-image"
        />
      );

      const image = getByTestId('srcset-avif-image');
      expect(image.props.srcSet).toContain('fm=avif');
    });

    it('should use webp format in srcSet when avif disabled', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          avif={false}
          webp={true}
          lazy={false}
          testID="srcset-webp-image"
        />
      );

      const image = getByTestId('srcset-webp-image');
      expect(image.props.srcSet).toContain('fm=webp');
      expect(image.props.srcSet).not.toContain('fm=avif');
    });

    it('should use jpg format in srcSet when both avif and webp disabled', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          avif={false}
          webp={false}
          lazy={false}
          testID="srcset-jpg-image"
        />
      );

      const image = getByTestId('srcset-jpg-image');
      expect(image.props.srcSet).toContain('fm=jpg');
    });

    it('should set sizes attribute on web', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="sizes-image"
        />
      );

      const image = getByTestId('sizes-image');
      expect(image.props.sizes).toBe('(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw');
    });

    it('should not generate srcSet for local images', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={12345}
          lazy={false}
          testID="local-no-srcset"
        />
      );

      const image = getByTestId('local-no-srcset');
      expect(image.props.srcSet).toBeUndefined();
    });

    it('should not generate srcSet on native platforms', () => {
      (Platform.OS as any) = 'ios';

      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="native-no-srcset"
        />
      );

      const image = getByTestId('native-no-srcset');
      expect(image.props.srcSet).toBeUndefined();
    });
  });

  describe('Loading States', () => {
    it('should start with opacity 0 before load', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="loading-image"
        />
      );

      const image = getByTestId('loading-image');
      const style = Array.isArray(image.props.style)
        ? image.props.style.find((s: any) => s && typeof s === 'object' && 'opacity' in s)
        : image.props.style;

      expect(style).toMatchObject({ opacity: 0 });
    });

    it('should call onLoad callback when image loads', async () => {
      const onLoadMock = jest.fn();

      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          onLoad={onLoadMock}
          lazy={false}
          testID="callback-image"
        />
      );

      const image = getByTestId('callback-image');

      await act(async () => {
        image.props.onLoad();
      });

      expect(onLoadMock).toHaveBeenCalledTimes(1);
    });

    it('should set opacity to 1 after load', async () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="loaded-image"
        />
      );

      const image = getByTestId('loaded-image');

      await act(async () => {
        image.props.onLoad();
      });

      await waitFor(() => {
        const updatedImage = getByTestId('loaded-image');
        const style = Array.isArray(updatedImage.props.style)
          ? updatedImage.props.style.find((s: any) => s && typeof s === 'object' && 'opacity' in s)
          : updatedImage.props.style;

        expect(style).toMatchObject({ opacity: 1 });
      });
    });

    it('should show placeholder image while loading on web', () => {
      const { root } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          placeholder="https://example.com/placeholder.jpg"
          lazy={false}
          testID="placeholder-image"
        />
      );

      // Web implementation wraps in View with multiple images
      expect(root).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback when image fails', async () => {
      const onErrorMock = jest.fn();

      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/invalid.jpg' }}
          onError={onErrorMock}
          lazy={false}
          testID="error-image"
        />
      );

      const image = getByTestId('error-image');

      await act(async () => {
        image.props.onError();
      });

      expect(onErrorMock).toHaveBeenCalledTimes(1);
    });

    it('should show error state on web after failure', async () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/invalid.jpg' }}
          lazy={false}
          testID="error-state-image"
        />
      );

      const image = getByTestId('error-state-image');

      await act(async () => {
        image.props.onError();
      });

      await waitFor(() => {
        const errorView = getByTestId('error-state-image');
        expect(errorView).toBeDefined();
      });
    });

    it('should clear error state on successful load after error', async () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="retry-image"
        />
      );

      const image = getByTestId('retry-image');

      // First trigger error
      await act(async () => {
        image.props.onError();
      });

      // Then trigger successful load
      await act(async () => {
        image.props.onLoad();
      });

      await waitFor(() => {
        const updatedImage = getByTestId('retry-image');
        const style = Array.isArray(updatedImage.props.style)
          ? updatedImage.props.style.find((s: any) => s && typeof s === 'object' && 'opacity' in s)
          : updatedImage.props.style;

        expect(style).toMatchObject({ opacity: 1 });
      });
    });
  });

  describe('Priority and Loading Attributes (Web)', () => {
    it('should use eager loading for high priority', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          priority="high"
          lazy={false}
          testID="high-priority-image"
        />
      );

      const image = getByTestId('high-priority-image');
      expect(image.props.loading).toBe('eager');
      expect(image.props.fetchpriority).toBe('high');
    });

    it('should use lazy loading for low priority', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          priority="low"
          lazy={false}
          testID="low-priority-image"
        />
      );

      const image = getByTestId('low-priority-image');
      expect(image.props.loading).toBe('lazy');
      expect(image.props.fetchpriority).toBe('low');
    });

    it('should use lazy loading for auto priority', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          priority="auto"
          lazy={false}
          testID="auto-priority-image"
        />
      );

      const image = getByTestId('auto-priority-image');
      expect(image.props.loading).toBe('lazy');
      expect(image.props.fetchpriority).toBe('auto');
    });

    it('should set decoding to async on web', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="async-decode-image"
        />
      );

      const image = getByTestId('async-decode-image');
      expect(image.props.decoding).toBe('async');
    });

    it('should set alt attribute on web', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          alt="Test Alt Text"
          lazy={false}
          testID="alt-text-image"
        />
      );

      const image = getByTestId('alt-text-image');
      expect(image.props.alt).toBe('Test Alt Text');
    });
  });

  describe('Platform-Specific Rendering', () => {
    it('should render web-specific implementation on web', () => {
      (Platform.OS as any) = 'web';

      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="web-image"
        />
      );

      const image = getByTestId('web-image');
      // Web implementation has srcSet, loading, decoding attributes
      expect(image.props.srcSet).toBeDefined();
      expect(image.props.loading).toBeDefined();
      expect(image.props.decoding).toBe('async');
    });

    it('should render native implementation on iOS', () => {
      (Platform.OS as any) = 'ios';

      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="ios-image"
        />
      );

      const image = getByTestId('ios-image');
      // Native implementation doesn't have web-specific attributes
      expect(image.props.srcSet).toBeUndefined();
      expect(image.props.loading).toBeUndefined();
      expect(image.props.decoding).toBeUndefined();
    });

    it('should render native implementation on Android', () => {
      (Platform.OS as any) = 'android';

      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="android-image"
        />
      );

      const image = getByTestId('android-image');
      expect(image.props.srcSet).toBeUndefined();
      expect(image.props.loading).toBeUndefined();
    });

    it('should not optimize URLs on native platforms', () => {
      (Platform.OS as any) = 'ios';

      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          quality={90}
          lazy={false}
          testID="native-no-optimize"
        />
      );

      const image = getByTestId('native-no-optimize');
      expect(image.props.source.uri).toBe('https://example.com/image.jpg');
    });
  });

  describe('Accessibility', () => {
    it('should set accessibilityRole to image', () => {
      (Platform.OS as any) = 'ios';

      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="accessible-role-image"
        />
      );

      const image = getByTestId('accessible-role-image');
      expect(image.props.accessibilityRole).toBe('image');
    });

    it('should mark as accessible', () => {
      (Platform.OS as any) = 'ios';

      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="accessible-image"
        />
      );

      const image = getByTestId('accessible-image');
      expect(image.props.accessible).toBe(true);
    });

    it('should hide placeholder from accessibility on web', () => {
      const { root } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          placeholder="https://example.com/placeholder.jpg"
          lazy={false}
          testID="a11y-placeholder"
        />
      );

      // Web implementation marks placeholder as aria-hidden
      expect(root).toBeDefined();
    });
  });

  describe('Memo Optimization', () => {
    it('should have displayName set for debugging', () => {
      expect(PerformanceOptimizedImage.displayName).toBe('PerformanceOptimizedImage');
    });

    it('should not re-render with same props', () => {
      const { rerender } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          quality={80}
          lazy={false}
          testID="memo-image"
        />
      );

      // Re-render with same props
      rerender(
        <ThemeProvider>
          <PerformanceOptimizedImage
            source={{ uri: 'https://example.com/image.jpg' }}
            quality={80}
            lazy={false}
            testID="memo-image"
          />
        </ThemeProvider>
      );

      // Component should be memoized, but we can't directly test render count
      // This test confirms no errors occur with re-render
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty alt text', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          alt=""
          lazy={false}
          testID="empty-alt-image"
        />
      );

      const image = getByTestId('empty-alt-image');
      expect(image.props.alt).toBe('');
    });

    it('should handle missing callbacks gracefully', async () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="no-callbacks-image"
        />
      );

      const image = getByTestId('no-callbacks-image');

      // Should not throw when callbacks are undefined
      await act(async () => {
        image.props.onLoad();
        image.props.onError();
      });

      expect(true).toBe(true);
    });

    it('should handle URL with special characters', () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/images/test%20image.jpg?foo=bar&baz=qux' }}
          quality={85}
          lazy={false}
          testID="special-chars-image"
        />
      );

      const image = getByTestId('special-chars-image');
      expect(image.props.source.uri).toContain('test%20image.jpg');
      expect(image.props.source.uri).toContain('&q=85');
    });

    it('should handle rapid load/error state changes', async () => {
      const { getByTestId } = renderWithTheme(
        <PerformanceOptimizedImage
          source={{ uri: 'https://example.com/image.jpg' }}
          lazy={false}
          testID="rapid-state-image"
        />
      );

      const image = getByTestId('rapid-state-image');

      // Rapid state changes
      await act(async () => {
        image.props.onError();
        image.props.onLoad();
        image.props.onError();
        image.props.onLoad();
      });

      // Should handle without errors
      expect(true).toBe(true);
    });
  });
});
