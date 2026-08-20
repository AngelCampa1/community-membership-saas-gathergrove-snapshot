/**
 * Common component prop types
 * Reusable prop interfaces for React components
 */

import { ReactNode, CSSProperties, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

/**
 * Base component props with children
 */
export interface WithChildren {
  children?: ReactNode;
}

/**
 * Base component props with className
 */
export interface WithClassName {
  className?: string;
}

/**
 * Base component props with style
 */
export interface WithStyle {
  style?: CSSProperties;
}

/**
 * Common component props combining frequently used properties
 */
export interface CommonComponentProps extends WithChildren, WithClassName, WithStyle {
  testId?: string;
}

/**
 * Button variant types
 */
export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link';

/**
 * Button size types
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * Button component props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, WithChildren {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/**
 * Input component props
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}

/**
 * Label component props
 */
export interface LabelProps extends HTMLAttributes<HTMLLabelElement>, WithChildren {
  htmlFor?: string;
  required?: boolean;
}

/**
 * Textarea component props
 */
export interface TextareaProps extends HTMLAttributes<HTMLTextAreaElement> {
  value?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  error?: string;
}

/**
 * Card component props
 */
export interface CardProps extends CommonComponentProps {
  variant?: 'default' | 'outline' | 'filled';
  hoverable?: boolean;
}

/**
 * Dialog/Modal component props
 */
export interface DialogProps extends WithChildren {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  showClose?: boolean;
}

/**
 * Badge variant types
 */
export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

/**
 * Badge component props
 */
export interface BadgeProps extends WithChildren, WithClassName {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
}

/**
 * Progress component props
 */
export interface ProgressProps extends WithClassName {
  value?: number;
  max?: number;
  showLabel?: boolean;
  color?: string;
}

/**
 * Checkbox component props
 */
export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
}

/**
 * Switch component props
 */
export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Select option type
 */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/**
 * Select component props
 */
export interface SelectProps<T = string> extends WithClassName {
  value?: T;
  onChange?: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
}

/**
 * Slot component props (for composition)
 */
export interface SlotProps extends HTMLAttributes<HTMLElement>, WithChildren {
  asChild?: boolean;
}

/**
 * Polymorphic component props
 * @template TElement - HTML element type
 */
export type PolymorphicComponentProps<TElement extends React.ElementType> = {
  as?: TElement;
} & Omit<React.ComponentPropsWithoutRef<TElement>, 'as'>;

/**
 * Form field state
 */
export interface FormFieldState {
  value: unknown;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

/**
 * Form field props
 */
export interface FormFieldProps extends WithClassName {
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

/**
 * Loading state props
 */
export interface WithLoadingState {
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Error state props
 */
export interface WithErrorState {
  isError?: boolean;
  error?: string | Error;
}

/**
 * Data state props (combines loading, error, and empty states)
 */
export interface DataStateProps<T = unknown> extends WithLoadingState, WithErrorState {
  data?: T;
  isEmpty?: boolean;
  emptyText?: string;
}

/**
 * Pagination props
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
}

/**
 * Tooltip props
 */
export interface TooltipProps extends WithChildren {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

/**
 * Popover props
 */
export interface PopoverProps extends WithChildren {
  content: ReactNode;
  trigger?: 'click' | 'hover' | 'focus';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dropdown menu item
 */
export interface DropdownMenuItem {
  label: ReactNode;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * Dropdown menu props
 */
export interface DropdownMenuProps extends WithChildren {
  items: DropdownMenuItem[];
  trigger?: ReactNode;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

/**
 * Avatar props
 */
export interface AvatarProps extends WithClassName {
  src?: string;
  alt?: string;
  fallback?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Tabs props
 */
export interface TabsProps extends WithChildren {
  value: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
}

/**
 * Tab item
 */
export interface TabItem {
  label: ReactNode;
  value: string;
  content: ReactNode;
  disabled?: boolean;
}

/**
 * Alert variant types
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Alert props
 */
export interface AlertProps extends WithChildren, WithClassName {
  variant?: AlertVariant;
  title?: ReactNode;
  onClose?: () => void;
  icon?: ReactNode;
}

/**
 * Toast notification props
 */
export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: AlertVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Skeleton loader props
 */
export interface SkeletonProps extends WithClassName {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Empty state props
 */
export interface EmptyStateProps extends WithClassName {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Table column definition
 */
export interface TableColumn<T = unknown> {
  key: string;
  label: ReactNode;
  width?: string | number;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
}

/**
 * Table props
 */
export interface TableProps<T = unknown> extends WithClassName {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}