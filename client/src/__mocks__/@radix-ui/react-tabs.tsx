/**
 * Mock for @radix-ui/react-tabs - External library boundary mock
 */
import * as React from 'react';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

interface RootProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  activationMode?: 'automatic' | 'manual';
}

export const Root = React.forwardRef<HTMLDivElement, RootProps>(
  function TabsRoot({ value: controlledValue, defaultValue = '', onValueChange, children, ...props }, ref) {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const handleValueChange = React.useCallback((newValue: string) => {
      if (!isControlled) setInternalValue(newValue);
      onValueChange?.(newValue);
    }, [isControlled, onValueChange]);

    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} data-testid="tabs-root" {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

export const List = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function TabsList({ children, ...props }, ref) {
    return <div ref={ref} role="tablist" {...props}>{children}</div>;
  }
);

interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const Trigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  function TabsTrigger({ children, value, onClick, ...props }, ref) {
    const context = React.useContext(TabsContext);
    const selected = context?.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={selected}
        data-state={selected ? 'active' : 'inactive'}
        data-value={value}
        onClick={(e) => {
          context?.onValueChange(value);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
}

export const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  function TabsContent({ children, value, forceMount, ...props }, ref) {
    const context = React.useContext(TabsContext);
    const selected = context?.value === value;

    if (!selected && !forceMount) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={selected ? 'active' : 'inactive'}
        data-value={value}
        hidden={!selected}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const Tabs = Root;
export const TabsList = List;
export const TabsTrigger = Trigger;
export const TabsContent = Content;
