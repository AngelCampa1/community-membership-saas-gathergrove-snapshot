/**
 * Common API response types and interfaces
 * These types provide type safety for all API interactions
 */

/**
 * Standard API response wrapper
 * @template T - The type of data in the response
 */
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  errors?: ApiError[];
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * Paginated API response
 * @template T - The type of items in the page
 */
export interface PaginatedResponse<T = unknown> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * API request with pagination
 */
export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * API request with search and filters
 * @template TFilters - The type of filters object
 */
export interface SearchRequest<TFilters = Record<string, unknown>> extends PaginatedRequest {
  searchTerm?: string;
  filters?: TFilters;
}

/**
 * Generic API mutation result
 * @template TData - The type of data returned
 * @template TVariables - The type of variables passed
 */
export interface MutationResult<TData = unknown, TVariables = unknown> {
  data?: TData;
  error?: ApiError;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

/**
 * Generic API query result
 * @template TData - The type of data returned
 */
export interface QueryResult<TData = unknown> {
  data?: TData;
  error?: ApiError;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => Promise<TData>;
}

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
}

/**
 * Axios error response structure
 */
export interface AxiosErrorResponse {
  data?: unknown;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Generic HTTP error
 */
export interface HttpError extends Error {
  response?: AxiosErrorResponse;
  request?: unknown;
  config?: ApiRequestConfig;
  code?: string;
  isAxiosError: boolean;
}

/**
 * API validation error for forms
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Batch operation result
 * @template T - The type of items processed
 */
export interface BatchResult<T = unknown> {
  successful: T[];
  failed: Array<{
    item: T;
    error: ApiError;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

/**
 * Export/download response
 */
export interface ExportResponse {
  exportId: string;
  fileName: string;
  fileSize: number;
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  downloadUrl: string;
  expiresAt: string;
  generatedAt: string;
}