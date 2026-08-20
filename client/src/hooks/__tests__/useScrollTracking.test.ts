import { renderHook, act, waitFor } from '@testing-library/react';
import { useScrollTracking } from '../useScrollTracking';

jest.mock('@/constants/timing', () => ({
  SCROLL: {
    NEAR_TOP_THRESHOLD: 100,
    NEAR_BOTTOM_PERCENTAGE: 90,
  },
  DEBOUNCE_MS: {
    SCROLL: 150,
  },
}));

describe('useScrollTracking', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock window scrolling properties
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 2000,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with default scroll metrics', () => {
    const { result } = renderHook(() => useScrollTracking());

    expect(result.current.scrollMetrics).toEqual({
      scrollPercentage: 0,
      scrollDirection: null,
      isNearTop: true,
      isNearBottom: false,
      lastScrollY: 0,
    });
    expect(result.current.thresholdReached).toBe(false);
  });

  it('should update scroll metrics on scroll', async () => {
    const { result } = renderHook(() => useScrollTracking());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.scrollMetrics.scrollPercentage).toBeGreaterThan(0);
      expect(result.current.scrollMetrics.lastScrollY).toBe(600);
    });
  });

  it('should detect scroll direction down', async () => {
    const { result } = renderHook(() => useScrollTracking());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.scrollMetrics.scrollDirection).toBe('down');
      expect(result.current.isScrollingDown).toBe(true);
      expect(result.current.isScrollingUp).toBe(false);
    });
  });

  it('should call onThresholdReached when threshold is met', async () => {
    const onThresholdReached = jest.fn();
    
    renderHook(() => useScrollTracking({
      threshold: 50,
      onThresholdReached,
    }));

    act(() => {
      // Scroll to 50% (600px out of 1200px scrollable)
      Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(onThresholdReached).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  it('should call onScrollChange on every scroll', async () => {
    const onScrollChange = jest.fn();
    
    renderHook(() => useScrollTracking({
      onScrollChange,
    }));

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(onScrollChange).toHaveBeenCalledWith(expect.objectContaining({
        scrollPercentage: expect.any(Number),
        scrollDirection: expect.any(String),
      }));
    });
  });

  it('should detect near top', async () => {
    const { result } = renderHook(() => useScrollTracking());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.scrollMetrics.isNearTop).toBe(true);
    });
  });

  it('should detect not near top', async () => {
    const { result } = renderHook(() => useScrollTracking());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.scrollMetrics.isNearTop).toBe(false);
    });
  });

  it('should provide helper method isScrolledPast', async () => {
    const { result } = renderHook(() => useScrollTracking());

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 900, writable: true });
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.isScrolledPast(50)).toBe(true);
      expect(result.current.isScrolledPast(90)).toBe(false);
    });
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => useScrollTracking());
    
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should debounce scroll events', async () => {
    const onScrollChange = jest.fn();
    
    renderHook(() => useScrollTracking({
      debounceMs: 200,
      onScrollChange,
    }));

    // Rapidly trigger scroll events
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(50);
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(50);
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(50);
    });

    // Should not have been called yet (debounced)
    expect(onScrollChange).not.toHaveBeenCalled();

    // Complete debounce
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(onScrollChange).toHaveBeenCalledTimes(1);
    });
  });
});
