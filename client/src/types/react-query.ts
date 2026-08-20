/**
 * React Query type definitions
 * Provides type safety for data fetching and caching
 */

import {
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
  QueryFunction
} from '@tanstack/react-query';
import { ApiError, PaginatedResponse } from './api';

/**
 * Extended query options with typed data and error
 * @template TData - The type of data returned
 * @template TError - The type of error that can occur
 */
export type TypedQueryOptions<TData = unknown, TError = ApiError> = Omit<
  UseQueryOptions<TData, TError>,
  'queryKey' | 'queryFn'
>;

/**
 * Extended mutation options with typed variables, data, and error
 * @template TData - The type of data returned
 * @template TVariables - The type of variables passed
 * @template TError - The type of error that can occur
 */
export type TypedMutationOptions<
  TData = unknown,
  TVariables = unknown,
  TError = ApiError
> = UseMutationOptions<TData, TError, TVariables>;

/**
 * Query configuration for paginated data
 * @template TItem - The type of items in the page
 */
export interface PaginatedQueryConfig<TItem = unknown> {
  queryKey: QueryKey;
  queryFn: QueryFunction<PaginatedResponse<TItem>>;
  page?: number;
  pageSize?: number;
  keepPreviousData?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

/**
 * Infinite query configuration
 * @template TData - The type of data in each page
 */
export interface InfiniteQueryConfig<TData = unknown> {
  queryKey: QueryKey;
  queryFn: QueryFunction<TData>;
  getNextPageParam: (lastPage: TData, allPages: TData[]) => number | undefined;
  getPreviousPageParam?: (firstPage: TData, allPages: TData[]) => number | undefined;
  initialPageParam?: number;
}

/**
 * Optimistic update configuration
 * @template TData - The type of cached data
 * @template TVariables - The type of mutation variables
 */
export interface OptimisticUpdateConfig<TData = unknown, TVariables = unknown> {
  queryKey: QueryKey;
  updater: (oldData: TData | undefined, variables: TVariables) => TData;
  rollbackOnError?: boolean;
}

/**
 * Cache invalidation strategy
 */
export interface CacheInvalidationStrategy {
  /** Query keys to invalidate */
  queryKeys: QueryKey[];
  /** Whether to refetch active queries immediately */
  refetchActive?: boolean;
  /** Whether to refetch inactive queries */
  refetchInactive?: boolean;
  /** Custom refetch filter */
  refetchFilter?: (query: { queryKey: QueryKey }) => boolean;
}

/**
 * Query client utilities
 */
export interface QueryClientUtils {
  /** Invalidate queries by key */
  invalidate: (keys: QueryKey[]) => Promise<void>;

  /** Prefetch query data */
  prefetch: <TData = unknown>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TData>,
    options?: TypedQueryOptions<TData>
  ) => Promise<void>;

  /** Set query data directly */
  setQueryData: <TData = unknown>(queryKey: QueryKey, data: TData) => void;

  /** Get cached query data */
  getQueryData: <TData = unknown>(queryKey: QueryKey) => TData | undefined;

  /** Remove query from cache */
  removeQueries: (queryKey: QueryKey) => void;

  /** Clear entire cache */
  clear: () => void;
}

/**
 * Retry configuration for queries and mutations
 */
export interface RetryConfig {
  /** Maximum number of retries */
  maxRetries?: number;

  /** Delay between retries (ms) */
  retryDelay?: number | ((attemptIndex: number) => number);

  /** Function to determine if error should trigger retry */
  shouldRetry?: (failureCount: number, error: ApiError) => boolean;
}

/**
 * Query staleness configuration
 */
export interface StalenessConfig {
  /** Time until data is considered stale (ms) */
  staleTime?: number;

  /** Time until inactive data is removed from cache (ms) */
  cacheTime?: number;

  /** Whether to refetch on window focus */
  refetchOnWindowFocus?: boolean;

  /** Whether to refetch on reconnect */
  refetchOnReconnect?: boolean;

  /** Whether to refetch on mount */
  refetchOnMount?: boolean;
}

/**
 * Query result with pagination support
 * @template TItem - The type of items in the page
 */
export interface PaginatedQueryResult<TItem = unknown> {
  data?: PaginatedResponse<TItem>;
  items: TItem[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
}

/**
 * Infinite query result
 * @template TData - The type of data in each page
 */
export interface InfiniteQueryResult<TData = unknown> {
  data?: { pages: TData[]; pageParams: unknown[] };
  pages: TData[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Mutation result with loading states
 * @template TData - The type of data returned
 * @template TVariables - The type of variables passed
 */
export interface TypedMutationResult<TData = unknown, TVariables = unknown> {
  data?: TData;
  error: ApiError | null;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

/**
 * Query cache operations
 */
export interface QueryCacheOperations<TData = unknown> {
  /** Update query data optimistically */
  updateOptimistically: (queryKey: QueryKey, updater: (old: TData) => TData) => void;

  /** Rollback optimistic update */
  rollback: (queryKey: QueryKey) => void;

  /** Batch update multiple queries */
  batchUpdate: (updates: Array<{ queryKey: QueryKey; data: TData }>) => void;

  /** Invalidate related queries */
  invalidateRelated: (baseKey: QueryKey) => Promise<void>;
}

/**
 * Type-safe query key factory
 * @template TEntity - The entity type
 */
export interface QueryKeyFactory<TEntity extends string = string> {
  all: readonly [TEntity];
  lists: () => readonly [TEntity, 'list'];
  list: (filters?: Record<string, unknown>) => readonly [TEntity, 'list', Record<string, unknown>?];
  details: () => readonly [TEntity, 'detail'];
  detail: (id: string | number) => readonly [TEntity, 'detail', string | number];
}

/**
 * Helper to create typed query key factory
 */
export function createQueryKeys<TEntity extends string>(
  entity: TEntity
): QueryKeyFactory<TEntity> {
  return {
    all: [entity] as const,
    lists: () => [entity, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      filters ? [entity, 'list', filters] as const : [entity, 'list'] as const,
    details: () => [entity, 'detail'] as const,
    detail: (id: string | number) => [entity, 'detail', id] as const,
  };
}