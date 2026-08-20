/**
 * Accessibility Enhancer for US-004 Advanced Analytics Dashboard
 * Ensures enterprise-grade accessibility compliance and screen reader support
 */

import React, { useEffect, useRef } from 'react';

interface AccessibilityEnhancerProps {
  children: React.ReactNode;
  announceChanges?: boolean;
  enableKeyboardNavigation?: boolean;
  enableFocusManagement?: boolean;
}

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive' | 'off';
  clear?: boolean;
}

// Live region for screen reader announcements
const LiveRegion: React.FC<LiveRegionProps> = ({ 
  message, 
  priority = 'polite', 
  clear = false 
}) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regionRef.current) {
      if (clear) {
        regionRef.current.textContent = '';
        setTimeout(() => {
          if (regionRef.current) {
            regionRef.current.textContent = message;
          }
        }, 100);
      } else {
        regionRef.current.textContent = message;
      }
    }
  }, [message, clear]);

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      data-testid="accessibility-live-region"
    />
  );
};

// Keyboard navigation handler
const useKeyboardNavigation = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab navigation enhancement
      if (event.key === 'Tab') {
        // Ensure focus indicators are visible
        document.body.classList.add('keyboard-navigation');
      }

      // Skip links for screen readers
      if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target as HTMLElement;
        if (target.classList.contains('skip-link')) {
          event.preventDefault();
          const targetId = target.getAttribute('href')?.substring(1);
          if (targetId) {
            const targetElement = document.getElementById(targetId);
            targetElement?.focus();
          }
        }
      }

      // Chart navigation (arrow keys)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        const target = event.target as HTMLElement;
        if (target.closest('[role=\"img\"]') || target.closest('.chart-container')) {
          event.preventDefault();
          // Implement chart keyboard navigation
          announceChartNavigation(event.key, target);
        }
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enabled]);
};

// Chart navigation announcements
const announceChartNavigation = (key: string, element: HTMLElement) => {
  const chartType = element.getAttribute('data-chart-type') || 'chart';
  const currentValue = element.getAttribute('data-current-value') || 'unknown';
  
  let announcement = '';
  switch (key) {
    case 'ArrowRight':
      announcement = `Moving to next ${chartType} data point: ${currentValue}`;
      break;
    case 'ArrowLeft':
      announcement = `Moving to previous ${chartType} data point: ${currentValue}`;
      break;
    case 'ArrowUp':
    case 'ArrowDown':
      announcement = `Exploring ${chartType} data: ${currentValue}`;
      break;
  }

  if (announcement) {
    const liveRegion = document.querySelector('[data-testid=\"accessibility-live-region\"]');
    if (liveRegion) {
      liveRegion.textContent = announcement;
    }
  }
};

// Focus management for dynamic content
const useFocusManagement = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              
              // Focus management for modal dialogs
              if (element.getAttribute('role') === 'dialog' || 
                  element.classList.contains('modal')) {
                const firstFocusable = element.querySelector(
                  'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'
                ) as HTMLElement;
                firstFocusable?.focus();
              }

              // Announce dynamic content changes
              if (element.classList.contains('chart-container') ||
                  element.classList.contains('metrics-card')) {
                const liveRegion = document.querySelector('[data-testid=\"accessibility-live-region\"]');
                if (liveRegion) {
                  liveRegion.textContent = `Content updated: ${element.getAttribute('aria-label') || 'New content loaded'}`;
                }
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [enabled]);
};

const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({
  children,
  announceChanges = true,
  enableKeyboardNavigation = true,
  enableFocusManagement = true,
}) => {
  const [announcement, setAnnouncement] = React.useState('');

  // Initialize accessibility features
  useKeyboardNavigation(enableKeyboardNavigation);
  useFocusManagement(enableFocusManagement);

  // Global error boundary for accessibility
  useEffect(() => {
    const handleError = (_error: ErrorEvent) => {
      if (announceChanges) {
        setAnnouncement('An error occurred while loading content. Please try refreshing the page.');
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [announceChanges]);

  // Add accessibility CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .chart-container, .metrics-card {
          border: 2px solid;
          background: Canvas;
          color: CanvasText;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* Focus indicators */
      .keyboard-navigation *:focus {
        outline: 2px solid hsl(var(--primary)) !important;
        outline-offset: 2px !important;
      }

      /* Skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: hsl(var(--foreground));
        color: hsl(var(--background));
        padding: 8px;
        text-decoration: none;
        z-index: 10000;
        border-radius: 4px;
      }

      .skip-link:focus {
        top: 6px;
      }

      /* Screen reader only content */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <>
      {/* Skip links for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      
      {/* Live region for announcements */}
      {announceChanges && (
        <LiveRegion 
          message={announcement} 
          priority="polite"
          clear={true}
        />
      )}
      
      {/* Main content */}
      <div 
        id="main-content"
        role="main"
        aria-label="Analytics dashboard content"
      >
        {children}
      </div>
    </>
  );
};

export default AccessibilityEnhancer;

// Accessibility utilities
export const AccessibilityUtils = {
  // Announce dynamic content changes
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.querySelector('[data-testid="accessibility-live-region"]');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
    }
  },

  // Focus management
  focusElement: (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      return true;
    }
    return false;
  },

  // Check if reduced motion is preferred
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check if high contrast is preferred
  prefersHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  // Generate accessible chart descriptions
  generateChartDescription: (
    chartType: string, 
    data: Array<Record<string, unknown>>, 
    title: string = ''
  ): string => {
    if (!data || data.length === 0) {
      return `${title} ${chartType}: No data available`;
    }

    const dataLength = data.length;

    // SECURITY FIX: Add bounds checking before array access
    if (dataLength === 0) {
      return `${title} ${chartType} with no data points.`;
    }

    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];

    let description = `${title} ${chartType} with ${dataLength} data points. `;

    if (firstPoint && lastPoint) {
      const keys = Object.keys(firstPoint).filter(key => typeof firstPoint[key] === 'number');
      if (keys.length > 0) {
        const mainKey = keys[0];
        description += `Range from ${firstPoint[mainKey]} to ${lastPoint[mainKey]}.`;
      }
    }

    return description;
  },
};