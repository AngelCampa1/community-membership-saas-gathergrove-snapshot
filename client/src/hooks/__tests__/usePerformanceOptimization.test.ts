import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useDeepMemo,
  useEventCallback,
  useDebouncedState,
  useThrottledCallback,
  useVirtualizedList,
  useIntersectionObserver,
  usePerformanceMeasure,
  useMemoryMonitor,
  useRenderCount,
  useSelector,
  useBatchedUpdates,
  useOptimizedList,
  useComponentSize
} from '../usePerformanceOptimization';

// Mock logger
jest.mock('@/lib/logger');

describe('usePerformanceOptimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useDeepMemo', () => {
    it('should memoize value on initial render', () => {
      const factory = jest.fn(() => ({ a: 1, b: 2 }));
      const { result } = renderHook(() => useDeepMemo(factory, [1, 2]));

      expect(factory).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual({ a: 1, b: 2 });
    });

    it('should not re-compute when deps are deeply equal', () => {
      const factory = jest.fn(() => ({ a: 1, b: 2 }));
      const { result, rerender } = renderHook(
        ({ deps }) => useDeepMemo(factory, deps),
        { initialProps: { deps: [{ x: 1 }, { y: 2 }] } }
      );

      expect(factory).toHaveBeenCalledTimes(1);
      const firstResult = result.current;

      // Rerender with deeply equal but different object references
      rerender({ deps: [{ x: 1 }, { y: 2 }] });

      expect(factory).toHaveBeenCalledTimes(1); // Should not call factory again
      expect(result.current).toBe(firstResult); // Same reference
    });

    it('should re-compute when deps change deeply', () => {
      const factory = jest.fn(() => ({ a: 1, b: 2 }));
      const { result, rerender } = renderHook(
        ({ deps }) => useDeepMemo(factory, deps),
        { initialProps: { deps: [{ x: 1 }] } }
      );

      expect(factory).toHaveBeenCalledTimes(1);

      rerender({ deps: [{ x: 2 }] });

      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should handle primitive deps', () => {
      const factory = jest.fn(() => 'result');
      const { result, rerender } = renderHook(
        ({ deps }) => useDeepMemo(factory, deps),
        { initialProps: { deps: [1, 'test', true] } }
      );

      expect(factory).toHaveBeenCalledTimes(1);

      rerender({ deps: [1, 'test', true] });
      expect(factory).toHaveBeenCalledTimes(1);

      rerender({ deps: [1, 'test', false] });
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should handle array deps', () => {
      const factory = jest.fn(() => 'result');
      const { rerender } = renderHook(
        ({ deps }) => useDeepMemo(factory, deps),
        { initialProps: { deps: [[1, 2, 3]] } }
      );

      expect(factory).toHaveBeenCalledTimes(1);

      rerender({ deps: [[1, 2, 3]] });
      expect(factory).toHaveBeenCalledTimes(1);

      rerender({ deps: [[1, 2, 4]] });
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should handle nested object deps', () => {
      const factory = jest.fn(() => 'result');
      const { rerender } = renderHook(
        ({ deps }) => useDeepMemo(factory, deps),
        { initialProps: { deps: [{ a: { b: { c: 1 } } }] } }
      );

      expect(factory).toHaveBeenCalledTimes(1);

      rerender({ deps: [{ a: { b: { c: 1 } } }] });
      expect(factory).toHaveBeenCalledTimes(1);

      rerender({ deps: [{ a: { b: { c: 2 } } }] });
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should handle null and undefined in deps', () => {
      const factory = jest.fn(() => 'result');
      const { rerender } = renderHook(
        ({ deps }) => useDeepMemo(factory, deps),
        { initialProps: { deps: [null, undefined] } }
      );

      expect(factory).toHaveBeenCalledTimes(1);

      rerender({ deps: [null, undefined] });
      expect(factory).toHaveBeenCalledTimes(1);

      rerender({ deps: [null, null] });
      expect(factory).toHaveBeenCalledTimes(2);
    });
  });

  describe('useEventCallback', () => {
    it('should return stable callback reference', () => {
      const fn = jest.fn();
      const { result, rerender } = renderHook(() => useEventCallback(fn));

      const firstCallback = result.current;
      rerender();
      const secondCallback = result.current;

      expect(firstCallback).toBe(secondCallback);
    });

    it('should call the latest function', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();

      const { result, rerender } = renderHook(
        ({ fn }) => useEventCallback(fn),
        { initialProps: { fn: fn1 } }
      );

      result.current('test');
      expect(fn1).toHaveBeenCalledWith('test');
      expect(fn2).not.toHaveBeenCalled();

      rerender({ fn: fn2 });

      result.current('test2');
      expect(fn2).toHaveBeenCalledWith('test2');
    });

    it('should pass all arguments correctly', () => {
      const fn = jest.fn();
      const { result } = renderHook(() => useEventCallback(fn));

      result.current(1, 'two', { three: 3 });

      expect(fn).toHaveBeenCalledWith(1, 'two', { three: 3 });
    });
  });

  describe('useDebouncedState', () => {
    it('should initialize with initial value', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      const [value, debouncedValue] = result.current;
      expect(value).toBe('initial');
      expect(debouncedValue).toBe('initial');
    });

    it('should update immediate value immediately', () => {
      const { result } = renderHook(() => useDebouncedState('initial'));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      const [value, debouncedValue] = result.current;
      expect(value).toBe('updated');
      expect(debouncedValue).toBe('initial'); // Still old value
    });

    it('should update debounced value after delay', async () => {
      const { result } = renderHook(() => useDebouncedState('initial', 300));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(result.current[1]).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current[1]).toBe('updated');
      });
    });

    it('should reset timer on rapid updates', async () => {
      const { result } = renderHook(() => useDebouncedState('initial', 300));

      act(() => {
        const [, , setValue] = result.current;
        setValue('update1');
      });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      act(() => {
        const [, , setValue] = result.current;
        setValue('update2');
      });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      // Only 300ms total, debounced should still be 'initial'
      expect(result.current[1]).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(150); // Total 300ms from last update
      });

      await waitFor(() => {
        expect(result.current[1]).toBe('update2');
      });
    });

    it('should clean up timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useDebouncedState('initial', 300));

      act(() => {
        const [, , setValue] = result.current;
        setValue('updated');
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // No error should occur
      expect(true).toBe(true);
    });
  });

  describe('useThrottledCallback', () => {
    it('should call callback immediately on first call', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottledCallback(callback, 300));

      act(() => {
        result.current('test');
      });

      expect(callback).toHaveBeenCalledWith('test');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should throttle subsequent calls within delay', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottledCallback(callback, 300));

      act(() => {
        result.current('call1');
        result.current('call2');
        result.current('call3');
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('call1');
    });

    it('should call again after delay has passed', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottledCallback(callback, 300));

      act(() => {
        result.current('call1');
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current('call2');
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('call2');
    });

    it('should schedule final call if called during throttle period', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useThrottledCallback(callback, 300));

      act(() => {
        result.current('call1');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        result.current('call2');
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(200); // Total 300ms from first call
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('call2');
    });

    it('should not call after unmount', () => {
      const callback = jest.fn();
      const { result, unmount } = renderHook(() => useThrottledCallback(callback, 300));

      act(() => {
        result.current('call1');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        result.current('call2');
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(callback).toHaveBeenCalledTimes(1); // Only the first call
    });
  });

  describe('useVirtualizedList', () => {
    it('should calculate visible range correctly', () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const { result } = renderHook(() =>
        useVirtualizedList({
          items,
          itemHeight: 50,
          containerHeight: 500,
          overscan: 2
        })
      );

      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(12); // Math.ceil(500/50) + 2 overscan = 10 + 2
      expect(result.current.visibleItems.length).toBe(13); // Items 0-12 inclusive
      expect(result.current.totalHeight).toBe(5000); // 100 * 50
      expect(result.current.offsetY).toBe(0);
    });

    it('should update visible range on scroll', () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const { result } = renderHook(() =>
        useVirtualizedList({
          items,
          itemHeight: 50,
          containerHeight: 500,
          overscan: 2
        })
      );

      act(() => {
        result.current.setScrollTop(1000); // Scroll to 20th item
      });

      expect(result.current.startIndex).toBe(18); // Math.floor(1000/50) - 2 overscan = 20 - 2
      expect(result.current.endIndex).toBe(32); // Math.ceil(1500/50) + 2 overscan = 30 + 2
      expect(result.current.offsetY).toBe(900); // 18 * 50
    });

    it('should handle scroll to bottom', () => {
      const items = Array.from({ length: 100 }, (_, i) => i);
      const { result } = renderHook(() =>
        useVirtualizedList({
          items,
          itemHeight: 50,
          containerHeight: 500,
          overscan: 2
        })
      );

      act(() => {
        result.current.setScrollTop(4500); // Near bottom
      });

      expect(result.current.endIndex).toBe(99); // Clamped to last item
    });

    it('should handle empty items array', () => {
      const { result } = renderHook(() =>
        useVirtualizedList({
          items: [],
          itemHeight: 50,
          containerHeight: 500
        })
      );

      expect(result.current.visibleItems).toEqual([]);
      expect(result.current.totalHeight).toBe(0);
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(-1);
    });
  });

  describe('useIntersectionObserver', () => {
    let mockObserver: any;
    let observeCallback: IntersectionObserverCallback;

    beforeEach(() => {
      mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
        unobserve: jest.fn()
      };

      global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
        observeCallback = callback;
        return mockObserver;
      }) as any;
    });

    it('should initialize with null entry', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      const [, entry] = result.current;
      expect(entry).toBeNull();
    });

    it('should observe node when set', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      const mockElement = document.createElement('div');

      act(() => {
        const [setNode] = result.current;
        setNode(mockElement);
      });

      expect(mockObserver.observe).toHaveBeenCalledWith(mockElement);
    });

    it('should update entry when intersection occurs', () => {
      const { result } = renderHook(() => useIntersectionObserver());

      const mockElement = document.createElement('div');

      act(() => {
        const [setNode] = result.current;
        setNode(mockElement);
      });

      const mockEntry = {
        isIntersecting: true,
        target: mockElement,
        intersectionRatio: 1
      } as IntersectionObserverEntry;

      act(() => {
        observeCallback([mockEntry], mockObserver);
      });

      const [, entry] = result.current;
      expect(entry).toBe(mockEntry);
      expect(entry?.isIntersecting).toBe(true);
    });

    it('should disconnect observer on unmount', () => {
      const { result, unmount } = renderHook(() => useIntersectionObserver());

      const mockElement = document.createElement('div');

      act(() => {
        const [setNode] = result.current;
        setNode(mockElement);
      });

      unmount();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should pass options to IntersectionObserver', () => {
      const options = { threshold: 0.5, rootMargin: '10px' };
      const { result } = renderHook(() => useIntersectionObserver(options));

      const mockElement = document.createElement('div');

      act(() => {
        const [setNode] = result.current;
        setNode(mockElement);
      });

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        options
      );
    });
  });

  describe('usePerformanceMeasure', () => {
    it('should measure render duration', () => {
      // Need to provide changing deps to trigger measurement recording
      const { result, rerender } = renderHook(
        ({ count }) => usePerformanceMeasure('test', [count]),
        { initialProps: { count: 0 } }
      );

      // Trigger a re-render with new deps to record a measurement
      rerender({ count: 1 });

      expect(result.current.measurements.length).toBeGreaterThanOrEqual(1);
      expect(result.current.measurements[0]).toBeGreaterThanOrEqual(0);
    });

    it('should keep last 10 measurements', () => {
      const { rerender, result } = renderHook(
        ({ count }) => usePerformanceMeasure('test', [count]),
        { initialProps: { count: 0 } }
      );

      // Trigger 15 measurements
      for (let i = 1; i <= 15; i++) {
        rerender({ count: i });
      }

      expect(result.current.measurements.length).toBe(10);
    });

    it('should calculate average time correctly', () => {
      const { result, rerender } = renderHook(() => usePerformanceMeasure('test'));

      // Trigger a re-render to record a measurement
      rerender();

      if (result.current.measurements.length > 0) {
        expect(result.current.averageTime).toBe(result.current.measurements[0]);
      } else {
        // If no measurements yet, average should be 0
        expect(result.current.averageTime).toBe(0);
      }
    });

    it('should return 0 average for no measurements', () => {
      const { result } = renderHook(() => usePerformanceMeasure('test'));

      expect(result.current.averageTime).toBe(0);
    });
  });

  describe('useMemoryMonitor', () => {
    it('should return empty object when performance.memory is not available', () => {
      const { result } = renderHook(() => useMemoryMonitor());

      expect(result.current).toEqual({});
    });

    it('should update memory info when performance.memory is available', () => {
      const mockMemory = {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useMemoryMonitor());

      expect(result.current).toEqual(mockMemory);

      // Clean up
      delete (performance as any).memory;
    });

    it('should update memory info periodically', () => {
      const mockMemory = {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        writable: true,
        configurable: true
      });

      const { result } = renderHook(() => useMemoryMonitor());

      expect(result.current.usedJSHeapSize).toBe(1000000);

      // Update mock memory
      mockMemory.usedJSHeapSize = 1500000;

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.usedJSHeapSize).toBe(1500000);

      // Clean up
      delete (performance as any).memory;
    });

    it('should clean up interval on unmount', () => {
      const { unmount } = renderHook(() => useMemoryMonitor());

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('useRenderCount', () => {
    it('should start with render count of 0', () => {
      const { result } = renderHook(() => useRenderCount('TestComponent'));

      // First render increments to 1
      expect(result.current).toBe(0);
    });

    it('should increment on each render', () => {
      const { result, rerender } = renderHook(() => useRenderCount('TestComponent'));

      expect(result.current).toBe(0);

      rerender();
      expect(result.current).toBe(1);

      rerender();
      expect(result.current).toBe(2);
    });
  });

  describe('useSelector', () => {
    it('should select value from source', () => {
      const source = { a: 1, b: 2, c: 3 };
      const selector = (s: typeof source) => s.a + s.b;

      const { result } = renderHook(() => useSelector(source, selector));

      expect(result.current).toBe(3);
    });

    it('should not update when selected value is equal', () => {
      const { result, rerender } = renderHook(
        ({ source }) => useSelector(source, (s: any) => s.a),
        { initialProps: { source: { a: 1, b: 2 } } }
      );

      const firstRender = result.current;

      rerender({ source: { a: 1, b: 3 } }); // b changed but a is same

      expect(result.current).toBe(firstRender);
      expect(result.current).toBe(1);
    });

    it('should update when selected value changes', () => {
      const { result, rerender } = renderHook(
        ({ source }) => useSelector(source, (s: any) => s.a),
        { initialProps: { source: { a: 1 } } }
      );

      expect(result.current).toBe(1);

      rerender({ source: { a: 2 } });

      expect(result.current).toBe(2);
    });

    it('should use custom equality function', () => {
      const equalityFn = (a: number, b: number) => Math.abs(a - b) < 0.1;

      const { result, rerender } = renderHook(
        ({ source }) => useSelector(source, (s: any) => s.value, equalityFn),
        { initialProps: { source: { value: 1.0 } } }
      );

      expect(result.current).toBe(1.0);

      rerender({ source: { value: 1.05 } }); // Within threshold

      expect(result.current).toBe(1.0); // Should not update

      rerender({ source: { value: 1.2 } }); // Outside threshold

      expect(result.current).toBe(1.2); // Should update
    });
  });

  describe('useBatchedUpdates', () => {
    it('should batch multiple updates', async () => {
      const { result } = renderHook(() => useBatchedUpdates());

      const updates: number[] = [];

      act(() => {
        result.current(() => updates.push(1));
        result.current(() => updates.push(2));
        result.current(() => updates.push(3));
      });

      expect(updates).toEqual([]); // Not executed yet

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(updates).toEqual([1, 2, 3]);
      });
    });

    it('should clear timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useBatchedUpdates());

      act(() => {
        result.current(() => {});
      });

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('useOptimizedList', () => {
    interface TestItem {
      id: number;
      name: string;
    }

    it('should initialize with items', () => {
      const initialItems: TestItem[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      const { result } = renderHook(() =>
        useOptimizedList(initialItems, (item) => item.id)
      );

      expect(result.current.items).toEqual(initialItems);
    });

    it('should add item', () => {
      const { result } = renderHook(() =>
        useOptimizedList<TestItem>([], (item) => item.id)
      );

      act(() => {
        result.current.addItem({ id: 1, name: 'Item 1' });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual({ id: 1, name: 'Item 1' });
    });

    it('should remove item by key', () => {
      const initialItems: TestItem[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];

      const { result } = renderHook(() =>
        useOptimizedList(initialItems, (item) => item.id)
      );

      act(() => {
        result.current.removeItem(2);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items.find(item => item.id === 2)).toBeUndefined();
    });

    it('should update item by key', () => {
      const initialItems: TestItem[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      const { result } = renderHook(() =>
        useOptimizedList(initialItems, (item) => item.id)
      );

      act(() => {
        result.current.updateItem(1, (item) => ({ ...item, name: 'Updated Item 1' }));
      });

      expect(result.current.items[0].name).toBe('Updated Item 1');
    });

    it('should find item by key', () => {
      const initialItems: TestItem[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      const { result } = renderHook(() =>
        useOptimizedList(initialItems, (item) => item.id)
      );

      const found = result.current.findItem(2);

      expect(found).toEqual({ id: 2, name: 'Item 2' });
    });

    it('should check if item exists by key', () => {
      const initialItems: TestItem[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      const { result } = renderHook(() =>
        useOptimizedList(initialItems, (item) => item.id)
      );

      expect(result.current.hasItem(1)).toBe(true);
      expect(result.current.hasItem(3)).toBe(false);
    });

    it('should update map when items change', () => {
      const initialItems: TestItem[] = [
        { id: 1, name: 'Item 1' }
      ];

      const { result } = renderHook(() =>
        useOptimizedList(initialItems, (item) => item.id)
      );

      act(() => {
        result.current.addItem({ id: 2, name: 'Item 2' });
      });

      expect(result.current.hasItem(2)).toBe(true);
      expect(result.current.findItem(2)).toEqual({ id: 2, name: 'Item 2' });
    });

    it('should allow setting items directly', () => {
      const { result } = renderHook(() =>
        useOptimizedList<TestItem>([], (item) => item.id)
      );

      const newItems: TestItem[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      act(() => {
        result.current.setItems(newItems);
      });

      expect(result.current.items).toEqual(newItems);
    });
  });

  describe('useComponentSize', () => {
    let mockResizeObserver: any;
    let capturedCallback: ResizeObserverCallback | undefined;

    beforeEach(() => {
      capturedCallback = undefined;
      mockResizeObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
        unobserve: jest.fn()
      };

      global.ResizeObserver = jest.fn().mockImplementation((callback) => {
        capturedCallback = callback;
        return mockResizeObserver;
      }) as any;
    });

    it('should initialize with zero size', () => {
      const { result } = renderHook(() => useComponentSize());

      const [, size] = result.current;
      expect(size).toEqual({ width: 0, height: 0 });
    });

    it('should not create ResizeObserver when ref is null', () => {
      renderHook(() => useComponentSize());

      // ResizeObserver should not be created if ref.current is null
      expect(global.ResizeObserver).not.toHaveBeenCalled();
    });

    it('should return ref and size', () => {
      const { result } = renderHook(() => useComponentSize());

      const [ref, size] = result.current;

      expect(ref).toBeDefined();
      expect(ref).toHaveProperty('current');
      expect(size).toEqual({ width: 0, height: 0 });
    });

    it('should not throw error on unmount', () => {
      const { unmount } = renderHook(() => useComponentSize());

      expect(() => unmount()).not.toThrow();
    });
  });
});
