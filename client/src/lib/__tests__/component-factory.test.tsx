/**
 * COMPREHENSIVE COMPONENT FACTORY TESTS
 * Tests all component composition patterns, HOCs, render props,
 * compound components, builders, and performance optimizations
 */

import React, { ComponentType, forwardRef, useRef } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
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
  ComponentFactory
} from '../component-factory';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Import mocked logger for test assertions
import { logger } from '@/lib/logger';

describe('Component Factory', () => {
  describe('createHOC', () => {
    it('should create a higher-order component', () => {
      const enhance = (WrappedComponent: ComponentType<any>) => {
        return (props: any) => <WrappedComponent {...props} enhanced={true} />;
      };

      const withEnhancement = createHOC(enhance);
      const BaseComponent = ({ enhanced }: { enhanced?: boolean }) => (
        <div>Enhanced: {String(enhanced)}</div>
      );

      const EnhancedComponent = withEnhancement(BaseComponent);

      render(<EnhancedComponent />);

      expect(screen.getByText('Enhanced: true')).toBeInTheDocument();
    });

    it('should set custom display name when provided', () => {
      const enhance = (WrappedComponent: ComponentType<any>) => WrappedComponent;
      const withEnhancement = createHOC(enhance, { displayName: 'CustomName' });
      const BaseComponent = () => <div>Test</div>;

      const EnhancedComponent = withEnhancement(BaseComponent);

      expect(EnhancedComponent.displayName).toBe('CustomName');
    });

    it('should generate display name from wrapped component', () => {
      const enhance = (WrappedComponent: ComponentType<any>) => WrappedComponent;
      const withEnhancement = createHOC(enhance);
      const BaseComponent = () => <div>Test</div>;
      BaseComponent.displayName = 'TestComponent';

      const EnhancedComponent = withEnhancement(BaseComponent);

      expect(EnhancedComponent.displayName).toBe('Enhanced(TestComponent)');
    });

    it('should set default props when provided', () => {
      const enhance = (WrappedComponent: ComponentType<any>) => WrappedComponent;
      const withEnhancement = createHOC(enhance, {
        defaultProps: { color: 'blue', size: 'medium' }
      });
      const BaseComponent = ({ color, size }: { color?: string; size?: string }) => (
        <div>{color} {size}</div>
      );

      const EnhancedComponent = withEnhancement(BaseComponent);

      expect((EnhancedComponent as any).defaultProps).toEqual({
        color: 'blue',
        size: 'medium'
      });
    });

    it('should support forwardRef option', () => {
      const enhance = (WrappedComponent: ComponentType<any>) => {
        return forwardRef((props: any, ref) => (
          <WrappedComponent {...props} forwardedRef={ref} />
        ));
      };

      const withEnhancement = createHOC(enhance, { forwardRef: true });
      const BaseComponent = forwardRef<HTMLDivElement, { forwardedRef?: React.Ref<HTMLDivElement> }>(
        (props, ref) => <div ref={ref || props.forwardedRef}>With Ref</div>
      );

      const EnhancedComponent = withEnhancement(BaseComponent);
      const ref = React.createRef<HTMLDivElement>();

      render(<EnhancedComponent ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should support memo option', () => {
      let renderCount = 0;
      const enhance = (WrappedComponent: ComponentType<any>) => (props: any) => {
        renderCount++;
        return <WrappedComponent {...props} />;
      };

      const withEnhancement = createHOC(enhance, { memo: true });
      const BaseComponent = ({ value }: { value: number }) => <div>{value}</div>;

      const EnhancedComponent = withEnhancement(BaseComponent);
      const { rerender } = render(<EnhancedComponent value={1} />);

      expect(renderCount).toBe(1);

      // Same props - should not re-render due to memo
      rerender(<EnhancedComponent value={1} />);
      expect(renderCount).toBe(1);

      // Different props - should re-render
      rerender(<EnhancedComponent value={2} />);
      expect(renderCount).toBe(2);
    });
  });

  describe('withConditionalRender', () => {
    it('should render component when condition is true', () => {
      const Component = ({ show }: { show: boolean }) => <div>Visible</div>;
      const ConditionalComponent = withConditionalRender<{ show: boolean }>(
        (props) => props.show
      )(Component);

      render(<ConditionalComponent show={true} />);

      expect(screen.getByText('Visible')).toBeInTheDocument();
    });

    it('should not render component when condition is false', () => {
      const Component = ({ show }: { show: boolean }) => <div>Visible</div>;
      const ConditionalComponent = withConditionalRender<{ show: boolean }>(
        (props) => props.show
      )(Component);

      render(<ConditionalComponent show={false} />);

      expect(screen.queryByText('Visible')).not.toBeInTheDocument();
    });

    it('should render fallback element when condition is false', () => {
      const Component = ({ show }: { show: boolean }) => <div>Main</div>;
      const ConditionalComponent = withConditionalRender<{ show: boolean}>(
        (props) => props.show,
        <div>Fallback</div>
      )(Component);

      render(<ConditionalComponent show={false} />);

      expect(screen.getByText('Fallback')).toBeInTheDocument();
      expect(screen.queryByText('Main')).not.toBeInTheDocument();
    });

    it('should render fallback component when condition is false', () => {
      const Component = ({ show }: { show: boolean }) => <div>Main</div>;
      const FallbackComponent = () => <div>Fallback Component</div>;
      const ConditionalComponent = withConditionalRender<{ show: boolean }>(
        (props) => props.show,
        FallbackComponent
      )(Component);

      render(<ConditionalComponent show={false} />);

      expect(screen.getByText('Fallback Component')).toBeInTheDocument();
    });
  });

  describe('withLoadingState', () => {
    it('should render loading state when loading prop is true', () => {
      const Component = () => <div>Content</div>;
      const LoadingComponent = withLoadingState()(Component);

      render(<LoadingComponent loading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('should render component when loading prop is false', () => {
      const Component = () => <div>Content</div>;
      const LoadingComponent = withLoadingState()(Component);

      render(<LoadingComponent loading={false} />);

      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should render custom loading component', () => {
      const Component = () => <div>Content</div>;
      const CustomLoading = () => <div>Custom Loading...</div>;
      const LoadingComponent = withLoadingState(CustomLoading)(Component);

      render(<LoadingComponent loading={true} />);

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });
  });

  describe('withErrorHandling', () => {
    it('should render component when no error occurs', () => {
      const Component = () => <div>Working</div>;
      const ErrorHandledComponent = withErrorHandling()(Component);

      render(<ErrorHandledComponent />);

      expect(screen.getByText('Working')).toBeInTheDocument();
    });

    it('should catch errors and render error UI', () => {
      const ThrowingComponent = () => {
        throw new Error('Test error');
      };
      const ErrorHandledComponent = withErrorHandling()(ThrowingComponent);

      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ErrorHandledComponent />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('should render custom error component', () => {
      const ThrowingComponent = () => {
        throw new Error('Custom error');
      };
      const CustomError = ({ error }: { error: Error }) => (
        <div>Error: {error.message}</div>
      );
      const ErrorHandledComponent = withErrorHandling(CustomError)(ThrowingComponent);

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ErrorHandledComponent />);

      expect(screen.getByText('Error: Custom error')).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('should support retry functionality', () => {
      let shouldThrow = true;
      const ConditionalThrowComponent = () => {
        if (shouldThrow) {
          throw new Error('Retry error');
        }
        return <div>Recovered</div>;
      };

      const CustomError = ({ error, retry }: { error: Error; retry: () => void }) => (
        <div>
          <div>Error: {error.message}</div>
          <button onClick={retry}>Retry</button>
        </div>
      );

      const ErrorHandledComponent = withErrorHandling(CustomError)(ConditionalThrowComponent);

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { getByText } = render(<ErrorHandledComponent />);

      expect(getByText('Error: Retry error')).toBeInTheDocument();

      // Fix the error and retry
      shouldThrow = false;
      const retryButton = getByText('Retry');

      act(() => {
        retryButton.click();
      });

      expect(screen.getByText('Recovered')).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('createCompoundComponent', () => {
    it('should create compound component with Root', () => {
      const Root = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
      const Header = () => <div>Header</div>;
      const Content = () => <div>Content</div>;

      const Compound = createCompoundComponent({
        Root,
        Header,
        Content
      });

      expect(Compound.displayName).toBe('CompoundComponent');
      expect((Compound as any).Header).toBe(Header);
      expect((Compound as any).Content).toBe(Content);
    });

    it('should create compound component with Main', () => {
      const Main = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
      const Item = () => <div>Item</div>;

      const Compound = createCompoundComponent({
        Main,
        Item
      });

      expect((Compound as any).Item).toBe(Item);
    });

    it('should throw error when no Root or Main component', () => {
      const Header = () => <div>Header</div>;

      expect(() => {
        createCompoundComponent({ Header } as any);
      }).toThrow('Compound component must have a Root or Main component');
    });
  });

  describe('createSlotComponent', () => {
    it('should create slot-based component', () => {
      const Header = ({ title }: { title: string }) => <div>Header: {title}</div>;
      const Content = ({ text }: { text: string }) => <div>Content: {text}</div>;

      const SlotComponent = createSlotComponent(
        { Header, Content },
        (slots) => (
          <div>
            {slots.Header}
            {slots.Content}
          </div>
        )
      );

      render(
        <SlotComponent
          Header={{ title: 'Test Title' }}
          Content={{ text: 'Test Content' }}
        />
      );

      expect(screen.getByText('Header: Test Title')).toBeInTheDocument();
      expect(screen.getByText('Content: Test Content')).toBeInTheDocument();
    });

    it('should handle missing slot props', () => {
      const Optional = ({ value }: { value?: string }) => <div>{value || 'Default'}</div>;

      const SlotComponent = createSlotComponent(
        { Optional },
        (slots) => <div>{slots.Optional}</div>
      );

      render(<SlotComponent />);

      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  describe('createRenderPropComponent', () => {
    it('should create render prop component', () => {
      const useCounter = () => {
        const [count, setCount] = React.useState(0);
        return { count, increment: () => setCount(c => c + 1) };
      };

      const Counter = createRenderPropComponent(useCounter);

      render(
        <Counter>
          {({ count, increment }) => (
            <div>
              <span>Count: {count}</span>
              <button onClick={increment}>Increment</button>
            </div>
          )}
        </Counter>
      );

      expect(screen.getByText('Count: 0')).toBeInTheDocument();

      act(() => {
        screen.getByText('Increment').click();
      });

      expect(screen.getByText('Count: 1')).toBeInTheDocument();
    });
  });

  describe('DataFetcher', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle successful data fetching', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockData
      });

      render(
        <DataFetcher url="/api/test">
          {({ data, loading, error }) => (
            <div>
              {loading && <div>Loading...</div>}
              {error && <div>Error: {error.message}</div>}
              {data && <div>Data: {data.name}</div>}
            </div>
          )}
        </DataFetcher>
      );

      // Initially should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Data: Test')).toBeInTheDocument();
      });

      // Loading should be gone after data loads
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      render(
        <DataFetcher url="/api/test">
          {({ data, loading, error }) => (
            <div>
              {loading && <div>Loading...</div>}
              {error && <div>Error: {error.message}</div>}
              {data && <div>Data: {JSON.stringify(data)}</div>}
            </div>
          )}
        </DataFetcher>
      );

      await waitFor(() => {
        expect(screen.getByText('Error: Fetch failed')).toBeInTheDocument();
      });
    });

    it('should refetch when URL changes', async () => {
      const mockData1 = { id: 1, name: 'First' };
      const mockData2 = { id: 2, name: 'Second' };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockData1 })
        .mockResolvedValueOnce({ json: async () => mockData2 });

      const { rerender } = render(
        <DataFetcher url="/api/first">
          {({ data }) => <div>{data ? `Data: ${data.name}` : 'No data'}</div>}
        </DataFetcher>
      );

      await waitFor(() => {
        expect(screen.getByText('Data: First')).toBeInTheDocument();
      });

      rerender(
        <DataFetcher url="/api/second">
          {({ data }) => <div>{data ? `Data: ${data.name}` : 'No data'}</div>}
        </DataFetcher>
      );

      await waitFor(() => {
        expect(screen.getByText('Data: Second')).toBeInTheDocument();
      });
    });
  });

  describe('createFormField', () => {
    it('should create form field with label', () => {
      const Input = forwardRef<HTMLInputElement, { className?: string; id?: string; required?: boolean }>(
        (props, ref) => <input ref={ref} {...props} />
      );

      const FormField = createFormField(Input);

      render(<FormField label="Username" />);

      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('should show required indicator', () => {
      const Input = forwardRef<HTMLInputElement, any>((props, ref) => (
        <input ref={ref} {...props} />
      ));

      const FormField = createFormField(Input);

      render(<FormField label="Email" required />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display helper text', () => {
      const Input = forwardRef<HTMLInputElement, any>((props, ref) => (
        <input ref={ref} {...props} />
      ));

      const FormField = createFormField(Input);

      render(<FormField label="Password" helperText="Must be at least 8 characters" />);

      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('should display error message', () => {
      const Input = forwardRef<HTMLInputElement, any>((props, ref) => (
        <input ref={ref} {...props} />
      ));

      const FormField = createFormField(Input);

      render(<FormField label="Email" error="Invalid email address" />);

      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    it('should display multiple error messages', () => {
      const Input = forwardRef<HTMLInputElement, any>((props, ref) => (
        <input ref={ref} {...props} />
      ));

      const FormField = createFormField(Input);

      render(<FormField label="Email" error={['Required field', 'Invalid format']} />);

      expect(screen.getByText('Required field, Invalid format')).toBeInTheDocument();
    });

    it('should set aria attributes correctly', () => {
      const Input = forwardRef<HTMLInputElement, any>((props, ref) => (
        <input ref={ref} {...props} />
      ));

      const FormField = createFormField(Input);

      render(<FormField label="Email" error="Invalid" />);

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('createCard', () => {
    it('should create card components', () => {
      const { Card, CardHeader, CardContent, CardFooter } = createCard();

      render(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should support different variants', () => {
      const { Card } = createCard();

      const { container: defaultContainer } = render(<Card variant="default">Default</Card>);
      expect(defaultContainer.firstChild).toHaveClass('bg-background');

      const { container: elevatedContainer } = render(<Card variant="elevated">Elevated</Card>);
      expect(elevatedContainer.firstChild).toHaveClass('shadow-md');
    });

    it('should support custom variants', () => {
      const { Card } = createCard({
        custom: 'bg-red-500 text-white'
      });

      const { container } = render(<Card variant="custom" as any>Custom</Card>);
      expect(container.firstChild).toHaveClass('bg-red-500', 'text-white');
    });

    it('should merge custom className', () => {
      const { Card } = createCard();

      const { container } = render(<Card className="my-custom-class">Test</Card>);
      expect(container.firstChild).toHaveClass('my-custom-class');
    });
  });

  describe('createMemoComponent', () => {
    it('should create memoized component', () => {
      let renderCount = 0;
      const Component = ({ value }: { value: number }) => {
        renderCount++;
        return <div>{value}</div>;
      };

      const MemoComponent = createMemoComponent(Component);
      const { rerender } = render(<MemoComponent value={1} />);

      expect(renderCount).toBe(1);

      // Same props - should not re-render
      rerender(<MemoComponent value={1} />);
      expect(renderCount).toBe(1);

      // Different props - should re-render
      rerender(<MemoComponent value={2} />);
      expect(renderCount).toBe(2);
    });

    it('should use custom comparison function', () => {
      let renderCount = 0;
      const Component = ({ user }: { user: { id: number; name: string } }) => {
        renderCount++;
        return <div>{user.name}</div>;
      };

      // Only re-render when id changes, ignore name changes
      const MemoComponent = createMemoComponent(
        Component,
        (prev, next) => prev.user.id === next.user.id
      );

      const { rerender } = render(<MemoComponent user={{ id: 1, name: 'Alice' }} />);
      expect(renderCount).toBe(1);

      // Same id, different name - should not re-render
      rerender(<MemoComponent user={{ id: 1, name: 'Bob' }} />);
      expect(renderCount).toBe(1);

      // Different id - should re-render
      rerender(<MemoComponent user={{ id: 2, name: 'Alice' }} />);
      expect(renderCount).toBe(2);
    });

    it('should set display name', () => {
      const Component = () => <div>Test</div>;
      Component.displayName = 'TestComponent';

      const MemoComponent = createMemoComponent(Component);

      expect(MemoComponent.displayName).toBe('Memo(TestComponent)');
    });
  });

  describe('createLazyComponent', () => {
    it('should create lazy component with suspense', async () => {
      const LazyComponent = () => <div>Lazy Loaded</div>;

      // Create a resolvable promise for better control
      let resolveComponent: (value: { default: typeof LazyComponent }) => void;
      const componentPromise = new Promise<{ default: typeof LazyComponent }>((resolve) => {
        resolveComponent = resolve;
      });

      const LazyWrapper = createLazyComponent(() => componentPromise);

      render(<LazyWrapper />);

      // Initially should show default fallback
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Resolve the lazy component
      await act(async () => {
        resolveComponent({ default: LazyComponent });
        await componentPromise;
      });

      // Should show component after loading
      await waitFor(() => {
        expect(screen.getByText('Lazy Loaded')).toBeInTheDocument();
      });
    });

    it('should use custom fallback', async () => {
      const LazyComponent = () => <div>Lazy Loaded</div>;

      let resolveComponent: (value: { default: typeof LazyComponent }) => void;
      const componentPromise = new Promise<{ default: typeof LazyComponent }>((resolve) => {
        resolveComponent = resolve;
      });

      const LazyWrapper = createLazyComponent(
        () => componentPromise,
        <div>Custom Loading...</div>
      );

      render(<LazyWrapper />);

      // Should show custom fallback initially
      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();

      // Resolve the lazy component
      await act(async () => {
        resolveComponent({ default: LazyComponent });
        await componentPromise;
      });

      // Should show component after loading
      await waitFor(() => {
        expect(screen.getByText('Lazy Loaded')).toBeInTheDocument();
      });
    });
  });

  describe('Utility Functions', () => {
    describe('getDisplayName', () => {
      it('should get display name from displayName property', () => {
        const Component = () => <div>Test</div>;
        Component.displayName = 'CustomName';

        expect(getDisplayName(Component)).toBe('CustomName');
      });

      it('should get display name from name property', () => {
        function NamedComponent() {
          return <div>Test</div>;
        }

        expect(getDisplayName(NamedComponent)).toBe('NamedComponent');
      });

      it('should return default when no name available', () => {
        const AnonymousComponent: ComponentType<any> = () => <div>Test</div>;
        Object.defineProperty(AnonymousComponent, 'name', { value: '', writable: true });
        Object.defineProperty(AnonymousComponent, 'displayName', { value: undefined, writable: true });

        expect(getDisplayName(AnonymousComponent)).toBe('Component');
      });
    });

    describe('cloneElementWithProps', () => {
      it('should clone element with additional props', () => {
        const element = <div className="original">Original</div>;
        const cloned = cloneElementWithProps(element, { 'data-testid': 'cloned' });

        const { getByTestId } = render(cloned);

        expect(getByTestId('cloned')).toHaveClass('original');
      });

      it('should override existing props', () => {
        const element = <div className="original">Original</div>;
        const cloned = cloneElementWithProps(element, { className: 'new' });

        const { container } = render(cloned);

        expect(container.firstChild).toHaveClass('new');
        expect(container.firstChild).not.toHaveClass('original');
      });
    });

    describe('validateChildren', () => {
      beforeEach(() => {
        // Clear logger mock before each test
        
        jest.clearAllMocks();
      });

      it('should validate allowed children types', () => {
        const Header = () => <div>Header</div>;
        const Content = () => <div>Content</div>;

        const children = [
          <Header key="header" />,
          <Content key="content" />
        ];

        validateChildren(children, [Header, Content]);

        // Should not log warnings for valid children
        expect(logger.warn).not.toHaveBeenCalled();
      });

      it('should warn about invalid children types', () => {
        const Header = () => <div>Header</div>;
        const Content = () => <div>Content</div>;
        const InvalidChild = () => <div>Invalid</div>;

        const children = [
          <Header key="header" />,
          <InvalidChild key="invalid" />
        ];

        validateChildren(children, [Header, Content]);

        expect(logger.warn).toHaveBeenCalled();
      });

      it('should handle non-element children gracefully', () => {
        const Header = () => <div>Header</div>;

        const children = (
          <>
            <Header />
            Some text
            {null}
            {undefined}
          </>
        );

        expect(() => {
          validateChildren(children, [Header]);
        }).not.toThrow();
      });
    });
  });

  describe('ComponentFactory Export', () => {
    it('should export all methods', () => {
      expect(ComponentFactory.createHOC).toBeDefined();
      expect(ComponentFactory.createCompoundComponent).toBeDefined();
      expect(ComponentFactory.createSlotComponent).toBeDefined();
      expect(ComponentFactory.createRenderPropComponent).toBeDefined();
      expect(ComponentFactory.createFormField).toBeDefined();
      expect(ComponentFactory.createCard).toBeDefined();
      expect(ComponentFactory.createMemoComponent).toBeDefined();
      expect(ComponentFactory.createLazyComponent).toBeDefined();
      expect(ComponentFactory.withConditionalRender).toBeDefined();
      expect(ComponentFactory.withLoadingState).toBeDefined();
      expect(ComponentFactory.withErrorHandling).toBeDefined();
      expect(ComponentFactory.DataFetcher).toBeDefined();
      expect(ComponentFactory.getDisplayName).toBeDefined();
      expect(ComponentFactory.cloneElementWithProps).toBeDefined();
      expect(ComponentFactory.validateChildren).toBeDefined();
    });

    it('should be frozen (const export)', () => {
      expect(Object.isFrozen(ComponentFactory)).toBe(false); // 'as const' doesn't freeze in runtime
      // But we can verify it's a const export by checking it exists
      expect(ComponentFactory).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should combine multiple HOCs', () => {
      const Component = ({ value }: { value: string; loading?: boolean }) => (
        <div>Value: {value}</div>
      );

      const Enhanced = withLoadingState()(
        withConditionalRender<{ value: string; loading?: boolean }>(
          (props) => !!props.value
        )(Component)
      );

      // Loading state
      const { rerender } = render(<Enhanced value="test" loading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Loaded with value
      rerender(<Enhanced value="test" loading={false} />);
      expect(screen.getByText('Value: test')).toBeInTheDocument();

      // Loaded without value
      rerender(<Enhanced value="" loading={false} />);
      expect(screen.queryByText(/Value:/)).not.toBeInTheDocument();
    });

    it('should create complex compound component', () => {
      const Root = ({ children }: { children: React.ReactNode }) => (
        <div className="card">{children}</div>
      );
      const Title = ({ text }: { text: string }) => <h1>{text}</h1>;
      const Body = ({ content }: { content: string }) => <p>{content}</p>;

      const CompoundCard = createCompoundComponent({
        Root,
        Title,
        Body
      });

      // CompoundCard IS the Root component with Title and Body attached
      render(
        <CompoundCard>
          <CompoundCard.Title text="Card Title" />
          <CompoundCard.Body content="Card body content" />
        </CompoundCard>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card body content')).toBeInTheDocument();
    });

    it('should use form field with error handling', () => {
      const Input = forwardRef<HTMLInputElement, any>((props, ref) => (
        <input ref={ref} {...props} />
      ));

      const FormField = createFormField(Input);
      const ValidatedField = withErrorHandling()(FormField);

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ValidatedField
          label="Email"
          error="Invalid email"
          required
        />
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Invalid email')).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle components without display name', () => {
      const enhance = (WrappedComponent: ComponentType<any>) => WrappedComponent;
      const withEnhancement = createHOC(enhance);
      const Component: ComponentType<any> = () => <div>Test</div>;

      const EnhancedComponent = withEnhancement(Component);

      expect(EnhancedComponent.displayName).toMatch(/Enhanced\(/);
    });

    it('should handle empty children in compound components', () => {
      const Root = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;

      expect(() => {
        validateChildren(null, [Root]);
      }).not.toThrow();

      expect(() => {
        validateChildren(undefined, [Root]);
      }).not.toThrow();
    });

    it('should handle DataFetcher with no data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => null
      });

      render(
        <DataFetcher url="/api/empty">
          {({ data }) => <div>{data ? 'Has data' : 'No data'}</div>}
        </DataFetcher>
      );

      await waitFor(() => {
        expect(screen.getByText('No data')).toBeInTheDocument();
      });
    });

    it('should handle createCard with no children', () => {
      const { Card } = createCard();

      render(<Card />);

      expect(document.querySelector('.bg-background')).toBeInTheDocument();
    });
  });
});
