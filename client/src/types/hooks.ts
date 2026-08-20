/**
 * Common hook type definitions
 * Provides type safety for custom React hooks
 */

import { DependencyList } from 'react';

/**
 * Generic hook return type with data, loading, and error states
 * @template TData - The type of data returned
 * @template TError - The type of error that can occur
 */
export interface HookResult<TData = unknown, TError = Error> {
  data: TData | null;
  isLoading: boolean;
  isError: boolean;
  error: TError | null;
  refetch?: () => Promise<void> | void;
}

/**
 * Async hook return type with additional loading states
 * @template TData - The type of data returned
 * @template TError - The type of error that can occur
 */
export interface AsyncHookResult<TData = unknown, TError = Error>
  extends HookResult<TData, TError> {
  isIdle: boolean;
  isSuccess: boolean;
  isFetching: boolean;
}

/**
 * Mutation hook return type
 * @template TData - The type of data returned
 * @template TVariables - The type of variables passed
 * @template TError - The type of error that can occur
 */
export interface MutationHookResult<
  TData = unknown,
  TVariables = unknown,
  TError = Error
> {
  data: TData | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: TError | null;
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

/**
 * Debounced value hook result
 * @template T - The type of the debounced value
 */
export interface DebouncedValue<T> {
  value: T;
  isPending: boolean;
}

/**
 * Local storage hook result
 * @template T - The type of the stored value
 */
export interface LocalStorageHookResult<T> {
  value: T | null;
  setValue: (value: T | ((prev: T | null) => T)) => void;
  removeValue: () => void;
  isLoading: boolean;
}

/**
 * Async effect hook configuration
 */
export interface AsyncEffectConfig {
  effect: () => Promise<void>;
  deps?: DependencyList;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

/**
 * Interval hook configuration
 */
export interface IntervalConfig {
  callback: () => void | Promise<void>;
  delay: number | null;
  immediate?: boolean;
}

/**
 * Timeout hook configuration
 */
export interface TimeoutConfig {
  callback: () => void | Promise<void>;
  delay: number;
}

/**
 * Previous value hook result
 * @template T - The type of the value
 */
export type PreviousValue<T> = T | undefined;

/**
 * Toggle hook result
 */
export interface ToggleHookResult {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
  setValue: (value: boolean) => void;
}

/**
 * Counter hook result
 */
export interface CounterHookResult {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (count: number) => void;
}

/**
 * Pagination hook result
 */
export interface PaginationHookResult {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

/**
 * Sorting hook result
 * @template TKey - The type of sortable keys
 */
export interface SortingHookResult<TKey extends string = string> {
  sortKey: TKey | null;
  sortDirection: 'asc' | 'desc';
  sort: (key: TKey) => void;
  reset: () => void;
}

/**
 * Filter hook result
 * @template TFilters - The type of filter values
 */
export interface FilterHookResult<TFilters = Record<string, unknown>> {
  filters: TFilters;
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  setFilters: (filters: Partial<TFilters>) => void;
  resetFilters: () => void;
  clearFilter: (key: keyof TFilters) => void;
  activeFilterCount: number;
}

/**
 * Form hook result
 * @template TValues - The type of form values
 */
export interface FormHookResult<TValues = Record<string, unknown>> {
  values: TValues;
  errors: Partial<Record<keyof TValues, string>>;
  touched: Partial<Record<keyof TValues, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  handleChange: <K extends keyof TValues>(
    name: K,
    value: TValues[K]
  ) => void;
  handleBlur: (name: keyof TValues) => void;
  handleSubmit: (onSubmit: (values: TValues) => Promise<void> | void) => Promise<void>;
  setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  setFieldError: (name: keyof TValues, error: string) => void;
  resetForm: () => void;
  validateField: (name: keyof TValues) => boolean;
  validateForm: () => boolean;
}

/**
 * Modal hook result
 */
export interface ModalHookResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Disclosure hook result (similar to modal but more generic)
 */
export interface DisclosureHookResult {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
}

/**
 * Clipboard hook result
 */
export interface ClipboardHookResult {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  reset: () => void;
}

/**
 * Media query hook result
 */
export interface MediaQueryHookResult {
  matches: boolean;
  isLoading: boolean;
}

/**
 * Window size hook result
 */
export interface WindowSizeHookResult {
  width: number;
  height: number;
  isLoading: boolean;
}

/**
 * Scroll position hook result
 */
export interface ScrollPositionHookResult {
  x: number;
  y: number;
  scrollTo: (x: number, y: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

/**
 * Intersection observer hook result
 */
export interface IntersectionObserverHookResult {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Resize observer hook result
 */
export interface ResizeObserverHookResult {
  width: number;
  height: number;
  entry: ResizeObserverEntry | null;
}

/**
 * Network status hook result
 */
export interface NetworkStatusHookResult {
  isOnline: boolean;
  isOffline: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * Geolocation hook result
 */
export interface GeolocationHookResult {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Battery status hook result
 */
export interface BatteryStatusHookResult {
  level: number | null;
  charging: boolean | null;
  chargingTime: number | null;
  dischargingTime: number | null;
  isLoading: boolean;
}

/**
 * Idle detection hook result
 */
export interface IdleDetectionHookResult {
  isIdle: boolean;
  idleTime: number;
  reset: () => void;
}

/**
 * Focus trap hook result
 */
export interface FocusTrapHookResult {
  isActive: boolean;
  activate: () => void;
  deactivate: () => void;
}

/**
 * Click outside hook callback
 */
export type ClickOutsideCallback = (event: MouseEvent | TouchEvent) => void;

/**
 * Key press hook callback
 */
export type KeyPressCallback = (event: KeyboardEvent) => void;

/**
 * Event listener options
 */
export interface EventListenerOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

/**
 * Hook with cleanup function
 */
export type HookCleanup = () => void;

/**
 * Generic hook factory type
 * @template TArgs - The types of arguments the hook accepts
 * @template TResult - The type of result the hook returns
 */
export type HookFactory<TArgs extends unknown[] = [], TResult = unknown> = (
  ...args: TArgs
) => TResult;