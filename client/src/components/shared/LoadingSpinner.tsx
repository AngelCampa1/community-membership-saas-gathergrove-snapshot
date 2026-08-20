/**
 * Advanced Loading Spinner Component
 * 
 * Provides various loading states with accessibility,
 * customization options, and performance optimizations.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'skeleton';
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
  className?: string;
  label?: string;
  delay?: number;
  'data-testid'?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  muted: 'text-muted-foreground'
};

/**
 * Spinner Animation Component
 */
const SpinnerAnimation: React.FC<{ size: string; color: string; className?: string }> = ({
  size,
  color,
  className
}) => (
  <svg
    className={cn(
      'animate-spin',
      size,
      color,
      className
    )}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    data-testid="loading-spinner"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Dots Animation Component
 */
const DotsAnimation: React.FC<{ size: string; color: string; className?: string }> = ({
  size,
  color,
  className
}) => {
  const dotSize = size === 'w-4 h-4' ? 'w-1 h-1' : 
                  size === 'w-6 h-6' ? 'w-1.5 h-1.5' :
                  size === 'w-8 h-8' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className={cn('flex space-x-1', className)} data-testid="loading-dots">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-current animate-pulse',
            dotSize,
            color
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

/**
 * Pulse Animation Component
 */
const PulseAnimation: React.FC<{ size: string; color: string; className?: string }> = ({
  size,
  color,
  className
}) => (
  <div
    className={cn(
      'rounded-full bg-current animate-pulse',
      size,
      color,
      className
    )}
    data-testid="loading-pulse"
  />
);

/**
 * Bars Animation Component
 */
const BarsAnimation: React.FC<{ size: string; color: string; className?: string }> = ({
  size,
  color,
  className
}) => {
  const barHeight = size === 'w-4 h-4' ? 'h-4' : 
                    size === 'w-6 h-6' ? 'h-6' :
                    size === 'w-8 h-8' ? 'h-8' : 'h-12';

  return (
    <div className={cn('flex items-end space-x-1', className)} data-testid="loading-bars">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={cn(
            'w-1 bg-current animate-pulse',
            barHeight,
            color
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.8s',
            transformOrigin: 'bottom'
          }}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton Animation Component
 */
const SkeletonAnimation: React.FC<{ size: string; className?: string }> = ({
  size,
  className
}) => {
  const skeletonSize = size === 'w-4 h-4' ? 'w-16 h-4' : 
                       size === 'w-6 h-6' ? 'w-24 h-6' :
                       size === 'w-8 h-8' ? 'w-32 h-8' : 'w-40 h-12';

  return (
    <div className={cn('animate-pulse', className)} data-testid="loading-skeleton">
      <div className={cn('bg-muted rounded', skeletonSize)} />
    </div>
  );
};

/**
 * Delayed Loading Component
 */
const DelayedLoading: React.FC<{
  delay: number;
  children: React.ReactNode;
}> = ({ delay, children }) => {
  const [show, setShow] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  return show ? <>{children}</> : null;
};

/**
 * Main Loading Spinner Component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  className,
  label = 'Loading...',
  delay = 0,
  'data-testid': testId = 'loading-spinner'
}) => {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  const renderAnimation = () => {
    switch (variant) {
      case 'dots':
        return <DotsAnimation size={sizeClass} color={colorClass} className={className} />;
      case 'pulse':
        return <PulseAnimation size={sizeClass} color={colorClass} className={className} />;
      case 'bars':
        return <BarsAnimation size={sizeClass} color={colorClass} className={className} />;
      case 'skeleton':
        return <SkeletonAnimation size={sizeClass} className={className} />;
      default:
        return <SpinnerAnimation size={sizeClass} color={colorClass} className={className} />;
    }
  };

  const loadingContent = (
    <div
      className="flex flex-col items-center justify-center space-y-2"
      role="status"
      aria-label={label}
      data-testid={testId}
    >
      {renderAnimation()}
      {label && (
        <span className="text-sm text-muted-foreground sr-only">
          {label}
        </span>
      )}
    </div>
  );

  if (delay > 0) {
    return (
      <DelayedLoading delay={delay}>
        {loadingContent}
      </DelayedLoading>
    );
  }

  return loadingContent;
};

/**
 * Full Screen Loading Component
 */
export const FullScreenLoading: React.FC<{
  variant?: LoadingSpinnerProps['variant'];
  message?: string;
  backdrop?: boolean;
}> = ({
  variant = 'spinner',
  message = 'Loading...',
  backdrop = true
}) => (
  <div
    className={cn(
      'fixed inset-0 z-50 flex items-center justify-center',
      backdrop && 'bg-background/80 backdrop-blur-sm'
    )}
    data-testid="full-screen-loading"
  >
    <div className="flex flex-col items-center space-y-4">
      <LoadingSpinner size="xl" variant={variant} />
      {message && (
        <p className="text-lg text-muted-foreground">{message}</p>
      )}
    </div>
  </div>
);

/**
 * Inline Loading Component
 */
export const InlineLoading: React.FC<{
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
  size?: LoadingSpinnerProps['size'];
}> = ({
  text = 'Loading',
  variant = 'spinner',
  size = 'sm'
}) => (
  <div className="flex items-center space-x-2" data-testid="inline-loading">
    <LoadingSpinner size={size} variant={variant} />
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);

/**
 * Button Loading State Component
 */
export const ButtonLoading: React.FC<{
  size?: LoadingSpinnerProps['size'];
  className?: string;
}> = ({
  size = 'sm',
  className
}) => (
  <LoadingSpinner
    size={size}
    variant="spinner"
    color="muted"
    className={cn('mr-2', className)}
    data-testid="button-loading"
  />
);

/**
 * Page Loading Component
 */
export const PageLoading: React.FC<{
  title?: string;
  description?: string;
}> = ({
  title = 'Loading Page',
  description = 'Please wait while we load the content...'
}) => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center space-y-6 max-w-md">
      <LoadingSpinner size="xl" variant="spinner" />
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;