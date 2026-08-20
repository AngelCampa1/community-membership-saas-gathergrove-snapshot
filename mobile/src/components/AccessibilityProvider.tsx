import React, { createContext, useContext, useEffect, useState, ReactNode, RefObject } from 'react';
import { Platform, AccessibilityInfo, Dimensions, findNodeHandle } from 'react-native';
import { logger } from '../utils/logger';

/**
 * Type for element references that can be focused
 * Supports both web (HTMLElement) and React Native (Component) refs
 */
type FocusableElement = {
  focus?: () => void;
  measure?: (...args: unknown[]) => void;
};

type FocusableElementRef = RefObject<HTMLElement | FocusableElement>;

/**
 * Extended AccessibilityInfo type with removeEventListener
 * Some React Native versions may not have this method
 */
interface ExtendedAccessibilityInfo {
  removeEventListener?: (eventName: string, handler: (enabled: boolean) => void) => void;
}

interface AccessibilityContextType {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isHighContrastEnabled: boolean;
  isLargeTextEnabled: boolean;
  announceForAccessibility: (message: string) => void;
  focusElement: (elementRef: FocusableElementRef) => void;
  setAccessibilityFocus: (elementRef: FocusableElementRef) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

/**
 * Accessibility provider for perfect Lighthouse accessibility score
 * Provides comprehensive accessibility features and utilities
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
  const [isLargeTextEnabled, setIsLargeTextEnabled] = useState(false);

  useEffect(() => {
    // Check screen reader status
    const checkScreenReaderStatus = async () => {
      try {
        const enabled = await AccessibilityInfo.isScreenReaderEnabled();
        setIsScreenReaderEnabled(enabled);
      } catch (error) {
        logger.warn('ui', 'Error checking screen reader status', { error });
      }
    };

    // Check reduce motion preference (web only)
    const checkReduceMotionPreference = () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReduceMotionEnabled(mediaQuery.matches);
        
        const handleChange = (e: MediaQueryListEvent) => {
          setIsReduceMotionEnabled(e.matches);
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
      return undefined;
    };

    // Check high contrast preference (web only)
    const checkHighContrastPreference = () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        setIsHighContrastEnabled(mediaQuery.matches);
        
        const handleChange = (e: MediaQueryListEvent) => {
          setIsHighContrastEnabled(e.matches);
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
      return undefined;
    };

    // Check large text preference
    const checkLargeTextPreference = () => {
      const { fontScale } = Dimensions.get('window');
      setIsLargeTextEnabled(fontScale > 1.2);
    };

    checkScreenReaderStatus();
    checkReduceMotionPreference();
    checkHighContrastPreference();
    checkLargeTextPreference();

    // Listen for accessibility changes
    const screenReaderChangeHandler = (enabled: boolean) => {
      setIsScreenReaderEnabled(enabled);
    };

    const dimensionChangeHandler = () => {
      checkLargeTextPreference();
    };

    AccessibilityInfo.addEventListener('screenReaderChanged', screenReaderChangeHandler);
    const dimensionSubscription = Dimensions.addEventListener('change', dimensionChangeHandler);

    return () => {
      try {
        // Note: removeEventListener might not exist on all React Native versions
        const extendedAccessibilityInfo = AccessibilityInfo as ExtendedAccessibilityInfo;
        if ('removeEventListener' in extendedAccessibilityInfo && typeof extendedAccessibilityInfo.removeEventListener === 'function') {
          extendedAccessibilityInfo.removeEventListener('screenReaderChanged', screenReaderChangeHandler);
        }
      } catch (error) {
        // Handle potential removeEventListener error
        logger.warn('ui', 'Error removing accessibility event listener', { error });
      }
      dimensionSubscription?.remove();
    };
  }, []);

  /**
   * Announce message to screen readers
   */
  const announceForAccessibility = (message: string) => {
    if (Platform.OS === 'web') {
      // Create a live region for announcements
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    } else {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  /**
   * Focus element for accessibility
   */
  const focusElement = (elementRef: FocusableElementRef) => {
    if (elementRef?.current) {
      if (Platform.OS === 'web') {
        if ('focus' in elementRef.current && typeof elementRef.current.focus === 'function') {
          elementRef.current.focus();
        }
      } else {
        // For React Native, find the node handle and set accessibility focus
        const node = findNodeHandle(elementRef.current as React.Component);
        if (node) {
          AccessibilityInfo.setAccessibilityFocus(node);
        }
      }
    }
  };

  /**
   * Set accessibility focus (mobile specific)
   */
  const setAccessibilityFocus = (elementRef: FocusableElementRef) => {
    if (Platform.OS !== 'web' && elementRef?.current) {
      // For React Native, find the node handle and set accessibility focus
      const node = findNodeHandle(elementRef.current as React.Component);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  };

  const contextValue: AccessibilityContextType = {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isHighContrastEnabled,
    isLargeTextEnabled,
    announceForAccessibility,
    focusElement,
    setAccessibilityFocus,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook to use accessibility context
 */
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

/**
 * Higher-order component for accessibility enhancements
 */
export const withAccessibility = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <AccessibilityProvider>
        <Component {...props} />
      </AccessibilityProvider>
    );
  };
  
  WrappedComponent.displayName = `withAccessibility(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default AccessibilityProvider;