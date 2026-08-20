/**
 * RadixUI Component Mocks for Jest Testing
 * Provides simplified mock implementations of RadixUI components
 */

import React, { ReactNode, ChangeEvent } from 'react';

// Type definitions for mock components
interface SlotProps {
  children: ReactNode;
  [key: string]: unknown;
}

interface SlottableProps {
  children: ReactNode;
}

// Mock @radix-ui/react-slot
export const slotMocks = {
  Slot: ({ children, ...props }: SlotProps) => React.createElement('div', props, children),
  Slottable: ({ children }: SlottableProps) => children,
};

interface DialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogComponentProps {
  children: ReactNode;
  [key: string]: unknown;
}

// Mock RadixUI Dialog components
export const dialogMocks = {
  Dialog: ({ children, open, onOpenChange }: DialogProps) => {
    return open ? React.createElement('div', {
      'data-testid': 'dialog',
      onClick: () => onOpenChange?.(false)
    }, children) : null;
  },
  DialogContent: ({ children, ...props }: DialogComponentProps) =>
    React.createElement('div', { 'data-testid': 'dialog-content', ...props }, children),
  DialogHeader: ({ children, ...props }: DialogComponentProps) =>
    React.createElement('div', { 'data-testid': 'dialog-header', ...props }, children),
  DialogTitle: ({ children, ...props }: DialogComponentProps) =>
    React.createElement('h2', { 'data-testid': 'dialog-title', ...props }, children),
  DialogDescription: ({ children, ...props }: DialogComponentProps) =>
    React.createElement('p', { 'data-testid': 'dialog-description', ...props }, children),
  DialogFooter: ({ children, ...props }: DialogComponentProps) =>
    React.createElement('div', { 'data-testid': 'dialog-footer', ...props }, children),
  DialogTrigger: ({ children, ...props }: DialogComponentProps) =>
    React.createElement('button', { 'data-testid': 'dialog-trigger', ...props }, children),
  DialogClose: ({ children, ...props }: DialogComponentProps) =>
    React.createElement('button', { 'data-testid': 'dialog-close', ...props }, children),
};

interface ButtonProps {
  children: ReactNode;
  variant?: string;
  size?: string;
  disabled?: boolean;
  onClick?: () => void;
  [key: string]: unknown;
}

// Mock RadixUI Button components
export const buttonMocks = {
  Button: ({ children, variant, size, disabled, onClick, ...props }: ButtonProps) =>
    React.createElement('button', {
      'data-testid': 'button',
      'data-variant': variant,
      'data-size': size,
      disabled,
      onClick,
      ...props
    }, children),
};

interface InputProps {
  type?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  [key: string]: unknown;
}

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  [key: string]: unknown;
}

interface TextareaProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  [key: string]: unknown;
}

// Mock RadixUI Input/Form components
export const formMocks = {
  Input: ({ type, value, onChange, placeholder, disabled, ...props }: InputProps) =>
    React.createElement('input', {
      'data-testid': 'input',
      type,
      value,
      onChange,
      placeholder,
      disabled,
      ...props
    }),
  Label: ({ children, htmlFor, ...props }: LabelProps) =>
    React.createElement('label', { 'data-testid': 'label', htmlFor, ...props }, children),
  Textarea: ({ value, onChange, placeholder, disabled, rows, ...props }: TextareaProps) =>
    React.createElement('textarea', {
      'data-testid': 'textarea',
      value,
      onChange,
      placeholder,
      disabled,
      rows,
      ...props
    }),
};

interface CardComponentProps {
  children: ReactNode;
  [key: string]: unknown;
}

// Mock RadixUI Card components
export const cardMocks = {
  Card: ({ children, ...props }: CardComponentProps) =>
    React.createElement('div', { 'data-testid': 'card', ...props }, children),
  CardHeader: ({ children, ...props }: CardComponentProps) =>
    React.createElement('div', { 'data-testid': 'card-header', ...props }, children),
  CardContent: ({ children, ...props }: CardComponentProps) =>
    React.createElement('div', { 'data-testid': 'card-content', ...props }, children),
  CardFooter: ({ children, ...props }: CardComponentProps) =>
    React.createElement('div', { 'data-testid': 'card-footer', ...props }, children),
  CardTitle: ({ children, ...props }: CardComponentProps) =>
    React.createElement('h3', { 'data-testid': 'card-title', ...props }, children),
  CardDescription: ({ children, ...props }: CardComponentProps) =>
    React.createElement('p', { 'data-testid': 'card-description', ...props }, children),
};

interface BadgeProps {
  children: ReactNode;
  variant?: string;
  [key: string]: unknown;
}

interface ProgressProps {
  value?: number;
  max?: number;
  [key: string]: unknown;
}

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  [key: string]: unknown;
}

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  [key: string]: unknown;
}

// Mock other commonly used RadixUI components
export const otherMocks = {
  Badge: ({ children, variant, ...props }: BadgeProps) =>
    React.createElement('span', { 'data-testid': 'badge', 'data-variant': variant, ...props }, children),

  Progress: ({ value, max, ...props }: ProgressProps) =>
    React.createElement('div', {
      'data-testid': 'progress',
      'data-value': value,
      'data-max': max,
      ...props
    }, React.createElement('div', { style: { width: `${(value ?? 0) / (max || 100) * 100}%` } })),

  Checkbox: ({ checked, onCheckedChange, disabled, ...props }: CheckboxProps) =>
    React.createElement('input', {
      'data-testid': 'checkbox',
      type: 'checkbox',
      checked,
      onChange: (e: ChangeEvent<HTMLInputElement>) => onCheckedChange?.(e.target.checked),
      disabled,
      ...props
    }),

  Switch: ({ checked, onCheckedChange, disabled, ...props }: SwitchProps) =>
    React.createElement('button', {
      'data-testid': 'switch',
      'data-state': checked ? 'checked' : 'unchecked',
      onClick: () => !disabled && onCheckedChange?.(!checked),
      disabled,
      ...props
    }, React.createElement('span')),
};

// Export all mocks
export default {
  ...slotMocks,
  ...dialogMocks,
  ...buttonMocks,
  ...formMocks,
  ...cardMocks,
  ...otherMocks,
};