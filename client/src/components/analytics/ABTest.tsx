'use client';

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

// A/B Test configuration type
export interface ABTestConfig {
  testId: string;
  variants: {
    id: string;
    name: string;
    weight: number; // Weight for random distribution (0-100)
  }[];
  description?: string;
  enabled?: boolean;
}

// A/B Test context
interface ABTestContextType {
  getVariant: (testId: string) => string | null;
  setVariant: (testId: string, variantId: string) => void;
  trackExperiment: (testId: string, variantId: string, eventType: string) => void;
}

const ABTestContext = createContext<ABTestContextType | null>(null);

// Default test configurations
const DEFAULT_TESTS: Record<string, ABTestConfig> = {
  hero_cta_text: {
    testId: 'hero_cta_text',
    description: 'CTA text is standardized to "Start Free Trial" — test disabled',
    enabled: false,
    variants: [
      { id: 'control', name: 'Start Free Trial', weight: 100 },
    ],
  },
  pricing_display: {
    testId: 'pricing_display',
    description: 'Test different pricing presentation styles',
    enabled: true,
    variants: [
      { id: 'control', name: 'Standard Pricing', weight: 50 },
      { id: 'variant_a', name: 'Value-First Pricing', weight: 50 },
    ],
  },
  feature_order: {
    testId: 'feature_order',
    description: 'Test different feature section orders',
    enabled: false, // Disabled by default
    variants: [
      { id: 'control', name: 'Standard Order', weight: 50 },
      { id: 'variant_a', name: 'Benefits First', weight: 50 },
    ],
  },
};

// A/B Test Provider
export function ABTestProvider({ 
  children, 
  tests = DEFAULT_TESTS 
}: { 
  children: ReactNode;
  tests?: Record<string, ABTestConfig>;
}) {
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const { trackEvent } = useGoogleAnalytics();

  // Track experiment function
  const trackExperiment = useCallback((testId: string, variantId: string, eventType: string) => {
    trackEvent('ab_test_event', {
      category: 'AB Testing',
      label: `${testId}_${variantId}_${eventType}`,
      customParameters: {
        test_id: testId,
        variant_id: variantId,
        event_type: eventType,
      },
    });
  }, [trackEvent]);

  // Generate variant assignments
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedVariants = localStorage.getItem('ab_test_variants');
    // BUG FIX: Wrap JSON.parse in try-catch to handle corrupted localStorage data
    let existingVariants: Record<string, string> = {};
    if (storedVariants) {
      try {
        existingVariants = JSON.parse(storedVariants);
      } catch {
        // Clear corrupted data
        localStorage.removeItem('ab_test_variants');
      }
    }
    const newVariants: Record<string, string> = { ...existingVariants };

    Object.values(tests).forEach(test => {
      if (!test.enabled) return;
      
      // Use existing variant if available
      if (existingVariants[test.testId]) {
        return;
      }

      // Assign new variant based on weights
      const random = Math.random() * 100;
      let cumulativeWeight = 0;
      
      for (const variant of test.variants) {
        cumulativeWeight += variant.weight;
        if (random <= cumulativeWeight) {
          newVariants[test.testId] = variant.id;
          break;
        }
      }
    });

    setVariants(newVariants);
    localStorage.setItem('ab_test_variants', JSON.stringify(newVariants));
    setInitialized(true);

    // Track experiment participation
    Object.entries(newVariants).forEach(([testId, variantId]) => {
      if (tests[testId]?.enabled) {
        trackExperiment(testId, variantId, 'participate');
      }
    });
  }, [tests, trackExperiment]);

  const getVariant = (testId: string): string | null => {
    if (!initialized) return null;
    return variants[testId] || null;
  };

  const setVariant = (testId: string, variantId: string) => {
    const newVariants = { ...variants, [testId]: variantId };
    setVariants(newVariants);
    localStorage.setItem('ab_test_variants', JSON.stringify(newVariants));
  };

  const contextValue: ABTestContextType = {
    getVariant,
    setVariant,
    trackExperiment,
  };

  return (
    <ABTestContext.Provider value={contextValue}>
      {children}
    </ABTestContext.Provider>
  );
}

// Hook to use A/B testing
export function useABTest() {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest must be used within an ABTestProvider');
  }
  return context;
}

// Component for A/B testing specific elements
interface ABTestProps {
  testId: string;
  variants: Record<string, ReactNode>;
  fallback?: ReactNode;
}

export function ABTest({ testId, variants, fallback }: ABTestProps) {
  const { getVariant, trackExperiment } = useABTest();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentVariant = isClient ? getVariant(testId) : null;
  
  useEffect(() => {
    if (isClient && currentVariant) {
      trackExperiment(testId, currentVariant, 'view');
    }
  }, [testId, currentVariant, trackExperiment, isClient]);

  if (!isClient) {
    return fallback || variants.control || null;
  }

  if (!currentVariant) {
    return fallback || variants.control || null;
  }

  return <>{variants[currentVariant] || variants.control || fallback}</>;
}

// Hook for conditional A/B test logic
export function useABTestVariant(testId: string): string | null {
  const { getVariant } = useABTest();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return getVariant(testId);
}

// Utility function to track A/B test conversions
export function useABTestConversion() {
  const { getVariant, trackExperiment } = useABTest();

  const trackConversion = (testId: string, conversionType: string = 'convert') => {
    const variant = getVariant(testId);
    if (variant) {
      trackExperiment(testId, variant, conversionType);
    }
  };

  return { trackConversion };
}

// Component to display A/B test debug info (dev only)
export function ABTestDebug() {
  const [variants, setVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ab_test_variants');
      if (stored) {
        // BUG FIX: Wrap JSON.parse in try-catch to handle corrupted localStorage data
        try {
          setVariants(JSON.parse(stored));
        } catch {
          // Silently ignore corrupted data in debug component
        }
      }
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h4 className="font-bold mb-2">A/B Tests (Dev Only)</h4>
      {Object.entries(variants).map(([testId, variantId]) => (
        <div key={testId} className="mb-1">
          <strong>{testId}:</strong> {variantId}
        </div>
      ))}
    </div>
  );
}