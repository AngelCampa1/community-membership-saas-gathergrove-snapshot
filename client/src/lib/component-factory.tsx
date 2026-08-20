/**
 * Component Factory - Perfect Component Composition Patterns
 * 
 * Provides advanced component composition patterns, HOCs, render props,
 * and compound components for scalable and maintainable React architecture.
 */

import React, { 
  ComponentType, 
  ReactNode, 
  createElement, 
  cloneElement, 
  isValidElement,
  Children,
  useMemo,
  forwardRef,
  memo
} from 'react';
import { BaseComponentProps, FormComponentProps } from './architectural-patterns';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

// ============================================================================
// COMPONENT COMPOSITION TYPES
// ============================================================================

export interface CompoundComponentProps {
  children?: ReactNode;
  className?: string;
}

export interface RenderPropComponent<T> {
  children: (props: T) => ReactNode;
}

export interface HOCOptions {
  displayName?: string;
  forwardRef?: boolean;
  memo?: boolean;
  defaultProps?: Record<string, unknown>;
}

// ============================================================================
// HIGHER-ORDER COMPONENTS (HOCs)
// ============================================================================

/**
 * Enhanced HOC factory with proper TypeScript support
 */
export function createHOC<TInjectedProps extends object, TOriginalProps extends object = Record<string, unknown>>(
  enhance: (WrappedComponent: ComponentType<TOriginalProps & TInjectedProps>) => ComponentType<TOriginalProps>,
  options: HOCOptions = {}
): (WrappedComponent: ComponentType<TOriginalProps & TInjectedProps>) => ComponentType<TOriginalProps> {
    return (WrappedComponent: ComponentType<any>) => {
    const EnhancedComponent = enhance(WrappedComponent);
    
    if (options.displayName) {
      EnhancedComponent.displayName = options.displayName;
    } else {
      EnhancedComponent.displayName = `Enhanced(${WrappedComponent.displayName || WrappedComponent.name})`;
    }

    if (options.defaultProps) {
      (EnhancedComponent as any).defaultProps = options.defaultProps;
    }

    let FinalComponent = EnhancedComponent;

    if (options.forwardRef) {
      const ForwardRefFunction = (props: any, ref: React.Ref<unknown>) =>
        createElement(EnhancedComponent, { ...props, ref });
      ForwardRefFunction.displayName = `ForwardRefFunction(${EnhancedComponent.displayName || WrappedComponent.displayName || WrappedComponent.name})`;
      const ForwardRefComponent = forwardRef<unknown, TOriginalProps>(ForwardRefFunction as any) as unknown as ComponentType<TOriginalProps>;
      ForwardRefComponent.displayName = `ForwardRef(${EnhancedComponent.displayName || WrappedComponent.displayName || WrappedComponent.name})`;
      FinalComponent = ForwardRefComponent;
    }

    if (options.memo) {
      FinalComponent = memo(FinalComponent) as unknown as ComponentType<TOriginalProps>;
    }

    return FinalComponent;
  };
}

/**
 * Conditional rendering HOC
 */
export const withConditionalRender = <P extends object>(
  condition: (props: P) => boolean,
  fallback?: ComponentType<P> | ReactNode
) => createHOC<Record<string, unknown>, P>((WrappedComponent) => {
  const ConditionalComponent = (props: any) => {
    if (!condition(props)) {
      if (React.isValidElement(fallback)) {
        return fallback;
      }
      if (typeof fallback === 'function') {
        const FallbackComponent = fallback as ComponentType<P>;
        return <FallbackComponent {...props} />;
      }
      return null;
    }
    return <WrappedComponent {...props} />;
  };
  ConditionalComponent.displayName = `ConditionalRender(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ConditionalComponent;
});

/**
 * Loading state HOC
 */
export const withLoadingState = <P extends object & { loading?: boolean }>(
  LoadingComponent?: ComponentType<Record<string, never>>
) => createHOC<Record<string, unknown>, P>((WrappedComponent) => {
  const LoadingStateComponent = (props: any) => {
    if (props.loading) {
      return LoadingComponent ? <LoadingComponent /> : <div>Loading...</div>;
    }
    return <WrappedComponent {...props} />;
  };
  LoadingStateComponent.displayName = `LoadingState(${WrappedComponent.displayName || WrappedComponent.name})`;
  return LoadingStateComponent;
});

/**
 * Error boundary HOC
 */
export const withErrorHandling = <P extends object>(
  ErrorComponent?: ComponentType<{ error: Error; retry: () => void }>
) => createHOC<Record<string, unknown>, P>((WrappedComponent) => {
  class ErrorBoundaryComponent extends React.Component<P, { hasError: boolean; error: Error | null }> {
    static displayName = `ErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
    constructor(props: P) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    retry = () => {
      this.setState({ hasError: false, error: null });
    };

    render() {
      if (this.state.hasError && this.state.error) {
        return ErrorComponent ? (
          <ErrorComponent error={this.state.error} retry={this.retry} />
        ) : (
          <div>Something went wrong</div>
        );
      }
      return <WrappedComponent {...this.props} />;
    }
  }
  return ErrorBoundaryComponent;
});

// ============================================================================
// COMPOUND COMPONENTS
// ============================================================================

/**
 * Create compound component factory
 */
export function createCompoundComponent<T extends Record<string, ComponentType<Record<string, unknown>>>>(
  components: T
): T & { displayName: string } {
  const MainComponent = components.Root || components.Main;

  if (!MainComponent) {
    throw new Error('Compound component must have a Root or Main component');
  }

  // Attach sub-components to main component
  Object.keys(components).forEach(key => {
    if (key !== 'Root' && key !== 'Main') {
      (MainComponent as ComponentType<Record<string, unknown>> & Record<string, ComponentType<Record<string, unknown>>>)[key] = components[key];
    }
  });

  (MainComponent as ComponentType<Record<string, unknown>> & { displayName: string }).displayName = 'CompoundComponent';

  return MainComponent as unknown as T & { displayName: string };
}

/**
 * Compound component helper for slot-based composition
 */
export function createSlotComponent<TSlots extends Record<string, ComponentType<Record<string, unknown>>>>(
  slots: TSlots,
  layout: (slots: TSlots) => ReactNode
) {
  return function SlotComponent(props: {
    [K in keyof TSlots]?: React.ComponentProps<TSlots[K]>;
  }) {
    const renderedSlots = useMemo(() => {
      const result = {} as Record<string, ReactNode>;

      Object.keys(slots).forEach(key => {
        const SlotComponent = slots[key];
        const slotProps = props[key as keyof typeof props] || {};
        result[key] = <SlotComponent {...slotProps} />;
      });

    return result as unknown as TSlots;
    }, [props]);

    return <>{layout(renderedSlots)}</>;
  };
}

// ============================================================================
// RENDER PROPS PATTERNS
// ============================================================================

/**
 * Generic render prop component
 */
export function createRenderPropComponent<T>(
  useLogic: () => T
): ComponentType<RenderPropComponent<T>> {
  return function RenderPropComponent({ children }: RenderPropComponent<T>) {
    const logicProps = useLogic();
    return <>{children(logicProps)}</>;
  };
}

/**
 * Data fetcher render prop component
 */
export function DataFetcher<T>({
  url,
  children,
}: {
  url: string;
  children: (data: { data: T | null; loading: boolean; error: Error | null }) => ReactNode;
}) {
  const [state, setState] = React.useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    fetch(url)
      .then(res => res.json())
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState(prev => ({ ...prev, loading: false, error })));
  }, [url]);

  return <>{children(state)}</>;
}

// ============================================================================
// COMPONENT BUILDERS
// ============================================================================

/**
 * Form field builder with consistent styling
 */
export function createFormField<T extends FormComponentProps>(
  InputComponent: ComponentType<T>,
  defaultClassName?: string
) {
  return forwardRef<HTMLElement, T & {
    label?: string;
    helperText?: string;
    required?: boolean;
  }>(function FormField({ label, helperText, required, className, error, ...props }, ref) {
    const fieldId = React.useId();
    const helperId = helperText ? `${fieldId}-helper` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <InputComponent
          {...(props as any)}
          ref={ref}
          id={fieldId}
          className={cn(defaultClassName, className, error && 'border-destructive')}
          aria-describedby={cn(helperId, errorId)}
          aria-invalid={!!error}
          required={required}
        />
        
        {helperText && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {Array.isArray(error) ? error.join(', ') : error}
          </p>
        )}
      </div>
    );
  });
}

/**
 * Card component builder
 */
export function createCard(variants: Record<string, string> = {}) {
  const defaultVariants = {
    default: 'bg-background border border-border rounded-lg shadow-sm',
    elevated: 'bg-background border border-border rounded-lg shadow-md',
    outlined: 'bg-background border-2 border-border rounded-lg',
    ...variants,
  };

  function Card({ 
    variant = 'default', 
    className, 
    children, 
    ...props 
  }: BaseComponentProps & {
    variant?: keyof typeof defaultVariants;
    children: ReactNode;
  }) {
    return (
      <div 
        className={cn(defaultVariants[variant], className)} 
        {...props}
      >
        {children}
      </div>
    );
  }

  function CardHeader({ className, children, ...props }: BaseComponentProps & { children: ReactNode }) {
    return (
      <div className={cn('px-6 py-4 border-b border-border', className)} {...props}>
        {children}
      </div>
    );
  }

  function CardContent({ className, children, ...props }: BaseComponentProps & { children: ReactNode }) {
    return (
      <div className={cn('px-6 py-4', className)} {...props}>
        {children}
      </div>
    );
  }

  function CardFooter({ className, children, ...props }: BaseComponentProps & { children: ReactNode }) {
    return (
      <div className={cn('px-6 py-4 border-t border-border', className)} {...props}>
        {children}
      </div>
    );
  }

  return {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
  };
}

// ============================================================================
// COMPONENT PERFORMANCE OPTIMIZATIONS
// ============================================================================

/**
 * Memoized component creator with custom comparison
 */
export function createMemoComponent<T extends object>(
  Component: ComponentType<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
): ComponentType<T> {
  const MemoComponent = memo(Component, propsAreEqual);
  MemoComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoComponent as unknown as ComponentType<T>;
}

/**
 * Lazy component loader with suspense
 */
export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = React.lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <React.Suspense fallback={fallback || <div>Loading...</div>}>
        <LazyComponent {...(props as any)} />
      </React.Suspense>
    );
  };
}

// ============================================================================
// COMPONENT UTILITIES
// ============================================================================

/**
 * Get display name of component
 */
export function getDisplayName(Component: ComponentType<Record<string, unknown>>): string {
  return Component.displayName || Component.name || 'Component';
}

/**
 * Clone element with additional props
 */
export function cloneElementWithProps<T extends object>(
  element: React.ReactElement,
  additionalProps: T
): React.ReactElement {
  return cloneElement(element, additionalProps);
}

/**
 * Validate children structure for compound components
 */
export function validateChildren(
  children: ReactNode,
  allowedTypes: ComponentType<Record<string, unknown>>[]
): void {
  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      const childType = child.type;
      if (!allowedTypes.includes(childType as ComponentType<Record<string, unknown>>)) {
        logger.warn('ui', 'Invalid child component type in compound component', {
          invalidType: getDisplayName(childType as ComponentType<Record<string, unknown>>),
          allowedTypes: allowedTypes.map(t => getDisplayName(t))
        });
      }
    }
  });
}

// ============================================================================
// COMPONENT FACTORY EXPORT
// ============================================================================

export const ComponentFactory = {
  createHOC,
  createCompoundComponent,
  createSlotComponent,
  createRenderPropComponent,
  createFormField,
  createCard,
  createMemoComponent,
  createLazyComponent,
  withConditionalRender,
  withLoadingState,
  withErrorHandling,
  DataFetcher,
  getDisplayName,
  cloneElementWithProps,
  validateChildren,
} as const;

export default ComponentFactory;
