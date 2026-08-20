/**
 * Performance Optimization Hooks
 *
 * Collection of React hooks for optimizing component performance,
 * memory usage, and rendering efficiency.
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Advanced memoization hook with deep comparison
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T } | undefined>(undefined);
  
  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory()
    };
  }
  
  return ref.current.value;
}

/**
 * Deep equality comparison function
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  
  return false;
}

/**
 * Optimized event handler hook that prevents unnecessary re-renders
 */
export function useEventCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);

  // BUG FIX: useEffect was missing dependency array, causing unnecessary re-runs
  useEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}

/**
 * Debounced state hook for performance-critical inputs
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return [value, debouncedValue, setValue];
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: any[]) => {
    if (!isMountedRef.current) return;

    const now = Date.now();

    if (now - lastCallTime.current >= delay) {
      lastCallTime.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          lastCallTime.current = Date.now();
          callback(...args);
        }
      }, delay - (now - lastCallTime.current));
    }
  }, [callback, delay]) as T;
}

/**
 * Virtualized list hook for large datasets
 */
export function useVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    setScrollTop
  };
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<Element | null>(null);
  
  useEffect(() => {
    if (!node) return;

    let isMounted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isMounted) {
          setEntry(entry);
        }
      },
      options
    );

    observer.observe(node);

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, [node, options]);
  
  return [setNode, entry] as const;
}

/**
 * Performance measurement hook
 */
export function usePerformanceMeasure(name: string, deps: React.DependencyList = []) {
  const startTime = useRef<number>(0);
  const [measurements, setMeasurements] = useState<number[]>([]);
  
  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      
      setMeasurements(prev => [...prev.slice(-9), duration]); // Keep last 10 measurements

      if (process.env.NODE_ENV === 'development') {
        logger.debug('ui', `Performance measurement for ${name}`, { duration, name });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps array is intentionally dynamic, name is used inside the tracking function
  }, deps);
  
  const averageTime = useMemo(() => {
    return measurements.length > 0 
      ? measurements.reduce((sum, time) => sum + time, 0) / measurements.length 
      : 0;
  }, [measurements]);
  
  return { measurements, averageTime };
}

/**
 * Memory usage monitoring hook
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }
    };
    
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
}

/**
 * Component render count tracking hook
 */
export function useRenderCount(componentName: string = 'Component') {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current++;

    if (process.env.NODE_ENV === 'development') {
      logger.debug('ui', `Component render count for ${componentName}`, { renderCount: renderCount.current, componentName });
    }
  });

  return renderCount.current;
}

/**
 * Optimized selector hook for complex state
 */
export function useSelector<T, R>(
  source: T,
  selector: (source: T) => R,
  equalityFn: (a: R, b: R) => boolean = Object.is
): R {
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);
  const [selectedValue, setSelectedValue] = useState(() => selector(source));
  
  // BUG FIX: useEffect was missing dependency array, causing unnecessary re-runs
  useEffect(() => {
    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;
  }, [selector, equalityFn]);

  useEffect(() => {
    const newValue = selectorRef.current(source);
    if (!equalityFnRef.current(selectedValue, newValue)) {
      setSelectedValue(newValue);
    }
  }, [source, selectedValue]);
  
  return selectedValue;
}

/**
 * Batch updates hook to reduce re-renders
 */
export function useBatchedUpdates() {
  const [_updates, setUpdates] = useState<Array<() => void>>([]);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const scheduleUpdate = useCallback((update: () => void) => {
    setUpdates(prev => [...prev, update]);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setUpdates(currentUpdates => {
        currentUpdates.forEach(update => update());
        return [];
      });
    }, 0);
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return scheduleUpdate;
}

/**
 * Optimized list operations hook
 */
export function useOptimizedList<T>(
  initialItems: T[] = [],
  keySelector: (item: T, index: number) => string | number = (_, index) => index
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const itemsMapRef = useRef<Map<string | number, T>>(new Map());
  
  // Update the map whenever items change
  useEffect(() => {
    const newMap = new Map<string | number, T>();
    items.forEach((item, index) => {
      const key = keySelector(item, index);
      newMap.set(key, item);
    });
    itemsMapRef.current = newMap;
  }, [items, keySelector]);
  
  const addItem = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);
  
  const removeItem = useCallback((key: string | number) => {
    setItems(prev => prev.filter((item, index) => keySelector(item, index) !== key));
  }, [keySelector]);
  
  const updateItem = useCallback((key: string | number, updater: (item: T) => T) => {
    setItems(prev => prev.map((item, index) => 
      keySelector(item, index) === key ? updater(item) : item
    ));
  }, [keySelector]);
  
  const findItem = useCallback((key: string | number): T | undefined => {
    return itemsMapRef.current.get(key);
  }, []);
  
  const hasItem = useCallback((key: string | number): boolean => {
    return itemsMapRef.current.has(key);
  }, []);
  
  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    findItem,
    hasItem
  };
}

/**
 * Component size monitoring hook
 */
export function useComponentSize() {
  const ref = useRef<HTMLElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (!ref.current) return;

    let isMounted = true;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry && isMounted) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(ref.current);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
    };
  }, []);
  
  return [ref, size] as const;
}

export default {
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
};