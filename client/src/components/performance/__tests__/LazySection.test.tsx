/**
 * Tests for LazySection.tsx - Lazy loading with IntersectionObserver
 * Following boundary mocking pattern: mock only IntersectionObserver
 */

import React, { useState } from 'react';
import { render, waitFor, act } from '@testing-library/react';
import LazySection, { LazyScript, useIntersectionObserver } from '../LazySection';

// Mock IntersectionObserver
let mockObserver: MockIntersectionObserver;

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  elements: Set<Element> = new Set();

  constructor(callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {
    this.callback = callback;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockObserver = this;
  }

  observe = jest.fn((element: Element) => {
    this.elements.add(element);
  });

  unobserve = jest.fn((element: Element) => {
    this.elements.delete(element);
  });

  disconnect = jest.fn(() => {
    this.elements.clear();
  });

  triggerIntersection(isIntersecting: boolean) {
    const entries: Partial<IntersectionObserverEntry>[] = Array.from(this.elements).map(target => ({
      isIntersecting,
      target,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    }));

    this.callback(entries as IntersectionObserverEntry[], this as any);
  }
}

global.IntersectionObserver = MockIntersectionObserver as any;

describe('LazySection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders fallback initially', () => {
      const { getByText, queryByText } = render(
        <LazySection fallback={<div>Loading...</div>}>
          <div>Content</div>
        </LazySection>
      );

      expect(getByText('Loading...')).toBeInTheDocument();
      expect(queryByText('Content')).not.toBeInTheDocument();
    });

    it('renders without fallback if none provided', () => {
      const { container, queryByText } = render(
        <LazySection>
          <div>Content</div>
        </LazySection>
      );

      expect(container).toBeInTheDocument();
      expect(queryByText('Content')).not.toBeInTheDocument();
    });

    it('applies custom className to wrapper', () => {
      const { container } = render(
        <LazySection className="custom-class">
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('IntersectionObserver setup', () => {
    it('creates observer on mount', () => {
      render(
        <LazySection>
          <div>Content</div>
        </LazySection>
      );

      expect(mockObserver.observe).toHaveBeenCalled();
    });

    it('uses custom rootMargin', () => {
      render(
        <LazySection rootMargin="100px">
          <div>Content</div>
        </LazySection>
      );

      expect(mockObserver.options?.rootMargin).toBe('100px');
    });

    it('uses custom threshold', () => {
      render(
        <LazySection threshold={0.5}>
          <div>Content</div>
        </LazySection>
      );

      expect(mockObserver.options?.threshold).toBe(0.5);
    });
  });

  describe('Intersection behavior', () => {
    it('shows content when intersecting', async () => {
      const { getByText, queryByText } = render(
        <LazySection>
          <div>Content</div>
        </LazySection>
      );

      expect(queryByText('Content')).not.toBeInTheDocument();

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      await waitFor(() => {
        expect(getByText('Content')).toBeInTheDocument();
      });
    });

    it('removes fallback when content shows', async () => {
      const { getByText, queryByText } = render(
        <LazySection fallback={<div>Loading...</div>}>
          <div>Content</div>
        </LazySection>
      );

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      await waitFor(() => {
        expect(queryByText('Loading...')).not.toBeInTheDocument();
        expect(getByText('Content')).toBeInTheDocument();
      });
    });

    it('applies opacity classes for transition', () => {
      const { container } = render(
        <LazySection>
          <div>Content</div>
        </LazySection>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('opacity-0');

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      expect(wrapper).toHaveClass('opacity-100');
    });
  });

  describe('Delay functionality', () => {
    it('delays content display when delay is set', async () => {
      const { queryByText } = render(
        <LazySection delay={1000}>
          <div>Content</div>
        </LazySection>
      );

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      // Content should not appear immediately
      expect(queryByText('Content')).not.toBeInTheDocument();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(queryByText('Content')).toBeInTheDocument();
      });
    });

    it('shows content immediately when delay is 0', () => {
      const { queryByText } = render(
        <LazySection delay={0}>
          <div>Content</div>
        </LazySection>
      );

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      expect(queryByText('Content')).toBeInTheDocument();
    });

    it('clears timeout on unmount', () => {
      const { unmount } = render(
        <LazySection delay={1000}>
          <div>Content</div>
        </LazySection>
      );

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      // Should not throw error
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('TriggerOnce behavior', () => {
    it('unobserves after first intersection when triggerOnce is true', () => {
      render(
        <LazySection triggerOnce={true}>
          <div>Content</div>
        </LazySection>
      );

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      expect(mockObserver.unobserve).toHaveBeenCalled();
    });

    it('keeps observing when triggerOnce is false', () => {
      render(
        <LazySection triggerOnce={false}>
          <div>Content</div>
        </LazySection>
      );

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      expect(mockObserver.unobserve).not.toHaveBeenCalled();
    });

    it('changes opacity when leaving viewport if triggerOnce is false', async () => {
      const { container, queryByText } = render(
        <LazySection triggerOnce={false}>
          <div>Content</div>
        </LazySection>
      );

      const wrapper = container.firstChild as HTMLElement;

      // Show content
      act(() => {
        mockObserver.triggerIntersection(true);
      });

      await waitFor(() => {
        expect(queryByText('Content')).toBeInTheDocument();
        expect(wrapper).toHaveClass('opacity-100');
      });

      // Content stays in DOM but opacity changes when not intersecting
      act(() => {
        mockObserver.triggerIntersection(false);
      });

      await waitFor(() => {
        expect(queryByText('Content')).toBeInTheDocument(); // Still in DOM
        expect(wrapper).toHaveClass('opacity-0'); // But hidden via opacity
      });
    });
  });

  describe('Cleanup', () => {
    it('disconnects observer on unmount', () => {
      const { unmount } = render(
        <LazySection>
          <div>Content</div>
        </LazySection>
      );

      unmount();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('clears timeout on unmount if delay is set', () => {
      const { unmount } = render(
        <LazySection delay={1000}>
          <div>Content</div>
        </LazySection>
      );

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      expect(() => unmount()).not.toThrow();
    });
  });
});

describe('useIntersectionObserver hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('returns elementRef and isVisible', () => {
      const TestComponent = () => {
        const { elementRef, isVisible } = useIntersectionObserver();
        return (
          <div>
            <div ref={elementRef} data-testid="observed" />
            <div data-testid="visible">{isVisible ? 'Visible' : 'Hidden'}</div>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      expect(getByTestId('observed')).toBeInTheDocument();
      expect(getByTestId('visible')).toHaveTextContent('Hidden');
    });

    it('sets isVisible to true when element intersects', async () => {
      const TestComponent = () => {
        const { elementRef, isVisible } = useIntersectionObserver();
        return (
          <div>
            <div ref={elementRef} />
            <div data-testid="status">{isVisible ? 'Visible' : 'Hidden'}</div>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      await waitFor(() => {
        expect(getByTestId('status')).toHaveTextContent('Visible');
      });
    });
  });

  describe('Configuration options', () => {
    it('creates observer with custom rootMargin', () => {
      const TestComponent = () => {
        const { elementRef } = useIntersectionObserver('100px');
        return <div ref={elementRef} />;
      };

      render(<TestComponent />);

      expect(mockObserver.options?.rootMargin).toBe('100px');
    });

    it('creates observer with custom threshold', () => {
      const TestComponent = () => {
        const { elementRef } = useIntersectionObserver('0px', 0.5);
        return <div ref={elementRef} />;
      };

      render(<TestComponent />);

      expect(mockObserver.options?.threshold).toBe(0.5);
    });
  });

  describe('TriggerOnce behavior', () => {
    it('unobserves element when triggerOnce is true', async () => {
      const TestComponent = () => {
        const { elementRef } = useIntersectionObserver('0px', 0.1, true);
        return <div ref={elementRef} />;
      };

      render(<TestComponent />);

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      await waitFor(() => {
        expect(mockObserver.unobserve).toHaveBeenCalled();
      });
    });

    it('keeps observing when triggerOnce is false', () => {
      const TestComponent = () => {
        const { elementRef } = useIntersectionObserver('0px', 0.1, false);
        return <div ref={elementRef} />;
      };

      render(<TestComponent />);

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      expect(mockObserver.unobserve).not.toHaveBeenCalled();
    });

    it('tracks visibility changes when triggerOnce is false', async () => {
      const TestComponent = () => {
        const { elementRef, isVisible } = useIntersectionObserver('0px', 0.1, false);
        return (
          <div>
            <div ref={elementRef} />
            <div data-testid="status">{isVisible ? 'Visible' : 'Hidden'}</div>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      act(() => {
        mockObserver.triggerIntersection(true);
      });

      await waitFor(() => {
        expect(getByTestId('status')).toHaveTextContent('Visible');
      });

      act(() => {
        mockObserver.triggerIntersection(false);
      });

      await waitFor(() => {
        expect(getByTestId('status')).toHaveTextContent('Hidden');
      });
    });
  });

  describe('Cleanup', () => {
    it('disconnects observer on unmount', () => {
      const TestComponent = () => {
        const { elementRef } = useIntersectionObserver();
        return <div ref={elementRef} />;
      };

      const { unmount } = render(<TestComponent />);

      unmount();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });
});

describe('LazyScript', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Script loading', () => {
    it('creates script element with correct src', () => {
      render(<LazyScript src="https://example.com/script.js" />);

      // Trigger intersection to load script
      act(() => {
        mockObserver.triggerIntersection(true);
      });

      const script = document.querySelector('script[src="https://example.com/script.js"]');
      expect(script).toBeInTheDocument();
    });

    it('does not create script until visible', () => {
      render(<LazyScript src="https://example.com/script.js" />);

      // Script should not exist yet
      expect(document.querySelector('script')).not.toBeInTheDocument();

      // Trigger intersection
      act(() => {
        mockObserver.triggerIntersection(true);
      });

      // Now script should exist
      expect(document.querySelector('script')).toBeInTheDocument();
    });
  });

  describe('Delay functionality', () => {
    it('delays script injection when delay is set', () => {
      render(<LazyScript src="https://example.com/script.js" delay={1000} />);

      // Trigger intersection first
      act(() => {
        mockObserver.triggerIntersection(true);
      });

      // Script should not be injected immediately even after intersection
      expect(document.querySelector('script')).not.toBeInTheDocument();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(document.querySelector('script')).toBeInTheDocument();
    });

    it('injects script immediately when delay is 0 and visible', () => {
      render(<LazyScript src="https://example.com/script.js" delay={0} />);

      // Trigger intersection
      act(() => {
        mockObserver.triggerIntersection(true);
      });

      expect(document.querySelector('script')).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls onLoad when script loads', () => {
      const onLoad = jest.fn();
      render(<LazyScript src="https://example.com/script.js" onLoad={onLoad} />);

      // Trigger intersection to load script
      act(() => {
        mockObserver.triggerIntersection(true);
      });

      const script = document.querySelector('script');
      act(() => {
        script?.dispatchEvent(new Event('load'));
      });

      expect(onLoad).toHaveBeenCalled();
    });

    it('calls onError when script fails to load', () => {
      const onError = jest.fn();
      render(<LazyScript src="https://example.com/script.js" onError={onError} />);

      // Trigger intersection to load script
      act(() => {
        mockObserver.triggerIntersection(true);
      });

      const script = document.querySelector('script');
      act(() => {
        script?.dispatchEvent(new Event('error'));
      });

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('removes script element on unmount', () => {
      const { unmount } = render(<LazyScript src="https://example.com/script.js" />);

      // Trigger intersection to load script
      act(() => {
        mockObserver.triggerIntersection(true);
      });

      expect(document.querySelector('script')).toBeInTheDocument();

      unmount();

      expect(document.querySelector('script')).not.toBeInTheDocument();
    });

    it('clears timeout on unmount if delay is set', () => {
      const { unmount } = render(<LazyScript src="https://example.com/script.js" delay={1000} />);

      // Trigger intersection
      act(() => {
        mockObserver.triggerIntersection(true);
      });

      expect(() => unmount()).not.toThrow();
    });
  });
});
