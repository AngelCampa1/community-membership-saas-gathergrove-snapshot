import React, { ReactNode, useEffect, useState } from 'react';
import { useTierValidation } from '../../hooks/useTierValidation';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Loader2, Lock, Sparkles, Zap } from 'lucide-react';
import { logger } from '@/lib/logger';

interface TierGateProps {
  children: ReactNode;
  requiredTier: 'Seed' | 'Basic' | 'Grow' | 'Expand' | 'Unlimited';
  feature?: string;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  blockRendering?: boolean; // If true, prevents rendering children for optimization
  className?: string;
}

/**
 * TierGate component - Controls access to features based on subscription tier
 * Key component of resource optimization strategy - prevents loading of
 * advanced features for basic tier users, saving 60-80% CPU and memory
 */
export function TierGate({
  children,
  requiredTier,
  feature,
  fallback,
  showUpgrade = true,
  blockRendering = true,
  className = '',
}: TierGateProps) {
  const { 
    currentTier, 
    isLoading, 
    error,
    validateFeatureAccess,
    trackBlockedFeature 
  } = useTierValidation();

  const [accessChecked, setAccessChecked] = useState(false);
  const [hasFeatureAccess, setHasFeatureAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (feature) {
          // Validate specific feature access
          const featureAccess = await validateFeatureAccess(feature);
          setHasFeatureAccess(featureAccess);
          
          if (!featureAccess) {
            trackBlockedFeature(feature, requiredTier);
          }
        } else {
          // General tier access check
          const tierHierarchy: { [key: string]: number } = { Seed: 1, Basic: 1, Grow: 2, Expand: 3, Unlimited: 3 };
          const currentTierLevel = tierHierarchy[currentTier || 'Basic'] || 1;
          const requiredTierLevel = tierHierarchy[requiredTier] || 1;

          setHasFeatureAccess(currentTierLevel >= requiredTierLevel);
        }
      } catch (err) {
        logger.error('ui', 'Error checking tier access in TierGate component', { error: err, requiredTier, feature });
        setHasFeatureAccess(false);
      } finally {
        setAccessChecked(true);
      }
    };

    if (!isLoading && currentTier) {
      checkAccess();
    }
  }, [currentTier, isLoading, feature, requiredTier, validateFeatureAccess, trackBlockedFeature]);

  // Loading state
  if (isLoading || !accessChecked) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Validating access...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Unable to validate access permissions. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  // Access granted - render children
  if (hasFeatureAccess) {
    return <div className={className}>{children}</div>;
  }

  // Access denied - show fallback or upgrade prompt
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Show upgrade prompt when requested (takes precedence over blockRendering)
  if (showUpgrade) {
    return (
      <div className={`p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 ${className}`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {requiredTier === 'Unlimited' && <Sparkles className="h-8 w-8 text-secondary-foreground" />}
            {requiredTier === 'Expand' && <Sparkles className="h-8 w-8 text-secondary-foreground" />}
            {requiredTier === 'Grow' && <Zap className="h-8 w-8 text-primary" />}
            {(requiredTier === 'Basic' || requiredTier === 'Seed') && <Lock className="h-8 w-8 text-muted-foreground" />}
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {feature ? `${feature} Feature` : `${requiredTier} Tier Required`}
          </h3>
          
          <p className="text-muted-foreground mb-4">
            {(requiredTier === 'Unlimited' || requiredTier === 'Expand') && (
              "Get reports, up to 2,000 members, and more tools with Expand."
            )}
            {requiredTier === 'Grow' && (
              "Enhanced features and increased limits are available with the Grow plan."
            )}
            {requiredTier === 'Seed' && (
              "This feature is available with the Seed plan."
            )}
            {requiredTier === 'Basic' && (
              "This feature is available with a paid subscription."
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
            <Badge variant="outline" className="mb-2 sm:mb-0">
              Current: {currentTier || 'Basic'}
            </Badge>
            <Badge
              variant={requiredTier === 'Unlimited' || requiredTier === 'Expand' ? 'default' : 'secondary'}
              className={`${
                requiredTier === 'Unlimited' || requiredTier === 'Expand'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              Required: {requiredTier === 'Unlimited' ? 'Expand' : requiredTier}
            </Badge>
          </div>

          {showUpgrade && (
            <div className="mt-4">
              <Button 
                onClick={() => {
                  // Track upgrade click
                  trackBlockedFeature(feature || 'unknown', requiredTier);
                  // Navigate to billing page
                  window.location.href = '/billing/upgrade';
                }}
                className={`${
                  requiredTier === 'Unlimited' || requiredTier === 'Expand'
                    ? 'bg-secondary hover:bg-secondary/90'
                    : 'bg-primary hover:bg-primary/90'
                } text-primary-foreground`}
              >
                {(requiredTier === 'Unlimited' || requiredTier === 'Expand') && <Sparkles className="w-4 h-4 mr-2" />}
                {requiredTier === 'Grow' && <Zap className="w-4 h-4 mr-2" />}
                Upgrade to {requiredTier === 'Unlimited' ? 'Expand' : requiredTier}
              </Button>
              
              <p className="text-xs text-muted-foreground mt-2">
                Start your 30-day free trial today
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Block rendering completely for optimization (when showUpgrade is false)
  if (blockRendering) {
    return null; // Don't render anything to save resources
  }

  // Default blocked state
  return (
    <Alert className={className}>
      <Lock className="h-4 w-4" />
      <AlertDescription>
        This feature requires a {requiredTier} subscription.
      </AlertDescription>
    </Alert>
  );
}

/**
 * Higher-order component for wrapping components with tier validation
 */
export function withTierGate<T extends object>(
  Component: React.ComponentType<T>,
  requiredTier: 'Seed' | 'Basic' | 'Grow' | 'Expand' | 'Unlimited',
  feature?: string
) {
  const WrappedComponent: React.FC<T> = (props) => {
    return (
      <TierGate requiredTier={requiredTier} feature={feature} blockRendering={true}>
        <Component {...props} />
      </TierGate>
    );
  };

  WrappedComponent.displayName = `withTierGate(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * Hook for conditional rendering based on tier
 */
export function useTierGate(requiredTier: 'Seed' | 'Basic' | 'Grow' | 'Expand' | 'Unlimited', feature?: string) {
  const { currentTier, validateFeatureAccess } = useTierValidation();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setIsChecking(true);
      try {
        if (feature) {
          const access = await validateFeatureAccess(feature);
          setHasAccess(access);
        } else {
          const tierHierarchy: { [key: string]: number } = { Seed: 1, Basic: 1, Grow: 2, Expand: 3, Unlimited: 3 };
          const currentLevel = tierHierarchy[currentTier || 'Basic'] || 1;
          const requiredLevel = tierHierarchy[requiredTier] || 1;
          setHasAccess(currentLevel >= requiredLevel);
        }
      } catch (error) {
        logger.error('ui', 'Error checking tier access in useTierCheck hook', { error, requiredTier, feature });
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (currentTier) {
      checkAccess();
    }
  }, [currentTier, requiredTier, feature, validateFeatureAccess]);

  return { hasAccess, isChecking };
}

export default TierGate;
