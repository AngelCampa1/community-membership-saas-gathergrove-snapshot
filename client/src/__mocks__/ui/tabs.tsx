import React from 'react';

// Context for managing active tab state
const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
}>({
  activeTab: '',
  setActiveTab: () => {}
});

export const Tabs = ({ children, defaultValue, value, onValueChange, ...props }: any) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue || '');

  const handleTabChange = (newValue: string) => {
    setActiveTab(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div data-testid="tabs" data-default-value={defaultValue} data-active-tab={activeTab} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, ...props }: any) => (
  <div data-testid="tabs-list" role="tablist" {...props}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, onClick, ...props }: any) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);

  const handleClick = (e: any) => {
    setActiveTab(value);
    onClick?.(e);
  };

  // Extract text content for accessible name
  const accessibleName = typeof children === 'string' ? children : value;

  return (
    <button
      data-testid={`tab-trigger-${value}`}
      data-value={value}
      data-state={activeTab === value ? 'active' : 'inactive'}
      role="tab"
      type="button"
      aria-label={accessibleName}
      aria-selected={activeTab === value}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, ...props }: any) => {
  const { activeTab } = React.useContext(TabsContext);

  // Only render content if this tab is active
  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      data-testid={`tab-content-${value}`}
      data-value={value}
      role="tabpanel"
      {...props}
    >
      {children}
    </div>
  );
};
