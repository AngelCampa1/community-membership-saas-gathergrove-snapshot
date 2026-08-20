/**
 * Mock for @radix-ui/react-dropdown-menu - External library boundary mock
 */
import * as React from 'react';

export const Root: React.FC<{ open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }> = ({
  open,
  children
}) => <div data-state={open ? 'open' : 'closed'}>{children}</div>;

export const Trigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  function DropdownMenuTrigger({ children, asChild, ...props }, ref) {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, { ...props, ref });
    }
    return <button ref={ref} type="button" {...props}>{children}</button>;
  }
);

export const Portal: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

export const Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DropdownMenuContent({ children, ...props }, ref) {
    return <div ref={ref} role="menu" {...props}>{children}</div>;
  }
);

export const Item = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { onSelect?: () => void; disabled?: boolean }>(
  function DropdownMenuItem({ children, onSelect, onClick, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="menuitem"
        onClick={(e) => {
          onSelect?.();
          (onClick as React.MouseEventHandler<HTMLDivElement>)?.(e);
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const CheckboxItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }>(
  function DropdownMenuCheckboxItem({ children, checked, onCheckedChange, ...props }, ref) {
    return (
      <div ref={ref} role="menuitemcheckbox" aria-checked={checked} onClick={() => onCheckedChange?.(!checked)} {...props}>
        {children}
      </div>
    );
  }
);

export const RadioGroup: React.FC<{ children?: React.ReactNode; value?: string; onValueChange?: (value: string) => void }> = ({
  children
}) => <div role="group">{children}</div>;

export const RadioItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  function DropdownMenuRadioItem({ children, value, ...props }, ref) {
    return <div ref={ref} role="menuitemradio" data-value={value} {...props}>{children}</div>;
  }
);

export const Sub: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

export const SubTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DropdownMenuSubTrigger({ children, ...props }, ref) {
    return <div ref={ref} {...props}>{children}</div>;
  }
);

export const SubContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DropdownMenuSubContent({ children, ...props }, ref) {
    return <div ref={ref} role="menu" {...props}>{children}</div>;
  }
);

export const Label: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const Separator: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => <hr {...props} />;

export const ItemIndicator: React.FC<{ children?: React.ReactNode }> = ({ children }) => <span>{children}</span>;

export const Arrow: React.FC = () => null;

export const Group: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div role="group">{children}</div>;

// Namespace exports
export const DropdownMenu = Root;
export const DropdownMenuTrigger = Trigger;
export const DropdownMenuPortal = Portal;
export const DropdownMenuContent = Content;
export const DropdownMenuItem = Item;
export const DropdownMenuCheckboxItem = CheckboxItem;
export const DropdownMenuRadioGroup = RadioGroup;
export const DropdownMenuRadioItem = RadioItem;
export const DropdownMenuSub = Sub;
export const DropdownMenuSubTrigger = SubTrigger;
export const DropdownMenuSubContent = SubContent;
export const DropdownMenuLabel = Label;
export const DropdownMenuSeparator = Separator;
export const DropdownMenuItemIndicator = ItemIndicator;
export const DropdownMenuArrow = Arrow;
export const DropdownMenuGroup = Group;
