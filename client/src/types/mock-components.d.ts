/**
 * Mock component type definitions for testing
 * Provides proper typing for all mock UI components
 */

import React from 'react';

// Base mock component props that accepts any valid React props
export interface BaseMockProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent) => void;
  onChange?: (event: React.ChangeEvent<any>) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onSubmit?: (event: React.FormEvent) => void;
  onCheckedChange?: (checked: boolean) => void;
  onValueChange?: (value: string | string[]) => void;
  onSelect?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSuccess?: () => void;
  disabled?: boolean;
  checked?: boolean;
  value?: any;
  defaultValue?: any;
  placeholder?: string;
  type?: string;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-checked'?: boolean;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'data-testid'?: string;
  'data-value'?: string;
  'data-state'?: string;
  ref?: React.Ref<any>;
  asChild?: boolean;
  open?: boolean;
  isOpen?: boolean;
  htmlFor?: string;
  rows?: number;
  cols?: number;
  variant?: string;
  size?: string | number;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
  id?: string;
  name?: string;
  title?: string;
  alt?: string;
  src?: string;
  href?: string;
  target?: string;
  rel?: string;
  download?: string;
  accept?: string;
  multiple?: boolean;
  readonly?: boolean;
  spellCheck?: boolean;
  autoComplete?: string;
  form?: string;
  formAction?: string;
  formEncType?: string;
  formMethod?: string;
  formNoValidate?: boolean;
  formTarget?: string;
  [key: string]: any;
}

// Mock render function that returns proper JSX
export type MockRenderFunction = (props: BaseMockProps) => React.ReactElement;

// Specific mock component types for common UI elements
export interface MockButtonProps extends BaseMockProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export interface MockInputProps extends BaseMockProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'file' | 'hidden' | 'checkbox' | 'radio' | 'range';
}

export interface MockSelectProps extends BaseMockProps {
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
}

export interface MockDialogProps extends BaseMockProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface MockCheckboxProps extends BaseMockProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export interface MockSliderProps extends BaseMockProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

export interface MockSwitchProps extends BaseMockProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export interface MockProgressProps extends BaseMockProps {
  value?: number;
  max?: number;
}

export interface MockBadgeProps extends BaseMockProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface MockCardProps extends BaseMockProps {
  // Card specific props
  variant?: string;
}

export interface MockTableProps extends BaseMockProps {
  // Table specific props
  variant?: string;
}

export interface MockAlertProps extends BaseMockProps {
  variant?: 'default' | 'destructive';
}

export interface MockTabsProps extends BaseMockProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

// Mock component factory
export type MockComponent<T = BaseMockProps> = React.ComponentType<T>;

// Helper type for mock component with children
export type MockComponentWithChildren<T = Record<string, unknown>> = React.ComponentType<T & { children?: React.ReactNode }>;

// Utility type for converting props to mock-safe props
export type MockSafe<T> = T & BaseMockProps;

// Export commonly used React types
export type { ReactNode, ReactElement, ComponentType, Ref } from 'react';