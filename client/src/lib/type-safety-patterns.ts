/**
 * Type Safety Patterns - Perfect TypeScript Implementation
 * 
 * Provides comprehensive TypeScript patterns, utilities, and safety mechanisms
 * for bulletproof type safety across the entire frontend application.
 */

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties of T required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract function parameters
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

/**
 * Extract async function return type
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

/**
 * Extract array element type
 */
export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

/**
 * Extract object values as union type
 */
export type ValueOf<T> = T[keyof T];

/**
 * Extract keys of specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Omit by value type
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

/**
 * Pick by value type
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

// ============================================================================
// BRANDED TYPES
// ============================================================================

/**
 * Create branded type for compile-time safety
 */
export type Brand<T, TBrand> = T & { __brand: TBrand };

/**
 * Common branded types
 */
export type Email = Brand<string, 'Email'>;
export type UserId = Brand<number, 'UserId'>;
export type ClubId = Brand<number, 'ClubId'>;
export type Timestamp = Brand<number, 'Timestamp'>;
export type NonEmptyString = Brand<string, 'NonEmptyString'>;
export type PositiveNumber = Brand<number, 'PositiveNumber'>;

/**
 * Type guards for branded types
 */
export const isEmail = (value: string): value is Email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const isNonEmptyString = (value: string): value is NonEmptyString => {
  return value.trim().length > 0;
};

export const isPositiveNumber = (value: number): value is PositiveNumber => {
  return value > 0 && Number.isFinite(value);
};

// ============================================================================
// DISCRIMINATED UNIONS
// ============================================================================

/**
 * API Response discriminated union
 */
export type ApiResponse<TData> =
  | { success: true; data: TData; error?: never }
  | { success: false; data?: never; error: string };

/**
 * Async state discriminated union
 */
export type AsyncState<TData, TError = Error> =
  | { status: 'idle'; data?: never; error?: never }
  | { status: 'loading'; data?: never; error?: never }
  | { status: 'success'; data: TData; error?: never }
  | { status: 'error'; data?: never; error: TError };

/**
 * Form field state discriminated union
 */
export type FieldState<TValue> =
  | { status: 'pristine'; value: TValue; error?: never }
  | { status: 'valid'; value: TValue; error?: never }
  | { status: 'invalid'; value: TValue; error: string };

// ============================================================================
// CONDITIONAL TYPES
// ============================================================================

/**
 * Check if type extends string
 */
export type IsString<T> = T extends string ? true : false;

/**
 * Check if type is never
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Check if type is any
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Check if type is unknown
 */
export type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;

/**
 * Filter nullable types
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extract required properties
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: Record<string, unknown> extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Extract optional properties
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: Record<string, unknown> extends Pick<T, K> ? K : never;
}[keyof T];

// ============================================================================
// FUNCTION TYPE UTILITIES
// ============================================================================

/**
 * Event handler types with proper typing
 */
export type EventHandler<T = Element, E = Event> = (event: E & { currentTarget: T }) => void;

export type ChangeHandler<T = HTMLInputElement> = EventHandler<T, React.ChangeEvent<T>>;
export type ClickHandler<T = HTMLButtonElement> = EventHandler<T, React.MouseEvent<T>>;
export type SubmitHandler<T = HTMLFormElement> = EventHandler<T, React.FormEvent<T>>;
export type KeyboardHandler<T = Element> = EventHandler<T, React.KeyboardEvent<T>>;
export type FocusHandler<T = Element> = EventHandler<T, React.FocusEvent<T>>;

/**
 * Callback function types
 */
export type VoidCallback = () => void;
export type AsyncVoidCallback = () => Promise<void>;
export type Callback<T> = (value: T) => void;
export type AsyncCallback<T> = (value: T) => Promise<void>;

/**
 * Predicate function types
 */
export type Predicate<T> = (value: T) => boolean;
export type AsyncPredicate<T> = (value: T) => Promise<boolean>;

// ============================================================================
// FORM TYPE PATTERNS
// ============================================================================

/**
 * Form data type generator
 */
export type FormData<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends number
    ? string | number
    : T[K] extends boolean
    ? boolean
    : T[K] extends Date
    ? string
    : T[K] extends Array<infer U>
    ? U[]
    : string;
};

/**
 * Form validation result type
 */
export type ValidationResult<T> = {
  [K in keyof T]?: string;
};

/**
 * Form state type
 */
export type FormState<T> = {
  values: T;
  errors: ValidationResult<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
};

// ============================================================================
// API TYPE PATTERNS
// ============================================================================

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * API endpoint configuration
 */
export interface ApiEndpoint<TRequest = unknown, TResponse = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  request?: TRequest;
  response: TResponse;
}

/**
 * Service method type generator
 */
export type ServiceMethod<TRequest, TResponse> = TRequest extends void
  ? () => Promise<TResponse>
  : (request: TRequest) => Promise<TResponse>;

// ============================================================================
// COMPONENT TYPE PATTERNS
// ============================================================================

/**
 * Component props with children
 */
export interface PropsWithChildren<_P = Record<string, unknown>> {
  children?: React.ReactNode;
}

/**
 * Component with required children
 */
export interface PropsWithRequiredChildren<_P = Record<string, unknown>> {
  children: React.ReactNode;
}

/**
 * Polymorphic component props
 */
export type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

/**
 * Forward ref component type
 */
export type ForwardRefComponent<T, P = Record<string, unknown>> = React.ForwardRefExoticComponent<
  P & React.RefAttributes<T>
>;

/**
 * Component variant props
 */
export type VariantProps<T extends Record<string, Record<string, string>>> = {
  [K in keyof T]?: keyof T[K];
};

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * Redux-like action type
 */
export interface Action<TType extends string = string, TPayload = unknown> {
  type: TType;
  payload?: TPayload;
  meta?: Record<string, unknown>;
  error?: boolean;
}

/**
 * Action creator type
 */
export type ActionCreator<TAction extends Action> = (
  ...args: TAction['payload'] extends undefined 
    ? [] 
    : [TAction['payload']]
) => TAction;

/**
 * Reducer type
 */
export type Reducer<TState, TAction extends Action> = (
  state: TState,
  action: TAction
) => TState;

// ============================================================================
// TYPE GUARDS & ASSERTIONS
// ============================================================================

/**
 * Generic type guard
 */
export function isOfType<T>(value: unknown, predicate: (value: unknown) => value is T): value is T {
  return predicate(value);
}

/**
 * Array type guard
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Object type guard
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Function type guard
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Promise type guard
 */
export function isPromise<T>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}

/**
 * Error type guard
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type assertion utilities
 */
export function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

export function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error(`Expected number, got ${typeof value}`);
  }
}

export function assertIsArray<T>(value: unknown): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array, got ${typeof value}`);
  }
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation rule type
 */
export type ValidationRule<T> = (value: T) => string | undefined;

/**
 * Validation schema type
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

/**
 * Validated type wrapper
 */
export type Validated<T> = {
  isValid: true;
  data: T;
  errors?: never;
} | {
  isValid: false;
  data?: never;
  errors: ValidationResult<T>;
};

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

/**
 * Memoization options
 */
export interface MemoOptions<TArgs extends unknown[], TReturn> {
  maxSize?: number;
  maxAge?: number;
  keySelector?: (...args: TArgs) => string;
  onEvict?: (key: string, value: TReturn) => void;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: number;
}

// ============================================================================
// TYPE SAFETY UTILITIES
// ============================================================================

/**
 * Exhaustive switch helper
 */
export function exhaustiveSwitch(value: never): never {
  throw new Error(`Unhandled case: ${value}`);
}

/**
 * Type-safe object keys
 */
export function typedKeys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Type-safe object entries
 */
export function typedEntries<T extends Record<string, unknown>>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Type-safe JSON parsing
 */
export function safeJsonParse<T>(
  json: string,
  validator: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ============================================================================
// TYPE SAFETY PATTERNS EXPORT
// ============================================================================

export const TypeSafetyPatterns = {
  isEmail,
  isNonEmptyString,
  isPositiveNumber,
  isOfType,
  isArray,
  isObject,
  isFunction,
  isPromise,
  isError,
  assertIsString,
  assertIsNumber,
  assertIsArray,
  exhaustiveSwitch,
  typedKeys,
  typedEntries,
  safeJsonParse,
} as const;

export default TypeSafetyPatterns;