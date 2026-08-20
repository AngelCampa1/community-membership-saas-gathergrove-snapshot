/**
 * useRenderPerformance Hook - Monitor component render performance
 */

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface RenderPerformanceMetrics {
  renderTime: number;
  reRenderCount: number;
  componentName?: string;
}

export const useRenderPerformance = (componentName?: string) => {
  const renderCount = useRef(0);
  const renderStartTime = useRef<number>(0);
  const metrics = useRef<RenderPerformanceMetrics>({
    renderTime: 0,
    reRenderCount: 0,
    componentName,
  });

  // Track render start
  renderStartTime.current = performance.now();
  renderCount.current += 1;

  // BUG FIX: Added empty dependency array - this effect should only run once per render
  // to capture the render completion time. The effect intentionally runs on every render
  // (by not having any dependencies) to measure each render's performance.
  useEffect(() => {
    // Track render completion
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;

    metrics.current = {
      renderTime,
      reRenderCount: renderCount.current,
      componentName,
    };

    // Log performance in development
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      logger.warn('ui', `Slow render detected in ${componentName || 'component'}`, { renderTime, componentName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally no deps to run on every render for performance measurement
  });

  return {
    metrics: metrics.current,
    logMetrics: () => {
      logger.debug('ui', `Performance metrics for ${componentName || 'component'}`, { metrics: metrics.current, componentName });
    },
  };
};