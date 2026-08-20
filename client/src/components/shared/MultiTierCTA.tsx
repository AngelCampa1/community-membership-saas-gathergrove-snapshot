'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CTAConfig, CTATier } from '@/types/cta';
import { marketingService } from '@/services/marketingService';
import { ctaAnalyticsService } from '@/services/ctaAnalyticsService';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface MultiTierCTAProps {
  config: CTAConfig;
  className?: string;
  showDescription?: boolean;
  showIcon?: boolean;
  animated?: boolean;
  variant?: string; // For A/B testing
}

export function MultiTierCTA({ 
  config, 
  className,
  showDescription = true,
  showIcon = true,
  animated = false,
  variant
}: MultiTierCTAProps) {
  const { trackConversionEvent } = useGoogleAnalytics();
  const elementRef = useRef<HTMLDivElement>(null);
  const hasTrackedImpression = useRef(false);

  // Track impression when component becomes visible
  useEffect(() => {
    if (!elementRef.current || hasTrackedImpression.current) return;

    // Guard for environments without IntersectionObserver (SSR/tests)
    if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedImpression.current) {
            ctaAnalyticsService.recordImpression(
              config.id,
              config.location,
              variant
            );
            hasTrackedImpression.current = true;
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect?.();
    };
  }, [config.id, config.location, variant]);

  const handleClick = async () => {
    // Track CTA click in analytics service
    ctaAnalyticsService.recordClick(
      config.id,
      config.text,
      config.tier,
      config.location,
      variant
    );

    // Track CTA click in marketing service
    await marketingService.trackEvent(config.tracking.eventName, {
      ...config.tracking.properties,
      variant
    });
    
    // Track Google Analytics
    trackConversionEvent(config.tracking.eventName, 1);

    // Execute custom onClick if provided
    if (config.onClick) {
      config.onClick();
    }
  };

  const getButtonVariant = (tier: CTATier) => {
    switch (tier) {
      case 'primary':
        return 'default';
      case 'secondary':
        return 'outline';
      case 'tertiary':
        return 'ghost';
      case 'support':
        return 'secondary';
      case 'social':
        return 'ghost';
      default:
        return 'default';
    }
  };

  const getButtonSize = () => {
    switch (config.size) {
      case 'sm':
        return 'sm';
      case 'lg':
        return 'lg';
      default:
        return 'default';
    }
  };

  const getCommitmentBadge = () => {
    const badgeConfig = {
      low: { text: 'No Commitment', variant: 'secondary' as const },
      medium: { text: 'Quick Demo', variant: 'outline' as const },
      high: { text: 'Free Trial', variant: 'default' as const }
    };

    return badgeConfig[config.commitmentLevel];
  };

  const buttonContent = (
    <div className="flex items-center gap-2">
      {showIcon && config.icon && (
        <span className="text-lg">{config.icon}</span>
      )}
      <span>{config.text}</span>
    </div>
  );

  const buttonElement = config.href ? (
    <Link href={config.href} onClick={handleClick}>
      <Button
        variant={getButtonVariant(config.tier)}
        size={getButtonSize()}
        className={cn(
          'transition-all duration-200 min-h-[44px]', // Minimum touch target size
          config.tier === 'primary' && 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl',
          config.className,
          className
        )}
        data-testid={`cta-${config.id}`}
        aria-label={`${config.text}${config.description ? ` - ${config.description}` : ''}`}
      >
        {buttonContent}
      </Button>
    </Link>
  ) : (
    <Button
      variant={getButtonVariant(config.tier)}
      size={getButtonSize()}
      onClick={handleClick}
      className={cn(
        'transition-all duration-200 min-h-[44px]', // Minimum touch target size
        config.tier === 'primary' && 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl',
        config.className,
        className
      )}
      data-testid={`cta-${config.id}`}
      aria-label={`${config.text}${config.description ? ` - ${config.description}` : ''}`}
    >
      {buttonContent}
    </Button>
  );

  if (animated) {
    return (
      <motion.div
        ref={elementRef}
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-center gap-2">
          {buttonElement}
          {config.commitmentLevel && (
            <Badge variant={getCommitmentBadge().variant} className="text-xs">
              {getCommitmentBadge().text}
            </Badge>
          )}
        </div>
        {showDescription && config.description && (
          <p className="text-sm text-muted-foreground text-center">
            {config.description}
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div ref={elementRef} className="space-y-2">
      <div className="flex items-center justify-center gap-2">
        {buttonElement}
        {config.commitmentLevel && (
          <Badge variant={getCommitmentBadge().variant} className="text-xs">
            {getCommitmentBadge().text}
          </Badge>
        )}
      </div>
      {showDescription && config.description && (
        <p className="text-sm text-muted-foreground text-center">
          {config.description}
        </p>
      )}
    </div>
  );
}

// Component for displaying multiple CTAs in a group
interface CTAGroupProps {
  configs: CTAConfig[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
  animated?: boolean;
}

export function CTAGroup({ 
  configs, 
  layout = 'horizontal', 
  className,
  animated = false 
}: CTAGroupProps) {
  const layoutClasses = {
    horizontal: 'flex flex-wrap items-center justify-center gap-4',
    vertical: 'flex flex-col items-center space-y-4',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
  };

  return (
    <div className={cn(layoutClasses[layout], className)}>
      {configs.map((config) => (
        <MultiTierCTA
          key={config.id}
          config={config}
          animated={animated}
        />
      ))}
    </div>
  );
}