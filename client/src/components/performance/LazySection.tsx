'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export default function LazySection({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  className,
  triggerOnce = true,
  delay = 0,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let timeoutId: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (delay > 0) {
            timeoutId = setTimeout(() => {
              setIsVisible(true);
              setHasLoaded(true);
            }, delay);
          } else {
            setIsVisible(true);
            setHasLoaded(true);
          }

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    // BUG FIX: Cleanup both observer and timeout
    return () => {
      observer.disconnect();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [rootMargin, threshold, triggerOnce, delay]);

  return (
    <div 
      ref={elementRef} 
      className={cn(
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {hasLoaded || isVisible ? children : (fallback || <SectionSkeleton />)}
    </div>
  );
}

// Default skeleton for lazy sections
function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-8">
      <div className="h-8 bg-muted rounded-md w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/5"></div>
      </div>
      <div className="h-32 bg-muted rounded-lg"></div>
    </div>
  );
}

// Hook for intersection observer
export function useIntersectionObserver(
  rootMargin = '0px',
  threshold = 0.1,
  triggerOnce = true
) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    // BUG FIX: Use disconnect() instead of unobserve() for complete cleanup
    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce]);

  return { elementRef, isVisible };
}

// Component for lazy loading scripts
export function LazyScript({ 
  src, 
  onLoad, 
  onError,
  delay = 0
}: { 
  src: string; 
  onLoad?: () => void; 
  onError?: () => void;
  delay?: number;
}) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const { elementRef, isVisible } = useIntersectionObserver('100px');

  useEffect(() => {
    if (isVisible) {
      if (delay > 0) {
        const timeoutId = setTimeout(() => setShouldLoad(true), delay);
        return () => clearTimeout(timeoutId);
      } else {
        setShouldLoad(true);
      }
    }
  }, [isVisible, delay]);

  useEffect(() => {
    if (shouldLoad) {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = onLoad || (() => {});
      script.onerror = onError || (() => {});
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [shouldLoad, src, onLoad, onError]);

  return <div ref={elementRef} />;
}