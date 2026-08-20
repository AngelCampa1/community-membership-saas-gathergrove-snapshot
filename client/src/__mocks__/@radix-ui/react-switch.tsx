/**
 * Mock for @radix-ui/react-switch - External library boundary mock
 */
import * as React from 'react';

interface RootProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  required?: boolean;
}

export const Root = React.forwardRef<HTMLButtonElement, RootProps>(
  function SwitchRoot({ checked: controlledChecked, defaultChecked = false, onCheckedChange, children, ...props }, ref) {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : internalChecked;

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        onClick={() => {
          const newValue = !checked;
          if (!isControlled) setInternalChecked(newValue);
          onCheckedChange?.(newValue);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

export const Thumb = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function SwitchThumb(props, ref) {
    return <span ref={ref} {...props} />;
  }
);

export const Switch = Root;
export const SwitchThumb = Thumb;
