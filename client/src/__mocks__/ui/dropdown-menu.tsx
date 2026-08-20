import React from 'react';

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="dropdown-menu">{children}</div>
);

export const DropdownMenuTrigger = ({ 
  children, 
  asChild, 
  ...props 
}: { 
  children: React.ReactNode; 
  asChild?: boolean; 
  [key: string]: any 
}) => {
  const { asChild: _, ...restProps } = props;
  if (asChild && React.isValidElement(children)) {
    const childProps = (children as React.ReactElement<Record<string, unknown>>).props;
    return React.cloneElement(children, {
      ...childProps,
      'data-testid': (childProps['data-testid'] as string) || 'dropdown-menu-trigger'
    } as React.Attributes & Record<string, unknown>);
  }
  return <div data-testid="dropdown-menu-trigger" {...restProps}>{children}</div>;
};

export const DropdownMenuContent = ({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode; 
  [key: string]: unknown 
}) => (
  <div data-testid="dropdown-menu-content" {...props}>{children}</div>
);

export const DropdownMenuItem = ({ 
  children, 
  onClick, 
  ...props 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  [key: string]: unknown 
}) => (
  <div 
    role="menuitem" 
    data-testid="dropdown-menu-item" 
    onClick={onClick} 
    {...props}
  >
    {children}
  </div>
);

export const DropdownMenuSeparator = () => <div data-testid="dropdown-menu-separator" />;

export const DropdownMenuLabel = ({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode; 
  [key: string]: unknown 
}) => (
  <div data-testid="dropdown-menu-label" {...props}>{children}</div>
);

export const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="dropdown-menu-group">{children}</div>
);

export const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="dropdown-menu-sub">{children}</div>
);

export const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="dropdown-menu-sub-content">{children}</div>
);

export const DropdownMenuSubTrigger = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="dropdown-menu-sub-trigger">{children}</div>
);

export const DropdownMenuCheckboxItem = ({ 
  children, 
  checked, 
  onCheckedChange,
  ...props 
}: { 
  children: React.ReactNode; 
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  [key: string]: unknown 
}) => (
  <div 
    data-testid="dropdown-menu-checkbox-item" 
    data-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    {...props}
  >
    {children}
  </div>
);

export const DropdownMenuRadioGroup = ({ children, value }: { 
  children: React.ReactNode; 
  value?: string;
  onValueChange?: (value: string) => void;
}) => (
  <div data-testid="dropdown-menu-radio-group" data-value={value}>
    {children}
  </div>
);

export const DropdownMenuRadioItem = ({ 
  children, 
  value,
  ...props 
}: { 
  children: React.ReactNode; 
  value?: string;
  [key: string]: unknown 
}) => (
  <div data-testid="dropdown-menu-radio-item" data-value={value} {...props}>
    {children}
  </div>
);

export const DropdownMenuShortcut = ({ children }: { children: React.ReactNode }) => (
  <span data-testid="dropdown-menu-shortcut">{children}</span>
);