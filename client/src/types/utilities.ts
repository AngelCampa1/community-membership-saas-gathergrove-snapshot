/**
 * Utility types for TypeScript
 * Common utility types and type helpers
 */

/**
 * Make specified properties optional
 * @template T - The object type
 * @template K - Keys to make optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specified properties required
 * @template T - The object type
 * @template K - Keys to make required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Make all nested properties optional
 * @template T - The object type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all nested properties required
 * @template T - The object type
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Make all properties readonly
 * @template T - The object type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Make all properties mutable (remove readonly)
 * @template T - The object type
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Extract nullable keys from object
 * @template T - The object type
 */
export type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : undefined extends T[K] ? K : never;
}[keyof T];

/**
 * Extract non-nullable keys from object
 * @template T - The object type
 */
export type NonNullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? never : undefined extends T[K] ? never : K;
}[keyof T];

/**
 * Make nullable properties optional
 * @template T - The object type
 */
export type OptionalNullable<T> = {
  [K in NonNullableKeys<T>]: T[K];
} & {
  [K in NullableKeys<T>]?: T[K];
};

/**
 * Extract function property names from object
 * @template T - The object type
 */
export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? K : never;
}[keyof T];

/**
 * Extract non-function property names from object
 * @template T - The object type
 */
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? never : K;
}[keyof T];

/**
 * Extract only function properties
 * @template T - The object type
 */
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

/**
 * Extract only non-function properties
 * @template T - The object type
 */
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

/**
 * Merge two types, with the second type overriding properties of the first
 * @template T - First type
 * @template U - Second type (overrides T)
 */
export type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Extract values from a const object as a union type
 * @template T - The object type
 */
export type ValueOf<T> = T[keyof T];

/**
 * Create a type with all properties from T that are assignable to U
 * @template T - Source type
 * @template U - Filter type
 */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

/**
 * Create a type with all properties from T that are not assignable to U
 * @template T - Source type
 * @template U - Filter type
 */
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * Unwrap a Promise type
 * @template T - Promise type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Unwrap nested Promise types
 * @template T - Promise type
 */
export type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;

/**
 * Extract the element type from an array
 * @template T - Array type
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Convert union to intersection
 * @template U - Union type
 */
export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/**
 * Flatten nested object types
 * @template T - Object type to flatten
 */
export type Flatten<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: O[K] }
    : never
  : T;

/**
 * Ensure at least one property is present
 * @template T - Object type
 */
export type AtLeastOne<T> = {
  [K in keyof T]: Pick<T, K> & Partial<Omit<T, K>>;
}[keyof T];

/**
 * Ensure exactly one property is present
 * @template T - Object type
 */
export type ExactlyOne<T> = {
  [K in keyof T]: Pick<T, K> & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];

/**
 * Create a branded type (nominal typing)
 * @template T - Base type
 * @template Brand - Brand identifier
 */
export type Brand<T, Brand> = T & { __brand: Brand };

/**
 * JSON-compatible types
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONArray
  | JSONObject;

export interface JSONObject {
  [key: string]: JSONValue;
}

export type JSONArray = Array<JSONValue>;

/**
 * Ensure type is JSON-serializable
 * @template T - Type to check
 */
export type Serializable<T> = T extends JSONValue
  ? T
  : T extends Date
  ? string
  : T extends Array<infer U>
  ? Array<Serializable<U>>
  : T extends object
  ? { [K in keyof T]: Serializable<T[K]> }
  : never;

/**
 * Constructor type
 * @template T - Instance type
 * @template Args - Constructor arguments
 */
export type Constructor<T = object, Args extends unknown[] = unknown[]> = new (
  ...args: Args
) => T;

/**
 * Abstract constructor type
 * @template T - Instance type
 */
export type AbstractConstructor<T = object> = abstract new (...args: unknown[]) => T;

/**
 * Class type (can be instantiated)
 * @template T - Instance type
 */
export type Class<T = object> = Constructor<T>;

/**
 * Mixin type helper
 * @template T - Base type
 * @template U - Mixin type
 */
export type Mixin<T, U> = T & U;

/**
 * Tuple of N elements
 * @template T - Element type
 * @template N - Tuple length
 */
export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

/**
 * String literal type helpers
 */
export type StringLiteral<T> = T extends string
  ? string extends T
    ? never
    : T
  : never;

/**
 * Numeric literal type helpers
 */
export type NumericLiteral<T> = T extends number
  ? number extends T
    ? never
    : T
  : never;

/**
 * Type-safe key paths for nested objects
 * @template T - Object type
 */
export type PathKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${PathKeys<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

/**
 * Get nested property type from path
 * @template T - Object type
 * @template Path - Property path
 */
export type PathValue<T, Path extends string> = Path extends keyof T
  ? T[Path]
  : Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : never;

/**
 * Strict object type (no index signature)
 */
export type StrictObject<T> = T & { [K in string | number | symbol]: never };

/**
 * Exclude null and undefined
 */
export type NonNullish<T> = T extends null | undefined ? never : T;

/**
 * Remove index signature from type
 */
export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : symbol extends K
    ? never
    : K]: T[K];
};